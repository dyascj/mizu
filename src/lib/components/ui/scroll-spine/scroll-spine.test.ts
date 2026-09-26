import { act, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import ScrollSpine from './scroll-spine.svelte';

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
	document.body.querySelectorAll('[data-article]').forEach((node) => node.remove());
});

const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

const items = [
	{ id: 'intro', label: 'Where we are today' },
	{ id: 'why', label: 'Why pgvector' },
	{ id: 'steps', label: 'Migration steps' }
];

/**
 * A 1200px article in a 300px scroller, with sections starting at 0, 200,
 * and 800. jsdom has no layout, so positions come from the scroll offset.
 */
function article() {
	const el = document.createElement('div');
	el.dataset.article = '';
	Object.defineProperty(el, 'scrollHeight', { value: 1200 });
	Object.defineProperty(el, 'clientHeight', { value: 300 });
	el.getBoundingClientRect = () => DOMRect.fromRect({ x: 0, y: 0, width: 400, height: 300 });
	el.scrollTo = vi.fn((options: ScrollToOptions) => {
		el.scrollTop = options.top ?? 0;
		el.dispatchEvent(new Event('scroll'));
	}) as unknown as typeof el.scrollTo;
	[0, 200, 800].forEach((top, i) => {
		const heading = document.createElement('h3');
		heading.id = items[i].id;
		heading.textContent = items[i].label;
		heading.getBoundingClientRect = () =>
			DOMRect.fromRect({ x: 0, y: top - el.scrollTop, width: 400, height: 24 });
		el.append(heading);
	});
	document.body.append(el);
	return el;
}

async function scrollTo(el: HTMLElement, top: number) {
	el.scrollTop = top;
	await fireEvent.scroll(el);
	await advance(20);
}

const current = () => screen.getByRole('navigation').querySelector('[aria-current="location"]');

describe('ScrollSpine', () => {
	test('is a named navigation landmark with a link per section', () => {
		render(ScrollSpine, { props: { items, target: article() } });
		const nav = screen.getByRole('navigation', { name: 'On this page' });
		const links = Array.from(nav.querySelectorAll('a'));
		expect(links.map((link) => link.getAttribute('href'))).toEqual(['#intro', '#why', '#steps']);
		expect(screen.getByRole('link', { name: 'Why pgvector' })).toBeInTheDocument();
		expect(current()).toHaveTextContent('Where we are today');
	});

	test('sizes each band in proportion to its section', () => {
		const { container } = render(ScrollSpine, {
			props: { items, target: article(), height: 300 }
		});
		const heights = Array.from(container.querySelectorAll('li')).map((li) =>
			parseFloat(li.style.height)
		);
		// Sections of 200, 600, and 400 pixels.
		expect(heights[1]).toBeGreaterThan(heights[2]);
		expect(heights[2]).toBeGreaterThan(heights[0]);
	});

	test('marks the section being read once its start passes the reading line', async () => {
		const target = article();
		const onSectionChange = vi.fn();
		const { container } = render(ScrollSpine, { props: { items, target, onSectionChange } });

		// The reading line sits 30% down the 300px viewport: 90px.
		await scrollTo(target, 100);
		expect(current()).toHaveTextContent('Where we are today');
		await scrollTo(target, 150);
		expect(current()).toHaveTextContent('Why pgvector');
		expect(onSectionChange).toHaveBeenLastCalledWith('why');

		const fills = Array.from(container.querySelectorAll<HTMLElement>('li .bg-primary'));
		expect(fills[0].style.scale).toBe('1 1');
		expect(fills[2].style.scale).toBe('1 0');

		// The end of the document always counts as the last section.
		await scrollTo(target, 900);
		expect(current()).toHaveTextContent('Migration steps');
		expect(onSectionChange).toHaveBeenCalledTimes(2);
	});

	test('jumps to a section and moves focus to its heading', async () => {
		const target = article();
		render(ScrollSpine, { props: { items, target } });
		await fireEvent.click(screen.getByRole('link', { name: 'Migration steps' }));
		expect(target.scrollTo).toHaveBeenCalledWith({ top: 784, behavior: 'smooth' });
		const heading = document.getElementById('steps');
		expect(heading).toHaveAttribute('tabindex', '-1');
		expect(document.activeElement).toBe(heading);
	});

	test('jumps without smooth scrolling under reduced motion', async () => {
		vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }));
		const target = article();
		render(ScrollSpine, { props: { items, target } });
		await fireEvent.click(screen.getByRole('link', { name: 'Why pgvector' }));
		expect(target.scrollTo).toHaveBeenCalledWith({ top: 184, behavior: 'instant' });
	});

	test('waits for a scroller that has not mounted yet', async () => {
		const { rerender } = render(ScrollSpine, { props: { items, target: null } });
		expect(current()).toHaveTextContent('Where we are today');
		const target = article();
		await rerender({ items, target });
		await scrollTo(target, 850);
		expect(current()).toHaveTextContent('Migration steps');
	});
});
