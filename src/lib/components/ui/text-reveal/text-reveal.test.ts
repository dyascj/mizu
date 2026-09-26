import { render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';

import TextReveal from './text-reveal.svelte';

function stubReducedMotion(reduce: boolean) {
	vi.stubGlobal('matchMedia', (query: string) => ({
		matches: reduce && query.includes('reduce'),
		media: query,
		addEventListener() {},
		removeEventListener() {}
	}));
}

function stubObserver() {
	const observers: { callback: IntersectionObserverCallback; disconnect: () => void }[] = [];
	vi.stubGlobal(
		'IntersectionObserver',
		class {
			disconnect = vi.fn();
			observe = vi.fn();
			constructor(callback: IntersectionObserverCallback) {
				observers.push({ callback, disconnect: this.disconnect });
			}
		}
	);
	return observers;
}

const units = (container: HTMLElement) =>
	Array.from(container.querySelectorAll<HTMLElement>('.reveal-unit'));

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('TextReveal', () => {
	test('exposes the full text once and animates hidden word units in sequence', () => {
		const { container } = render(TextReveal, { text: 'Your trip  is planned.' });
		const visual = container.querySelector('[aria-hidden="true"]');

		expect(container.querySelector('.sr-only')).toHaveTextContent('Your trip is planned.');
		expect(visual?.textContent).toBe('Your trip  is planned.');
		expect(units(container).map((unit) => unit.textContent)).toEqual([
			'Your',
			'trip',
			'is',
			'planned.'
		]);
		expect(units(container).map((unit) => unit.style.getPropertyValue('--index'))).toEqual([
			'0',
			'1',
			'2',
			'3'
		]);
		for (const unit of units(container)) expect(unit).toHaveClass('animate-blur-in');
	});

	test('splits characters by grapheme without breaking words', () => {
		const { container } = render(TextReveal, {
			text: 'Café open',
			by: 'character',
			effect: 'rise'
		});
		const words = container.querySelectorAll('.whitespace-nowrap');

		expect(words).toHaveLength(2);
		expect(Array.from(words[0].children, (unit) => unit.textContent)).toEqual(['C', 'a', 'f', 'é']);
		expect(units(container).at(-1)?.style.getPropertyValue('--index')).toBe('7');
		expect(units(container)[0]).toHaveClass('animate-rise-in');
	});

	test('derives timing from props and the stagger token', async () => {
		const { container, rerender } = render(TextReveal, { text: 'Hi there', by: 'character' });
		const root = container.firstElementChild as HTMLElement;
		expect(root.style.getPropertyValue('--reveal-step')).toBe('calc(var(--stagger) / 3)');

		await rerender({ text: 'Hi there', by: 'word' });
		expect(root.style.getPropertyValue('--reveal-step')).toBe('var(--stagger)');

		await rerender({ text: 'Hi there', stagger: 25, delay: 120 });
		expect(root.style.getPropertyValue('--reveal-step')).toBe('25ms');
		expect(root.style.getPropertyValue('--reveal-delay')).toBe('120ms');
	});

	test('renders the requested element with an accessible name', () => {
		render(TextReveal, { text: 'What can I help with?', as: 'h2' });
		expect(screen.getByRole('heading', { level: 2, name: 'What can I help with?' })).toBeTruthy();
	});

	test('replays with fresh units when the text changes', async () => {
		const { container, rerender } = render(TextReveal, { text: 'First answer' });
		const before = units(container)[0];
		await rerender({ text: 'Second answer' });
		expect(units(container)[0]).not.toBe(before);
		expect(container.querySelector('.sr-only')).toHaveTextContent('Second answer');
	});

	test('waits for the first intersection when triggered by view, then disconnects', async () => {
		stubReducedMotion(false);
		const observers = stubObserver();
		const { container, unmount } = render(TextReveal, { text: 'Below the fold', trigger: 'view' });

		for (const unit of units(container)) {
			expect(unit).toHaveClass('opacity-0');
			expect(unit).not.toHaveClass('animate-blur-in');
		}

		observers[0].callback(
			[{ isIntersecting: true } as IntersectionObserverEntry],
			{} as IntersectionObserver
		);
		await Promise.resolve();

		expect(observers[0].disconnect).toHaveBeenCalled();
		for (const unit of units(container)) {
			expect(unit).not.toHaveClass('opacity-0');
			expect(unit).toHaveClass('animate-blur-in');
		}
		unmount();
	});

	test('never hides content without IntersectionObserver or with reduced motion', () => {
		stubReducedMotion(false);
		vi.stubGlobal('IntersectionObserver', undefined);
		const unsupported = render(TextReveal, { text: 'Always readable', trigger: 'view' });
		for (const unit of units(unsupported.container)) expect(unit).not.toHaveClass('opacity-0');
		unsupported.unmount();

		stubReducedMotion(true);
		const observers = stubObserver();
		const reduced = render(TextReveal, { text: 'Always readable', trigger: 'view' });
		expect(observers).toHaveLength(0);
		for (const unit of units(reduced.container)) expect(unit).not.toHaveClass('opacity-0');
	});

	test('disconnects when unmounted before it is seen', () => {
		stubReducedMotion(false);
		const observers = stubObserver();
		const { unmount } = render(TextReveal, { text: 'Never scrolled to', trigger: 'view' });
		unmount();
		expect(observers[0].disconnect).toHaveBeenCalled();
	});

	test('scroll mode spreads the units across the reveal and never hides them up front', () => {
		const { container } = render(TextReveal, { text: 'Read me as you go', trigger: 'scroll' });
		const scrubbed = Array.from(container.querySelectorAll<HTMLElement>('.scrub-unit'));

		expect(units(container)).toHaveLength(0);
		expect(scrubbed.map((unit) => unit.textContent)).toEqual(['Read', 'me', 'as', 'you', 'go']);
		expect(scrubbed[0].style.getPropertyValue('--from')).toBe('0');
		expect(Number(scrubbed[0].style.getPropertyValue('--to'))).toBeCloseTo(0.14);
		expect(Number(scrubbed.at(-1)?.style.getPropertyValue('--to'))).toBeCloseTo(1);
		for (const unit of scrubbed) {
			expect(unit).not.toHaveClass('opacity-0');
			expect(unit).not.toHaveClass('animate-blur-in');
		}
		// A view timeline needs a block box to follow.
		expect(container.firstElementChild).toHaveClass('block');
		expect(screen.getByText('Read me as you go')).toHaveClass('sr-only');
	});

	test('scroll mode waits for timeline support before it measures', () => {
		stubReducedMotion(false);
		const observers: { callback: ResizeObserverCallback; disconnect: () => void }[] = [];
		vi.stubGlobal(
			'ResizeObserver',
			class {
				disconnect = vi.fn();
				observe = vi.fn();
				constructor(callback: ResizeObserverCallback) {
					observers.push({ callback, disconnect: this.disconnect });
				}
			}
		);

		vi.stubGlobal('CSS', { supports: () => false });
		const unsupported = render(TextReveal, { text: 'Plain text', trigger: 'scroll' });
		expect(unsupported.container.firstElementChild).not.toHaveAttribute('data-scrub');
		expect(observers).toHaveLength(0);
		unsupported.unmount();

		vi.stubGlobal('CSS', { supports: () => true });
		const supported = render(TextReveal, { text: 'Scrubbed text', trigger: 'scroll' });
		const root = supported.container.firstElementChild as HTMLElement;
		expect(root).toHaveAttribute('data-scrub');
		expect(root.style.getPropertyValue('--reveal-span')).toMatch(/px$/);
		supported.unmount();
		expect(observers[0].disconnect).toHaveBeenCalled();

		stubReducedMotion(true);
		const reduced = render(TextReveal, { text: 'Still text', trigger: 'scroll' });
		expect(reduced.container.firstElementChild).not.toHaveAttribute('data-scrub');
	});
});
