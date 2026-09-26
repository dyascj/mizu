import { act, fireEvent, render, screen, within } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import TabBarFixture from './tab-bar.spec.svelte';

let frames: FrameRequestCallback[] = [];
let observers: { callback: ResizeObserverCallback; disconnect: ReturnType<typeof vi.fn> }[] = [];

function stubReducedMotion(reduce: boolean) {
	vi.stubGlobal('matchMedia', (query: string) => ({
		matches: reduce && query.includes('reduce'),
		media: query,
		addEventListener() {},
		removeEventListener() {}
	}));
}

async function flushFrames() {
	for (let i = 0; i < 4 && frames.length; i++) {
		const pending = frames;
		frames = [];
		await act(() => pending.forEach((callback) => callback(0)));
	}
}

function indicator() {
	return document.querySelector<HTMLElement>('[data-slot="indicator"]');
}

// jsdom has no layout, so give each item a position from its text.
const layout: Record<string, number> = { Home: 4, Inbox: 72, Alerts: 140 };
function offsetFor(element: HTMLElement) {
	const text = element.textContent?.trim() ?? '';
	const key = Object.keys(layout).find((name) => text.includes(name));
	return key ? layout[key] : 0;
}

beforeEach(() => {
	frames = [];
	observers = [];
	stubReducedMotion(false);
	vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
		frames.push(callback);
		return frames.length;
	});
	vi.stubGlobal('cancelAnimationFrame', vi.fn());
	vi.stubGlobal(
		'ResizeObserver',
		class {
			disconnect = vi.fn();
			observe = vi.fn();
			unobserve = vi.fn();
			constructor(callback: ResizeObserverCallback) {
				observers.push({ callback, disconnect: this.disconnect });
			}
		}
	);
	vi.spyOn(HTMLElement.prototype, 'offsetLeft', 'get').mockImplementation(function (
		this: HTMLElement
	) {
		return this.matches('a, button') ? offsetFor(this) : 0;
	});
	vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockReturnValue(0);
	vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(64);
	vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(48);
	vi.spyOn(HTMLElement.prototype, 'offsetParent', 'get').mockImplementation(function (
		this: HTMLElement
	) {
		return this.closest('nav > div');
	});
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe('TabBar', () => {
	test('is a labelled navigation list', () => {
		render(TabBarFixture);
		const nav = screen.getByRole('navigation', { name: 'Primary' });
		expect(within(nav).getAllByRole('listitem')).toHaveLength(3);
	});

	test('marks the active link as the current page', () => {
		render(TabBarFixture, { links: true, active: 'inbox' });
		expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
		expect(screen.getByRole('link', { name: 'Inbox, 3 unread' })).toHaveAttribute(
			'aria-current',
			'page'
		);
		expect(screen.getByRole('link', { name: 'Inbox, 3 unread' })).toHaveAttribute('href', '/inbox');
	});

	test('renders buttons without href and reports selection', async () => {
		const onselect = vi.fn();
		render(TabBarFixture, { onselect });
		expect(screen.queryByRole('link')).toBeNull();
		expect(screen.getByRole('button', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
		await fireEvent.click(screen.getByRole('button', { name: 'Inbox, 3 unread' }));
		expect(onselect).toHaveBeenCalledWith('inbox');
	});

	test('announces badges and caps the visible count', () => {
		render(TabBarFixture);
		const alerts = screen.getByRole('button', { name: 'Alerts, 120 new' });
		const inbox = screen.getByRole('button', { name: 'Inbox, 3 unread' });
		expect(within(alerts).getByText('99+').closest('[aria-hidden="true"]')).not.toBeNull();
		expect(within(inbox).getByText('3').closest('[aria-hidden="true"]')).not.toBeNull();
	});

	test('renders a component icon or custom icon content', () => {
		render(TabBarFixture);
		expect(screen.getByRole('button', { name: 'Home' }).querySelector('svg')).toHaveAttribute(
			'aria-hidden',
			'true'
		);
		expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
	});

	test('keeps hidden labels available to assistive technology', () => {
		render(TabBarFixture, { labels: 'hidden' });
		const home = screen.getByRole('button', { name: 'Home' });
		expect(within(home).getByText('Home')).toHaveClass('sr-only');
	});

	test('places the indicator without motion, then slides it to the next item', async () => {
		const { rerender } = render(TabBarFixture);
		expect(indicator()?.style.translate).toBe('4px 0px');
		expect(indicator()).not.toHaveClass('transition-[translate,width,height]');

		await flushFrames();
		expect(indicator()).toHaveClass('transition-[translate,width,height]');

		await rerender({ active: 'alerts' });
		expect(indicator()?.style.translate).toBe('140px 0px');
		expect(indicator()).toHaveClass('ease-spring');
	});

	test('keeps the indicator when the selection moves back to an earlier item', async () => {
		for (const labels of ['visible', 'active'] as const) {
			const { rerender, unmount } = render(TabBarFixture, { labels });
			await flushFrames();
			await rerender({ labels, active: 'alerts' });
			await flushFrames();
			await rerender({ labels, active: 'home' });
			await flushFrames();
			expect(indicator()).not.toBeNull();
			expect(indicator()?.style.translate).toBe('4px 0px');
			unmount();
		}
	});

	test('jumps without motion when the bar resizes', async () => {
		render(TabBarFixture);
		await flushFrames();
		layout.Home = 20;
		await act(() => observers[0].callback([], {} as ResizeObserver));
		expect(indicator()?.style.translate).toBe('20px 0px');
		expect(indicator()).not.toHaveClass('ease-spring');
		await flushFrames();
		expect(indicator()).toHaveClass('ease-spring');
		layout.Home = 4;
	});

	test('never animates the indicator for reduced motion', async () => {
		stubReducedMotion(true);
		const { rerender } = render(TabBarFixture);
		await flushFrames();
		await rerender({ active: 'inbox' });
		expect(indicator()?.style.translate).toBe('72px 0px');
		expect(indicator()).not.toHaveClass('ease-spring');
	});

	test('highlights the docked icon and stops observing on unmount', () => {
		const { unmount } = render(TabBarFixture, { variant: 'docked' });
		expect(indicator()).not.toBeNull();
		unmount();
		expect(observers[0].disconnect).toHaveBeenCalled();
	});

	test('shows only the active label, beside its icon, and keeps every item named', () => {
		render(TabBarFixture, { labels: 'active' });
		expect(screen.getByRole('navigation')).toHaveAttribute('data-labels', 'active');
		const home = screen.getByRole('button', { name: 'Home' });
		expect(within(home).getByText('Home')).not.toHaveClass('sr-only');
		expect(within(home).getByText('Home')).toHaveClass('opacity-100');
		// Collapsed, not removed: the label still names the item.
		const alerts = screen.getByRole('button', { name: 'Alerts, 120 new' });
		expect(within(alerts).getByText('Alerts')).toHaveClass('opacity-0');
	});

	test('with active labels, the highlight chases the widening item on a spring', async () => {
		vi.spyOn(performance, 'now').mockReturnValue(0);
		const { rerender } = render(TabBarFixture, { labels: 'active' });
		expect(indicator()?.style.translate).toBe('4px 0px');

		await rerender({ labels: 'active', active: 'alerts' });
		let time = 0;
		const seen: string[] = [];
		for (let i = 0; i < 120 && frames.length; i++) {
			const pending = frames;
			frames = [];
			time += 16;
			await act(() => pending.forEach((callback) => callback(time)));
			seen.push(indicator()?.style.translate ?? '');
		}
		// It glides through the space between rather than jumping there.
		expect(seen.some((value) => value !== '4px 0px' && value !== '140px 0px')).toBe(true);
		expect(indicator()?.style.translate).toBe('140px 0px');
		expect(indicator()).not.toHaveClass('ease-spring');
	});

	test('with active labels and reduced motion, the highlight jumps', async () => {
		stubReducedMotion(true);
		const { rerender } = render(TabBarFixture, { labels: 'active' });
		await rerender({ labels: 'active', active: 'inbox' });
		expect(indicator()?.style.translate).toBe('72px 0px');
	});

	test('can flood the active icon with a fill', async () => {
		const { rerender } = render(TabBarFixture, { fill: true });
		const icons = () => screen.getByRole('button', { name: 'Home' }).querySelectorAll('svg');
		expect(icons()).toHaveLength(2);
		expect(icons()[1]).toHaveAttribute('fill', 'currentColor');
		expect(icons()[1]).toHaveClass('opacity-100');
		await rerender({ fill: true, active: 'inbox' });
		expect(icons()[1]).toHaveClass('opacity-0');
	});
});
