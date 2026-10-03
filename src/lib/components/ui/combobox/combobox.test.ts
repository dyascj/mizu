import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import Harness from './combobox.test.svelte';
import { scrollReach } from './scroll-reach.js';

let finish: (() => void) | undefined;
const nativeAnimate = Element.prototype.animate;
const animate = vi.fn<Element['animate']>(function fakeAnimate() {
	const animation = { cancel() {}, onfinish: null as null | (() => void), oncancel: null };
	finish = () => animation.onfinish?.();
	return animation as unknown as Animation;
});

function stubReducedMotion(reduce: boolean) {
	vi.stubGlobal('matchMedia', (query: string) => ({
		matches: reduce && query.includes('reduce'),
		media: query,
		addEventListener() {},
		removeEventListener() {}
	}));
}

beforeEach(() => {
	Element.prototype.animate = animate;
	animate.mockClear();
	stubReducedMotion(false);
	vi.stubGlobal(
		'ResizeObserver',
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		}
	);
	Element.prototype.scrollIntoView ??= () => {};
	Element.prototype.hasPointerCapture ??= () => false;
});

afterEach(() => {
	Element.prototype.animate = nativeAnimate;
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

const mouse = { button: 0, pointerType: 'mouse', pointerId: 1 };

async function openList() {
	const input = screen.getByRole('combobox', { name: 'Delegate to' });
	await fireEvent.keyDown(input, { key: 'ArrowDown' });
	await screen.findByRole('listbox');
	return input as HTMLInputElement;
}

describe('Combobox', () => {
	test('one pill carries the highlight for the whole list', async () => {
		render(Harness);
		await openList();
		const pills = document.querySelectorAll('[data-highlight-pill]');
		expect(pills).toHaveLength(1);
		expect(pills[0]).toHaveAttribute('aria-hidden', 'true');
		expect(pills[0].parentElement).toHaveAttribute('data-highlight-glide');
	});

	test('the picked option flies into the field, which shows its text once it lands', async () => {
		render(Harness);
		const input = await openList();
		const scribe = screen.getByRole('option', { name: 'Meeting scribe' });
		vi.spyOn(scribe, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 120, 200, 32));
		vi.spyOn(input, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 200, 40));

		await fireEvent.pointerUp(scribe, mouse);
		await waitFor(() => expect(input.value).toBe('Meeting scribe'));

		expect(animate).toHaveBeenCalledOnce();
		const ghost = animate.mock.contexts[0] as HTMLElement;
		expect(ghost).toHaveTextContent('Meeting scribe');
		expect(ghost).toHaveAttribute('aria-hidden', 'true');
		expect(input).toHaveAttribute('data-landing');

		finish?.();
		await waitFor(() => expect(input).not.toHaveAttribute('data-landing'));
		expect(ghost.isConnected).toBe(false);
	});

	test('in right-to-left text the list mirrors and the pick lands on the right edge of the field', async () => {
		document.body.style.direction = 'rtl';
		try {
			render(Harness);
			const input = await openList();
			expect(screen.getByRole('listbox').closest('[dir]')).toHaveAttribute('dir', 'rtl');
			const scribe = screen.getByRole('option', { name: 'Meeting scribe' });
			vi.spyOn(scribe, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 120, 200, 32));
			vi.spyOn(input, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 200, 40));
			vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(300);

			await fireEvent.pointerUp(scribe, mouse);
			await waitFor(() => expect(input.value).toBe('Meeting scribe'));
			const ghost = animate.mock.contexts[0] as HTMLElement;
			expect(ghost.style.left).toBe('');
			expect(ghost.style.right).toBe('100px');
			expect(ghost.style.transformOrigin).toBe('100% 50%');
			finish?.();
		} finally {
			document.body.style.direction = '';
		}
	});

	test('a second pick mid-flight leaves no stray copy behind', async () => {
		// Like browsers, a cancelled animation reports it a moment later.
		const flights: { onfinish: null | (() => void); oncancel: null | (() => void) }[] = [];
		const lateCancel = function () {
			const flight = {
				onfinish: null as null | (() => void),
				oncancel: null as null | (() => void),
				cancel() {
					queueMicrotask(() => flight.oncancel?.());
				}
			};
			flights.push(flight);
			return flight as unknown as Animation;
		};
		animate.mockImplementationOnce(lateCancel).mockImplementationOnce(lateCancel);
		render(Harness);
		const input = await openList();
		vi.spyOn(input, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 200, 40));
		const pick = async (name: string) => {
			const option = screen.getByRole('option', { name });
			vi.spyOn(option, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 120, 200, 32));
			await fireEvent.pointerUp(option, mouse);
			await waitFor(() => expect(input.value).toBe(name));
		};

		await pick('Meeting scribe');
		await openList();
		await pick('Research agent');
		expect(animate).toHaveBeenCalledTimes(2);
		const [first, second] = animate.mock.contexts as HTMLElement[];
		await waitFor(() => expect(first.isConnected).toBe(false));
		expect(second.isConnected).toBe(true);
		expect(input).toHaveAttribute('data-landing');

		flights[1].onfinish?.();
		await waitFor(() => expect(input).not.toHaveAttribute('data-landing'));
		expect(second.isConnected).toBe(false);
	});

	test('reduced motion swaps the text in place', async () => {
		stubReducedMotion(true);
		render(Harness);
		const input = await openList();
		await fireEvent.pointerUp(screen.getByRole('option', { name: 'Research agent' }), mouse);
		await waitFor(() => expect(input.value).toBe('Research agent'));
		expect(animate).not.toHaveBeenCalled();
		expect(input).not.toHaveAttribute('data-landing');
	});
});

describe('scrollReach', () => {
	/** A viewport whose content is `content` px tall inside `height` px. */
	function viewport(content: number, height: number) {
		const el = document.createElement('div');
		el.setAttribute('role', 'presentation');
		Object.defineProperty(el, 'scrollHeight', { configurable: true, get: () => content });
		Object.defineProperty(el, 'clientHeight', { configurable: true, get: () => height });
		return el;
	}

	test('puts a list that scrolls in reach of the keyboard, as a group of the listbox', () => {
		const el = viewport(352, 280);
		scrollReach(el);
		expect(el).toHaveAttribute('tabindex', '0');
		expect(el).toHaveAttribute('role', 'group');
	});

	test('leaves a list that fits out of the tab order', () => {
		const el = viewport(288, 288);
		scrollReach(el);
		expect(el).not.toHaveAttribute('tabindex');
		expect(el).toHaveAttribute('role', 'presentation');
	});
});
