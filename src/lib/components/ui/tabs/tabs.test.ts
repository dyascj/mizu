import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import Harness from './tabs.test.svelte';

// jsdom has no layout. Settings sits on a second row, as in a wrapped list.
const boxes: Record<string, { x: number; y: number; width: number }> = {
	overview: { x: 4, y: 4, width: 88 },
	activity: { x: 96, y: 4, width: 76 },
	settings: { x: 4, y: 44, width: 80 }
};
const triggerBox = (el: HTMLElement) =>
	el.getAttribute('role') === 'tab' ? boxes[el.dataset.value ?? ''] : undefined;

beforeEach(() => {
	const getters = {
		offsetLeft: (el: HTMLElement) => triggerBox(el)?.x ?? 0,
		offsetTop: (el: HTMLElement) => triggerBox(el)?.y ?? 0,
		offsetWidth: (el: HTMLElement) => triggerBox(el)?.width ?? 0,
		offsetHeight: (el: HTMLElement) => (triggerBox(el) ? 32 : 0)
	};
	for (const [name, get] of Object.entries(getters)) {
		vi.spyOn(HTMLElement.prototype, name as 'offsetLeft', 'get').mockImplementation(function (
			this: HTMLElement
		) {
			return get(this);
		});
	}
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

function indicator() {
	const el = screen.getByRole('tablist').querySelector<HTMLElement>(':scope > [aria-hidden]');
	if (!el) throw new Error('missing indicator');
	return el;
}

describe('Tabs', () => {
	test('keeps tab semantics with the indicator in the list', () => {
		render(Harness);
		expect(screen.getByRole('tablist', { name: 'Project' })).toHaveAttribute('data-indicator');
		expect(screen.getAllByRole('tab')).toHaveLength(3);
		expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
		expect(screen.getByText('Overview panel')).toBeVisible();
		expect(indicator().style.translate).toBe('4px 4px');
		expect(indicator().style.width).toBe('88px');
	});

	test('the indicator follows clicks, including onto a wrapped row', async () => {
		render(Harness);
		await fireEvent.click(screen.getByRole('tab', { name: 'Activity' }));
		expect(screen.getByRole('tab', { name: 'Activity' })).toHaveAttribute('aria-selected', 'true');
		await vi.waitFor(() => expect(indicator().style.translate).toBe('96px 4px'));

		await fireEvent.click(screen.getByRole('tab', { name: 'Settings' }));
		await vi.waitFor(() => expect(indicator().style.translate).toBe('4px 44px'));
		expect(indicator().style.width).toBe('80px');
	});

	test('arrow keys still move focus and activate tabs', async () => {
		render(Harness);
		const overview = screen.getByRole('tab', { name: 'Overview' });
		overview.focus();

		await fireEvent.keyDown(overview, { key: 'ArrowRight' });
		const activity = screen.getByRole('tab', { name: 'Activity' });
		expect(activity).toHaveFocus();
		expect(activity).toHaveAttribute('aria-selected', 'true');
		expect(screen.getByText('Activity panel')).toBeVisible();
		await vi.waitFor(() => expect(indicator().style.translate).toBe('96px 4px'));
	});
});

describe('Tabs underline variant', () => {
	const tablist = () => screen.getByRole('tablist');
	const edge = (name: string) => parseFloat(tablist().style.getPropertyValue(`--edge-${name}`));

	test('draws the underline under the active tab from two edges', () => {
		render(Harness, { variant: 'underline' });
		expect(tablist()).toHaveAttribute('data-variant', 'underline');
		expect(tablist()).toHaveAttribute('data-indicator');
		expect(edge('left')).toBe(4);
		expect(edge('right')).toBe(92);
	});

	test('stretches toward the picked tab, then gathers under it', async () => {
		render(Harness, { variant: 'underline' });
		const widths: number[] = [];
		const observer = new MutationObserver(() => widths.push(edge('right') - edge('left')));
		observer.observe(tablist(), { attributeFilter: ['style'] });

		await fireEvent.click(screen.getByRole('tab', { name: 'Activity' }));
		await vi.waitFor(() => expect(edge('left')).toBe(96));
		observer.disconnect();
		expect(edge('right')).toBe(172);
		// Moving right, the right edge leads, so the line grows past both tabs' widths.
		expect(Math.max(...widths)).toBeGreaterThan(88);
	});

	test('jumps when the next tab sits on another row', async () => {
		render(Harness, { variant: 'underline' });
		await fireEvent.click(screen.getByRole('tab', { name: 'Settings' }));
		await vi.waitFor(() => expect(edge('top')).toBe(44));
		expect(edge('left')).toBe(4);
		expect(edge('right')).toBe(84);
	});

	test('floats a hover pill over the tab under a mouse, never a finger', async () => {
		render(Harness, { variant: 'underline' });
		const pill = tablist().querySelector<HTMLElement>('[data-slot="tabs-hover"]')!;
		await fireEvent.pointerOver(screen.getByRole('tab', { name: 'Activity' }), {
			pointerType: 'touch'
		});
		expect(pill).not.toHaveAttribute('data-visible');

		await fireEvent.pointerOver(screen.getByRole('tab', { name: 'Activity' }), {
			pointerType: 'mouse'
		});
		expect(pill).toHaveAttribute('data-visible');
		expect(pill.style.translate).toBe('96px 8px');
		expect(pill.style.height).toBe('24px');
		expect(pill.style.width).toBe('76px');

		await fireEvent.pointerLeave(tablist());
		expect(pill).not.toHaveAttribute('data-visible');
	});

	test('panels enter from the side the reader moved toward', async () => {
		render(Harness, { variant: 'underline' });
		const panel = () => screen.getByRole('tabpanel');
		expect(panel().className).not.toContain('mizu-tab-enter');

		await fireEvent.click(screen.getByRole('tab', { name: 'Settings' }));
		await vi.waitFor(() => expect(panel()).toHaveTextContent('Settings panel'));
		await vi.waitFor(() => expect(panel().className).toContain('mizu-tab-enter'));
		expect(panel().className).toContain('[--tab-direction:1]');

		await fireEvent.click(screen.getByRole('tab', { name: 'Overview' }));
		await vi.waitFor(() =>
			expect(screen.getByRole('tabpanel').className).toContain('[--tab-direction:-1]')
		);
	});

	test("a panel's own style survives the entrance direction", async () => {
		render(Harness, { panelStyle: 'color: red' });
		await fireEvent.click(screen.getByRole('tab', { name: 'Settings' }));
		await vi.waitFor(() =>
			expect(screen.getByRole('tabpanel').className).toContain('[--tab-direction:1]')
		);
		expect(screen.getByRole('tabpanel').style.color).toBe('red');
	});
});

describe('Tabs scroll overflow', () => {
	test('wraps the list in a scrolling frame with pointer-only page buttons', () => {
		const { container } = render(Harness, { variant: 'underline', overflow: 'scroll' });
		const frame = container.querySelector('[data-slot="tabs-scroll-frame"]');
		expect(frame).not.toBeNull();
		expect(frame?.querySelector('[data-slot="tabs-scroller"] [role="tablist"]')).not.toBeNull();
		const arrows = container.querySelectorAll('[data-slot^="tabs-scroll-"][aria-hidden="true"]');
		expect(arrows).toHaveLength(2);
		for (const arrow of arrows) expect(arrow).toHaveAttribute('tabindex', '-1');
		// Only tabs are reachable as buttons.
		expect(screen.queryAllByRole('button')).toHaveLength(0);
	});

	test('keeps tab semantics and keyboard support inside the frame', async () => {
		render(Harness, { overflow: 'scroll' });
		const overview = screen.getByRole('tab', { name: 'Overview' });
		overview.focus();
		await fireEvent.keyDown(overview, { key: 'ArrowRight' });
		expect(screen.getByRole('tab', { name: 'Activity' })).toHaveAttribute('aria-selected', 'true');
		expect(screen.getByRole('tab', { name: 'Activity' })).toHaveFocus();
	});

	test('in RTL the fades, page buttons, and wheel follow the mirrored scroll range', async () => {
		const target = document.body.appendChild(document.createElement('div'));
		target.style.direction = 'rtl';
		const { container } = render(Harness, { props: { overflow: 'scroll' }, target });
		const scroller = container.querySelector<HTMLElement>('[data-slot="tabs-scroller"]')!;
		Object.defineProperty(scroller, 'scrollWidth', { value: 300 });
		Object.defineProperty(scroller, 'clientWidth', { value: 100 });
		let scrollLeft = 0;
		Object.defineProperty(scroller, 'scrollLeft', {
			get: () => scrollLeft,
			set: (value: number) => (scrollLeft = value)
		});
		const wheel = () => {
			const event = new WheelEvent('wheel', { deltaY: 3, deltaMode: 1, cancelable: true });
			scroller.dispatchEvent(event);
			return event.defaultPrevented;
		};

		// At the start of an RTL row the hidden tabs lie to the left.
		await fireEvent.scroll(scroller);
		expect(scroller.style.getPropertyValue('--fade-start')).toBe('48px');
		expect(scroller.style.getPropertyValue('--fade-end')).toBe('0px');
		await fireEvent.pointerEnter(container.querySelector('[data-slot="tabs-scroll-frame"]')!);
		expect(container.querySelector('[data-slot="tabs-scroll-prev"]')).toHaveAttribute(
			'data-visible'
		);
		expect(container.querySelector('[data-slot="tabs-scroll-next"]')).not.toHaveAttribute(
			'data-visible'
		);
		// A wheel turned down heads toward the end, so it scrolls.
		vi.stubGlobal('matchMedia', () => ({ matches: true }));
		expect(wheel()).toBe(true);
		expect(scrollLeft).toBe(-48);

		// At the far end the wheel hands back to the page.
		scrollLeft = -200;
		await fireEvent.scroll(scroller);
		expect(scroller.style.getPropertyValue('--fade-start')).toBe('0px');
		expect(scroller.style.getPropertyValue('--fade-end')).toBe('48px');
		expect(wheel()).toBe(false);
		target.remove();
	});
});
