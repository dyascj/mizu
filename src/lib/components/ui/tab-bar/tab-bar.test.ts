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
});
