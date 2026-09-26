import { act, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import Presence from './presence.svelte';

function stubMedia({ reduce = false, fine = true } = {}) {
	vi.stubGlobal('matchMedia', (query: string) => ({
		matches: query.includes('reduce') ? reduce : query.includes('pointer: fine') ? fine : false,
		media: query,
		addEventListener() {},
		removeEventListener() {}
	}));
}

afterEach(() => {
	vi.restoreAllMocks();
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe('Presence', () => {
	test('describes the current state to assistive technology', async () => {
		stubMedia();
		const { rerender } = render(Presence, { state: 'thinking' });
		expect(screen.getByRole('img', { name: 'Assistant is thinking' })).toHaveAttribute(
			'data-state',
			'thinking'
		);
		await rerender({ state: 'speaking', label: 'Mizu is answering' });
		expect(screen.getByRole('img', { name: 'Mizu is answering' })).toBeInTheDocument();
	});

	test('clamps size and only applies the voice level while voiced', async () => {
		stubMedia();
		const { rerender } = render(Presence, { size: 4000, volume: 3, state: 'idle' });
		const root = screen.getByRole('img');
		expect(root.style.getPropertyValue('--presence-size')).toBe('480px');
		expect(root.style.getPropertyValue('--presence-level')).toBe('0');
		await rerender({ size: 4000, volume: 3, state: 'listening' });
		expect(root.style.getPropertyValue('--presence-level')).toBe('1');
	});

	test('blinks on a timer and stops blinking when unmounted', async () => {
		stubMedia();
		vi.useFakeTimers();
		vi.spyOn(Math, 'random').mockReturnValue(0.5);
		const { unmount } = render(Presence);
		const root = screen.getByRole('img');
		expect(root).not.toHaveAttribute('data-blinking');
		await act(() => vi.advanceTimersByTimeAsync(2600));
		expect(root).toHaveAttribute('data-blinking');
		await act(() => vi.advanceTimersByTimeAsync(140));
		expect(root).not.toHaveAttribute('data-blinking');
		unmount();
		expect(vi.getTimerCount()).toBe(0);
	});

	test('holds still for reduced motion', async () => {
		stubMedia({ reduce: true });
		vi.useFakeTimers();
		render(Presence);
		await act(() => vi.advanceTimersByTimeAsync(10_000));
		expect(screen.getByRole('img')).not.toHaveAttribute('data-blinking');
		expect(vi.getTimerCount()).toBe(0);
	});

	test('squishes while pressed only when interactive', async () => {
		stubMedia();
		const { rerender } = render(Presence);
		const root = screen.getByRole('img');
		await fireEvent.pointerDown(root);
		expect(root).toHaveAttribute('data-pressed');
		await fireEvent.pointerUp(root);
		expect(root).not.toHaveAttribute('data-pressed');

		await rerender({ interactive: false });
		await fireEvent.pointerDown(root);
		expect(root).not.toHaveAttribute('data-pressed');
	});

	test('follows a fine pointer and stops listening when destroyed', async () => {
		stubMedia();
		vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
			callback(0);
			return 1;
		});
		const remove = vi.spyOn(window, 'removeEventListener');
		const { unmount } = render(Presence);
		const root = screen.getByRole('img');
		root.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100 }) as DOMRect;

		await act(() => window.dispatchEvent(new PointerEvent('pointermove', { clientX: 850 })));
		expect(Number(root.style.getPropertyValue('--gaze-x'))).toBeCloseTo(1);
		expect(Number(root.style.getPropertyValue('--gaze-y'))).toBeCloseTo(-0.06, 1);

		unmount();
		expect(remove).toHaveBeenCalledWith('pointermove', expect.any(Function));
	});
});
