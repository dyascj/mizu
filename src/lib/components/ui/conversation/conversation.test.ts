import { act, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import Harness from './conversation.test.svelte';

type Message = { id: number; role: 'user' | 'assistant'; text: string };

const seed: Message[] = [
	{ id: 0, role: 'user', text: 'Did the migration finish?' },
	{ id: 1, role: 'assistant', text: 'It did.' },
	{ id: 2, role: 'assistant', text: 'All 48 tables moved.' }
];

let resize: (() => void) | undefined;
let contentHeight = 1000;

/** The thread grows, and the resize observer hears about it. */
async function grow() {
	contentHeight += 80;
	await act(() => resize?.());
}
let scrollTo: ReturnType<typeof vi.fn>;

beforeEach(() => {
	// jsdom has no layout, Web Animations, or ResizeObserver; fake just enough.
	Element.prototype.animate = function () {
		const animation = { onfinish: null as null | (() => void), cancel() {}, currentTime: 0 };
		setTimeout(() => animation.onfinish?.());
		return animation as unknown as Animation;
	};
	vi.stubGlobal(
		'ResizeObserver',
		class {
			constructor(callback: () => void) {
				resize = callback;
			}
			observe() {}
			disconnect() {}
		}
	);
	scrollTo = vi.fn(function (this: HTMLElement, options: ScrollToOptions) {
		this.scrollTop = Math.max(0, (options.top ?? 0) - this.clientHeight);
	});
	Element.prototype.scrollTo = scrollTo as unknown as Element['scrollTo'];
	Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
		configurable: true,
		get() {
			return 1000;
		}
	});
	contentHeight = 1000;
	Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
		configurable: true,
		get() {
			return contentHeight;
		}
	});
	Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
		configurable: true,
		get() {
			return 400;
		}
	});
});

afterEach(() => {
	delete (Element.prototype as Partial<Element>).animate;
	delete (Element.prototype as Partial<Element>).scrollTo;
	for (const name of ['scrollHeight', 'clientHeight', 'offsetHeight']) {
		Reflect.deleteProperty(HTMLElement.prototype, name);
	}
	vi.unstubAllGlobals();
	resize = undefined;
});

function setup(props: { messages?: Message[]; typing?: boolean } = {}) {
	const result = render(Harness, { messages: seed, ...props });
	const log = screen.getByRole('log', { name: 'Chat with Ops' });
	const jump = result.container.querySelector('button')!;
	return { ...result, log, jump };
}

async function scrollAway(log: HTMLElement) {
	log.scrollTop = 100;
	await fireEvent.scroll(log);
}

describe('Conversation', () => {
	test('renders a focusable message log that starts at the latest message', () => {
		const { log, jump } = setup();
		expect(log).toHaveAttribute('tabindex', '0');
		expect(log.scrollTop).toBe(600);
		expect(jump.inert).toBe(true);
	});

	test('names each speaker for assistive technology and groups runs', () => {
		const { container } = setup();
		expect(screen.getByText('It did.').textContent).toContain('Ops:');
		expect(screen.getByText('Did the migration finish?').textContent).toContain('You:');
		const rows = container.querySelectorAll('[data-role]');
		expect(rows[1]).toHaveClass('mt-3');
		expect(rows[2]).toHaveClass('mt-0.5');
	});

	test('shows a typing bubble while a reply is on its way', async () => {
		const { rerender } = setup();
		expect(screen.queryByRole('status', { name: 'Ops is typing' })).toBeNull();
		await rerender({ messages: seed, typing: true });
		expect(screen.getByRole('status', { name: 'Ops is typing' })).toBeInTheDocument();
	});

	test('follows new content while the reader is at the bottom', async () => {
		const { rerender, jump } = setup();
		scrollTo.mockClear();
		await rerender({ messages: [...seed, { id: 3, role: 'assistant', text: 'Anything else?' }] });
		await grow();
		expect(scrollTo).toHaveBeenCalled();
		expect(jump.inert).toBe(true);
	});

	test('offers a jump to the latest reply instead of yanking a reader who scrolled up', async () => {
		const { rerender, log, jump } = setup();
		await scrollAway(log);
		scrollTo.mockClear();
		await rerender({ messages: [...seed, { id: 3, role: 'assistant', text: 'Anything else?' }] });
		await grow();
		expect(scrollTo).not.toHaveBeenCalled();
		expect(jump.inert).toBe(false);
		expect(screen.getByRole('button', { name: 'New message' })).toBe(jump);

		await fireEvent.click(jump);
		expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 1000 }));
		expect(jump.inert).toBe(true);
	});

	test('lets the reader scroll up while a streaming reply keeps growing the thread', async () => {
		const { log, jump } = setup();
		// A chunk lands and the thread starts a smooth follow.
		await grow();
		// The reader scrolls up before that follow has ended.
		await scrollAway(log);
		scrollTo.mockClear();
		await grow();
		await grow();
		expect(scrollTo).not.toHaveBeenCalled();
		expect(jump.inert).toBe(true);
	});

	test('always brings your own message into view', async () => {
		const { rerender, log, jump } = setup();
		await scrollAway(log);
		scrollTo.mockClear();
		await rerender({ messages: [...seed, { id: 3, role: 'user', text: 'Thanks' }] });
		await grow();
		expect(scrollTo).toHaveBeenCalled();
		expect(jump.inert).toBe(true);
	});

	test('hides the jump button once the reader scrolls back down', async () => {
		const { rerender, log, jump } = setup();
		await scrollAway(log);
		await rerender({ messages: [...seed, { id: 3, role: 'assistant', text: 'Anything else?' }] });
		expect(jump.inert).toBe(false);
		log.scrollTop = 580;
		await fireEvent.scroll(log);
		expect(jump.inert).toBe(true);
	});
});
