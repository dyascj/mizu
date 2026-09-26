import { render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import LiveIndicator from './live-indicator.svelte';

// jsdom has no Web Animations API; Svelte transitions finish on the next microtask.
const nativeAnimate = Element.prototype.animate;
beforeEach(() => {
	Element.prototype.animate = function () {
		return {
			cancel() {},
			set onfinish(done: () => void) {
				queueMicrotask(done);
			}
		} as unknown as Animation;
	};
});
afterEach(() => {
	Element.prototype.animate = nativeAnimate;
	vi.unstubAllGlobals();
});

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
const live = (container: HTMLElement) => container.querySelector('[aria-live="polite"]');

describe('LiveIndicator', () => {
	test('tells screen readers the state and a rounded audience, once', () => {
		const { container } = render(LiveIndicator, { viewers: 1284 });
		expect(container.querySelector('.sr-only')?.textContent?.trim()).toBe(
			'Live, about 1,284 watching'
		);
		// The rolling digits are hidden, so the count is never read twice.
		expect(
			screen.getByText('Live', { selector: '.col-start-1' }).closest('[aria-hidden]')
		).not.toBeNull();
		expect(live(container)?.textContent).toBe('');
	});

	test('rolls only the digits that change, in the direction the count moved', async () => {
		const { container, rerender } = render(LiveIndicator, { viewers: 1284 });
		const root = container.firstElementChild as HTMLElement;
		const columns = () =>
			Array.from(root.querySelectorAll('.inline-grid')).map((column) => column.textContent);

		await rerender({ viewers: 1287 });
		expect(root).toHaveAttribute('data-direction', 'up');
		await settle();
		expect(columns()).toEqual(['1', ',', '2', '8', '7']);

		await rerender({ viewers: 1279 });
		expect(root).toHaveAttribute('data-direction', 'down');
	});

	test('turns hollow while reconnecting and announces the drop and the return', async () => {
		const { container, rerender } = render(LiveIndicator, { viewers: 90 });
		await rerender({ viewers: 90, reconnecting: true });
		expect(container.firstElementChild).toHaveAttribute('data-state', 'reconnecting');
		expect(container.querySelector('.live-blink')).not.toBeNull();
		expect(container.querySelector('.live-sonar')).toBeNull();
		expect(live(container)?.textContent).toBe('Connection lost. Reconnecting');

		await rerender({ viewers: 90, reconnecting: false });
		expect(live(container)?.textContent).toBe('Back live');
	});

	test('holds the dot still when paused and shows the status alone without viewers', () => {
		const { container } = render(LiveIndicator, { paused: true, label: 'Listening' });
		expect(container.querySelector('.live-sonar')).toBeNull();
		expect(container.querySelector('.live-paused')).not.toBeNull();
		expect(container.querySelector('.sr-only')?.textContent?.trim()).toBe('Listening');
		expect(container.querySelector('.inline-grid')).toBeNull();
	});
});
