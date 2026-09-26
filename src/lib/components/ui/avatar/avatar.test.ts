import { render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import Fixture from './avatar.spec.svelte';
import AvatarStatus from './avatar-status.svelte';

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
});

describe('Avatar', () => {
	test('renders the fallback with no frame or badge by default', () => {
		const { container } = render(Fixture);
		expect(screen.getByText('MR')).toBeInTheDocument();
		expect(screen.getByTestId('avatar')).toHaveClass('size-12');
		expect(container.querySelector('[data-slot="avatar-frame"]')).toBeNull();
		expect(screen.queryByRole('img')).not.toBeInTheDocument();
	});

	test('adds a named status badge beside the avatar', () => {
		const { container } = render(Fixture, { status: 'away' });
		const badge = screen.getByRole('img', { name: 'Away' });
		expect(badge).toHaveAttribute('data-status', 'away');
		const frame = container.querySelector('[data-slot="avatar-frame"]');
		expect(frame).toContainElement(screen.getByTestId('avatar'));
		expect(frame).toContainElement(badge);
		// Outside the clipped circle, so the badge is never cut off.
		expect(screen.getByTestId('avatar')).not.toContainElement(badge);
	});

	test('takes a custom status label', () => {
		render(Fixture, { status: 'busy', statusLabel: 'In a focus session' });
		expect(screen.getByRole('img', { name: 'In a focus session' })).toBeInTheDocument();
	});

	test('turns into the new shape when the status changes', async () => {
		const { rerender } = render(Fixture, { status: 'online' });
		expect(screen.getByRole('img')).toContainHTML('fill-success');
		await rerender({ status: 'offline' });
		const badge = screen.getByRole('img', { name: 'Offline' });
		expect(badge).toHaveAttribute('data-status', 'offline');
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(badge.querySelectorAll('svg')).toHaveLength(1);
		expect(badge.querySelector('.stroke-muted-foreground')).not.toBeNull();
	});
});

describe('AvatarStatus', () => {
	test('stands alone with a shape for each presence', () => {
		const shapes = {
			online: 'circle.fill-success',
			away: 'path.fill-warning',
			busy: 'rect.fill-destructive-foreground',
			offline: 'circle.stroke-muted-foreground'
		} as const;
		for (const [status, selector] of Object.entries(shapes)) {
			const { container, unmount } = render(AvatarStatus, {
				status: status as keyof typeof shapes
			});
			expect(container.querySelector(selector)).not.toBeNull();
			unmount();
		}
	});

	test('with a badge, placement classes move to the frame and the look stays on the avatar', () => {
		const { container } = render(Fixture, {
			status: 'online',
			class: 'size-8 -ml-2 absolute top-0 sm:ml-4 z-10 ring-2 hover:scale-105',
			frameClass: 'order-first'
		});
		const frame = container.querySelector('[data-slot="avatar-frame"]') as HTMLElement;
		const avatar = screen.getByTestId('avatar');
		for (const name of ['-ml-2', 'absolute', 'top-0', 'sm:ml-4', 'z-10', 'order-first']) {
			expect(frame).toHaveClass(name);
			expect(avatar).not.toHaveClass(name);
		}
		for (const name of ['size-8', 'ring-2', 'hover:scale-105']) {
			expect(avatar).toHaveClass(name);
			expect(frame).not.toHaveClass(name);
		}
	});

	test('without a badge, every class stays on the avatar', () => {
		render(Fixture, { class: 'size-8 -ml-2 absolute' });
		expect(screen.getByTestId('avatar')).toHaveClass('size-8', '-ml-2', 'absolute');
	});
});
