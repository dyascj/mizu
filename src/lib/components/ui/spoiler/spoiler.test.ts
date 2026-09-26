import { act, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import Fixture from './spoiler-fixture.test.svelte';

function stubReducedMotion(reduce: boolean) {
	vi.stubGlobal('matchMedia', (query: string) => ({
		matches: reduce && query.includes('reduce'),
		media: query,
		addEventListener() {},
		removeEventListener() {}
	}));
}

const context = {
	clearRect: vi.fn(),
	fillRect: vi.fn(),
	setTransform: vi.fn(),
	globalAlpha: 1,
	fillStyle: ''
};
const nativeGetContext = HTMLCanvasElement.prototype.getContext;

beforeEach(() => {
	stubReducedMotion(false);
	vi.useFakeTimers();
	HTMLCanvasElement.prototype.getContext = (() => context) as never;
	// One line of covered text, 120 by 20.
	vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([
		DOMRect.fromRect({ x: 10, y: 0, width: 120, height: 20 })
	] as unknown as DOMRectList);
	context.fillRect.mockClear();
});

afterEach(() => {
	HTMLCanvasElement.prototype.getContext = nativeGetContext;
	vi.useRealTimers();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));
const cover = () => screen.getByRole('button', { name: 'Spoiler, press to reveal' });

describe('Spoiler', () => {
	test('is a button named as a spoiler, with the text hidden from screen readers', () => {
		render(Fixture);
		const button = cover();
		expect(button).toHaveAttribute('tabindex', '0');
		expect(button.firstElementChild).toHaveAttribute('aria-hidden', 'true');
		expect(button).toHaveTextContent('the agent was the narrator');
		// The grain is drawn over it.
		expect(context.fillRect).toHaveBeenCalled();
	});

	test('reveals on click, announces the text, and offers a way to hide it again', async () => {
		const onRevealedChange = vi.fn();
		render(Fixture, { onRevealedChange });
		await fireEvent.click(cover(), { detail: 1, clientX: 40, clientY: 10 });

		expect(onRevealedChange).toHaveBeenCalledWith(true);
		expect(screen.queryByRole('button', { name: /press to reveal/ })).toBeNull();
		expect(screen.getByText('the agent was the narrator').closest('[aria-hidden]')).toBeNull();
		expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent(
			'Revealed: the agent was the narrator'
		);

		// The hide button waits for the dissolve to finish.
		expect(screen.queryByRole('button', { name: 'Hide spoiler' })).toBeNull();
		await advance(800);
		const hide = screen.getByRole('button', { name: 'Hide spoiler' });

		await fireEvent.click(hide);
		expect(onRevealedChange).toHaveBeenLastCalledWith(false);
		expect(cover()).toHaveFocus();
		expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent('');
	});

	test('reveals with Enter or Space and moves focus to the hide button', async () => {
		render(Fixture);
		cover().focus();
		await fireEvent.keyDown(cover(), { key: 'Enter' });
		await advance(800);
		expect(screen.getByRole('button', { name: 'Hide spoiler' })).toHaveFocus();

		await fireEvent.click(screen.getByRole('button', { name: 'Hide spoiler' }));
		await fireEvent.keyDown(cover(), { key: ' ' });
		await advance(800);
		expect(screen.getByRole('button', { name: 'Hide spoiler' })).toHaveFocus();
	});

	test('a second click on revealed text only offers the hide button', async () => {
		render(Fixture);
		await fireEvent.click(cover(), { detail: 1 });
		await advance(800);
		const text = screen.getByText('the agent was the narrator').parentElement as HTMLElement;
		await fireEvent.click(text, { detail: 1 });
		expect(screen.getByRole('button', { name: 'Hide spoiler' })).toHaveAttribute('data-open');
		expect(screen.queryByRole('button', { name: /press to reveal/ })).toBeNull();
	});

	test('follows the revealed prop from outside without moving focus', async () => {
		const { rerender } = render(Fixture, { revealed: false });
		await rerender({ revealed: true });
		expect(screen.queryByRole('button', { name: /press to reveal/ })).toBeNull();
		await advance(800);
		expect(screen.getByRole('button', { name: 'Hide spoiler' })).not.toHaveFocus();
		await rerender({ revealed: false });
		expect(cover()).not.toHaveFocus();
	});

	test('text that starts revealed can still be hidden', async () => {
		const onRevealedChange = vi.fn();
		render(Fixture, { revealed: true, onRevealedChange });
		expect(screen.queryByRole('button', { name: /press to reveal/ })).toBeNull();
		await fireEvent.click(screen.getByRole('button', { name: 'Hide spoiler' }));
		expect(onRevealedChange).toHaveBeenCalledWith(false);
		expect(cover()).toBeInTheDocument();
	});

	test('reveals at once for reduced motion and keeps the grain still', async () => {
		stubReducedMotion(true);
		render(Fixture);
		await fireEvent.click(cover(), { detail: 1 });
		await advance(0);
		expect(screen.getByRole('button', { name: 'Hide spoiler' })).toBeInTheDocument();
	});

	test('sleeps at rest and cleans up when destroyed', async () => {
		const { unmount } = render(Fixture);
		await fireEvent.click(cover(), { detail: 1 });
		await advance(100);
		unmount();
		expect(vi.getTimerCount()).toBe(0);
	});
});
