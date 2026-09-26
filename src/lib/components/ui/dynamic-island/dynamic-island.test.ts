import { act, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import Fixture from './dynamic-island.test.svelte';

// jsdom has no Web Animations API. Transitions are held open until released,
// so the moment when old and new content overlap can be inspected.
const nativeAnimate = Element.prototype.animate;
let pending: (() => void)[] = [];
function fakeAnimate() {
	return {
		cancel() {},
		set onfinish(done: () => void) {
			pending.push(done);
		}
	} as unknown as Animation;
}
const finishTransitions = () =>
	act(async () => {
		// A delayed transition waits on one animation before starting the next.
		for (let round = 0; round < 4 && pending.length; round++) {
			const done = pending;
			pending = [];
			done.forEach((fn) => fn());
			await Promise.resolve();
		}
	});

beforeEach(() => {
	pending = [];
	Element.prototype.animate = fakeAnimate;
});

afterEach(() => {
	Element.prototype.animate = nativeAnimate;
	vi.unstubAllGlobals();
});

const live = (container: HTMLElement) => container.querySelector('[aria-live="polite"]');

describe('DynamicIsland', () => {
	test('shows only the activity on show and announces nothing at first', () => {
		const { container } = render(Fixture, { props: { activity: 'agent' } });
		expect(screen.getByText('Researching')).toBeInTheDocument();
		expect(screen.queryByText('Idle')).toBeNull();
		expect(live(container)?.textContent).toBe('');
	});

	test('announces the new activity politely when it takes over', async () => {
		const { container, rerender } = render(Fixture, { props: { activity: 'idle' } });
		await rerender({ activity: 'agent' });
		expect(live(container)?.textContent).toBe('Research agent running');
		await finishTransitions();
		expect(screen.queryByText('Idle')).toBeNull();

		// An activity without a label clears the announcement.
		await rerender({ activity: 'voice' });
		expect(live(container)?.textContent).toBe('');
	});

	test('makes leaving content inert so it never takes a click or focus', async () => {
		const { rerender } = render(Fixture, { props: { activity: 'agent' } });
		const stop = screen.getByRole('button', { name: 'Stop' });
		await rerender({ activity: 'idle' });
		// Still fading out, but out of reach.
		expect(stop.isConnected).toBe(true);
		expect(stop.closest('[inert]')).not.toBeNull();
		expect(screen.getByText('Idle')).toBeInTheDocument();
		await finishTransitions();
		expect(stop.isConnected).toBe(false);
	});

	test('freezes looping motion inside while paused', async () => {
		const { container, rerender } = render(Fixture, { props: { activity: 'agent' } });
		const island = container.querySelector('.dynamic-island');
		expect(island).not.toHaveAttribute('data-paused');
		await rerender({ activity: 'agent', paused: true });
		expect(island).toHaveAttribute('data-paused');
	});

	test('sizes the island to the content on show', () => {
		vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(240);
		vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(44);
		const { container } = render(Fixture, { props: { activity: 'agent' } });
		const island = container.querySelector<HTMLElement>('.dynamic-island')!;
		expect(island.style.width).toBe('240px');
		expect(island.style.height).toBe('44px');
		expect(island.style.borderRadius).toBe('22px');
		// Room is kept for the island so nothing below it moves.
		expect(island.parentElement?.style.height).toBe('44px');
		vi.restoreAllMocks();
	});
});
