import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import Harness from './breadcrumb.test.svelte';

const path = [
	{ label: 'Workspace', href: '/w' },
	{ label: 'Support agent', href: '/w/agent' },
	{ label: 'Knowledge', href: '/w/agent/knowledge' },
	{ label: 'Policies', href: '/w/agent/knowledge/policies' },
	{ label: 'Refunds' }
];

// jsdom has no layout: every crumb in the hidden copy is 100px wide, the fold
// button 40px, and the trail has `available` pixels.
let available = 1000;
const nativeAnimate = Element.prototype.animate;
const nativeGetAnimations = Element.prototype.getAnimations;

beforeEach(() => {
	available = 1000;
	vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => available);
	vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
		const width = this.querySelector('span.w-8') ? 40 : 100;
		return { width, height: 20, top: 0, left: 0, right: width, bottom: 20, x: 0, y: 0 } as DOMRect;
	});
	// jsdom has no Web Animations API; Svelte transitions finish on the next microtask.
	Element.prototype.animate = function () {
		return {
			cancel() {},
			set onfinish(done: () => void) {
				queueMicrotask(done);
			}
		} as unknown as Animation;
	};
	Element.prototype.getAnimations = () => [];
});

afterEach(() => {
	vi.restoreAllMocks();
	Element.prototype.animate = nativeAnimate;
	Element.prototype.getAnimations = nativeGetAnimations;
});

/** The visible trail, not the hidden copy used for measuring. */
const trail = () => screen.getByRole('navigation').querySelectorAll('ol')[1] as HTMLElement;

describe('Breadcrumb.Trail', () => {
	test('shows the whole path when it fits, ending on the current page', () => {
		render(Harness, { items: path });
		const links = within(trail()).getAllByRole('link');
		expect(links.map((link) => link.textContent?.trim())).toEqual([
			'Workspace',
			'Support agent',
			'Knowledge',
			'Policies',
			'Refunds'
		]);
		const current = within(trail()).getByText('Refunds');
		expect(current).toHaveAttribute('aria-current', 'page');
		expect(within(trail()).queryByRole('button')).toBeNull();
	});

	test('keeps the measuring copy away from assistive technology', () => {
		render(Harness, { items: path });
		const copy = screen.getByRole('navigation').querySelector('ol')?.parentElement;
		expect(copy).toHaveAttribute('aria-hidden', 'true');
		expect(copy).toHaveAttribute('inert');
	});

	test('folds middle levels into a menu from the left when space runs out', async () => {
		available = 380;
		render(Harness, { items: path });
		await tick();
		// 100 first + 40 fold + 100 + 100 current fits in 380: Knowledge and
		// Support agent fold, the nearest parent stays.
		const trigger = within(trail()).getByRole('button', { name: 'Show 2 hidden levels' });
		expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
		expect(within(trail()).queryByText('Support agent')).toBeNull();
		expect(within(trail()).getByText('Policies')).toBeInTheDocument();
		expect(within(trail()).getByText('Workspace')).toBeInTheDocument();
	});

	test('the fold menu lists the hidden levels as links', async () => {
		available = 380;
		render(Harness, { items: path });
		await tick();
		const trigger = within(trail()).getByRole('button', { name: /hidden/ });
		await fireEvent.keyDown(trigger, { key: 'Enter' });
		const items = await screen.findAllByRole('menuitem');
		expect(items.map((item) => item.textContent?.trim())).toEqual(['Support agent', 'Knowledge']);
		expect(items[0]).toHaveAttribute('href', '/w/agent');
	});

	test('reports navigation with the index and keeps the browser from following', async () => {
		const onNavigate = vi.fn();
		render(Harness, { items: path, onNavigate });
		const link = within(trail()).getByRole('link', { name: 'Knowledge' });
		const event = new MouseEvent('click', { bubbles: true, cancelable: true });
		link.dispatchEvent(event);
		expect(event.defaultPrevented).toBe(true);
		expect(onNavigate).toHaveBeenCalledWith(path[2], 2);
	});

	test('leaves links alone without onNavigate', () => {
		render(Harness, { items: path });
		const link = within(trail()).getByRole('link', { name: 'Knowledge' });
		const event = new MouseEvent('click', { bubbles: true, cancelable: true });
		link.dispatchEvent(event);
		expect(event.defaultPrevented).toBe(false);
	});
});
