import { act, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import NetworkStatus from './network-status.svelte';

const offlineText = "You're offline. Changes will sync when you reconnect.";

let online = true;

async function goOnline(value: boolean) {
	online = value;
	await act(() => window.dispatchEvent(new Event(value ? 'online' : 'offline')));
}

// jsdom has no Web Animations; finish every Svelte transition on the next tick.
function stubAnimations() {
	Element.prototype.animate = function () {
		const animation = { onfinish: null as null | (() => void), cancel() {}, currentTime: 0 };
		setTimeout(() => animation.onfinish?.());
		return animation as unknown as Animation;
	};
}

beforeEach(() => {
	online = true;
	vi.spyOn(navigator, 'onLine', 'get').mockImplementation(() => online);
	stubAnimations();
});

afterEach(() => {
	delete (Element.prototype as Partial<Element>).animate;
	vi.useRealTimers();
	vi.restoreAllMocks();
});

describe('NetworkStatus', () => {
	test('keeps an empty polite live region while online', () => {
		render(NetworkStatus);
		const status = screen.getByRole('status');
		expect(status).toHaveAttribute('aria-live', 'polite');
		expect(status).toBeEmptyDOMElement();
	});

	test('reads the connection when it mounts', () => {
		online = false;
		render(NetworkStatus);
		expect(screen.getByRole('status')).toHaveTextContent(offlineText);
	});

	test('announces going offline, then coming back, then clears', async () => {
		vi.useFakeTimers();
		render(NetworkStatus, { resetAfter: 2000 });
		const status = screen.getByRole('status');

		await goOnline(false);
		expect(status).toHaveTextContent(offlineText);

		await goOnline(true);
		expect(status).toHaveTextContent('Back online');

		await act(() => vi.advanceTimersByTimeAsync(1999));
		expect(status).toHaveTextContent('Back online');
		await act(() => vi.advanceTimersByTimeAsync(20));
		expect(status).toBeEmptyDOMElement();
	});

	test('accepts custom labels', async () => {
		render(NetworkStatus, { offlineLabel: 'No connection', onlineLabel: 'Connected' });
		await goOnline(false);
		expect(screen.getByRole('status')).toHaveTextContent('No connection');
		await goOnline(true);
		expect(screen.getByRole('status')).toHaveTextContent('Connected');
	});

	test('follows a forced status instead of the browser', async () => {
		const { rerender } = render(NetworkStatus, { forceStatus: 'offline' });
		expect(screen.getByRole('status')).toHaveTextContent(offlineText);
		await goOnline(true);
		expect(screen.getByRole('status')).toHaveTextContent(offlineText);
		await rerender({ forceStatus: 'online' });
		expect(screen.getByRole('status')).toHaveTextContent('Back online');
	});

	test('stops listening and cancels the timer when unmounted', async () => {
		const set = vi.spyOn(globalThis, 'setTimeout');
		const clear = vi.spyOn(globalThis, 'clearTimeout');
		const remove = vi.spyOn(window, 'removeEventListener');
		const { unmount } = render(NetworkStatus, { resetAfter: 4321 });
		await goOnline(false);
		await goOnline(true);
		const reset = set.mock.results[set.mock.calls.findIndex(([, delay]) => delay === 4321)];
		expect(reset).toBeDefined();

		unmount();
		expect(clear).toHaveBeenCalledWith(reset.value);
		const events = remove.mock.calls.map(([type]) => type);
		expect(events).toContain('online');
		expect(events).toContain('offline');
	});
});
