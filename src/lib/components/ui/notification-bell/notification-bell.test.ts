import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import NotificationBell from './notification-bell.svelte';
import type { BellNotification } from './notification-bell.svelte';

function stubReducedMotion(reduce: boolean) {
	vi.stubGlobal('matchMedia', (query: string) => ({
		matches: reduce && query.includes('reduce'),
		media: query,
		addEventListener() {},
		removeEventListener() {}
	}));
}

const nativeAnimate = Element.prototype.animate;
const animate = vi.fn<Element['animate']>(function fakeAnimate() {
	return {
		cancel() {},
		set onfinish(done: () => void) {
			queueMicrotask(done);
		}
	} as unknown as Animation;
});

beforeEach(() => {
	Element.prototype.animate = animate;
	animate.mockClear();
	stubReducedMotion(false);
	vi.stubGlobal('requestAnimationFrame', () => 1);
	vi.stubGlobal(
		'ResizeObserver',
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		}
	);
});

afterEach(() => {
	Element.prototype.animate = nativeAnimate;
	vi.unstubAllGlobals();
});

const inbox: BellNotification[] = [
	{ id: 'n3', title: 'Support agent drafted 12 replies', time: '5m' },
	{ id: 'n2', title: 'Nightly eval run finished', time: '1h' },
	{ id: 'n1', title: 'Your API key was rotated', time: '2d' }
];

const rings = () =>
	animate.mock.calls.filter(([frames]) =>
		(frames as Keyframe[]).some?.((frame) => 'rotate' in frame)
	);
const live = (container: HTMLElement) =>
	container.parentElement?.querySelector('[aria-live="polite"]');

describe('NotificationBell', () => {
	test('counts everything newer than the read marker', () => {
		render(NotificationBell, { notifications: inbox, readId: 'n2' });
		expect(screen.getByRole('button', { name: 'Notifications, 1 unread' })).toBeInTheDocument();
	});

	test('with nothing unread the bell has no badge', () => {
		const { container } = render(NotificationBell, { notifications: inbox, readId: 'n3' });
		expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
		expect(container.querySelector('.bg-primary.absolute')).toBeNull();
	});

	test('caps a long count', () => {
		const many = Array.from({ length: 14 }, (_, i) => ({ id: `m${i}`, title: `Run ${i}` }));
		const { container } = render(NotificationBell, { notifications: many });
		expect(screen.getByRole('button', { name: 'Notifications, 14 unread' })).toBeInTheDocument();
		expect(container.querySelector('.bg-primary.absolute')?.textContent).toMatch(/9.*\+$/);
	});

	test('a new arrival rings the bell, raises the count, and is announced', async () => {
		const { container, rerender } = render(NotificationBell, {
			notifications: inbox,
			readId: 'n2'
		});
		expect(rings()).toHaveLength(0);
		await rerender({
			notifications: [{ id: 'n4', title: 'Eval run passed 48 of 50 checks' }, ...inbox]
		});
		expect(rings()).toHaveLength(1);
		expect(screen.getByRole('button', { name: 'Notifications, 2 unread' })).toBeInTheDocument();
		expect(live(container)).toHaveTextContent('New notification: Eval run passed 48 of 50 checks');
	});

	test('removing the newest row neither rings nor announces the one below it', async () => {
		const { container, rerender } = render(NotificationBell, { notifications: inbox });
		await rerender({ notifications: inbox.slice(1) });
		expect(rings()).toHaveLength(0);
		expect(live(container)).toHaveTextContent('');
		await rerender({ notifications: [{ id: 'n4', title: 'Batch ready' }, ...inbox.slice(1)] });
		expect(rings()).toHaveLength(1);
		expect(live(container)).toHaveTextContent('New notification: Batch ready');
	});

	test('a parent that closes the panel marks the inbox read too', async () => {
		const { rerender } = render(NotificationBell, {
			notifications: inbox,
			readId: 'n2',
			open: true
		});
		await rerender({ open: false });
		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'Notifications' })).toHaveAttribute(
				'aria-expanded',
				'false'
			)
		);
	});

	test('reduced motion announces the arrival without ringing', async () => {
		stubReducedMotion(true);
		const { container, rerender } = render(NotificationBell, { notifications: inbox });
		await rerender({ notifications: [{ id: 'n4', title: 'Batch ready' }, ...inbox] });
		expect(rings()).toHaveLength(0);
		expect(live(container)).toHaveTextContent('New notification: Batch ready');
	});

	test('opening reads the inbox: the badge leaves, the dots stay until it closes', async () => {
		const onOpenChange = vi.fn();
		render(NotificationBell, { notifications: inbox, readId: 'n2', onOpenChange });
		const bell = screen.getByRole('button', { name: 'Notifications, 1 unread' });

		await fireEvent.click(bell);
		expect(onOpenChange).toHaveBeenCalledWith(true);
		expect(bell).toHaveAttribute('aria-expanded', 'true');
		expect(bell).toHaveAccessibleName('Notifications');
		const panel = await screen.findByRole('dialog', { name: 'Notifications' });
		expect(panel).toHaveTextContent('Unread: Support agent drafted 12 replies');
		expect(panel).not.toHaveTextContent('Unread: Nightly eval run finished');

		await fireEvent.keyDown(document.activeElement ?? panel, { key: 'Escape' });
		await waitFor(() => expect(bell).toHaveAttribute('aria-expanded', 'false'));
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
		expect(bell).toHaveAccessibleName('Notifications');
	});
});
