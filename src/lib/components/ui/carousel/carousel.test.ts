import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import Fixture from './carousel.spec.svelte';
import type { CarouselApi } from './context.js';

// Embla reads media queries and observes layout, none of which jsdom has.
beforeEach(() => {
	vi.stubGlobal('matchMedia', (query: string) => ({
		matches: false,
		media: query,
		addListener() {},
		removeListener() {},
		addEventListener() {},
		removeEventListener() {}
	}));
	for (const name of ['ResizeObserver', 'IntersectionObserver']) {
		vi.stubGlobal(
			name,
			class {
				observe() {}
				unobserve() {}
				disconnect() {}
				takeRecords() {
					return [];
				}
			}
		);
	}
});

afterEach(() => vi.unstubAllGlobals());

async function ready(effect: 'none' | 'focus' = 'none') {
	let api: CarouselApi | undefined;
	const result = render(Fixture, { effect, setApi: (value) => (api = value) });
	await waitFor(() => expect(api).toBeDefined());
	return { ...result, api: api! };
}

describe('Carousel', () => {
	test('is a labelled carousel region of numbered slides', async () => {
		await ready();
		const region = screen.getByRole('region', { name: 'Agent templates' });
		expect(region).toHaveAttribute('aria-roledescription', 'carousel');
		const slides = screen.getAllByRole('group');
		expect(slides.map((slide) => slide.getAttribute('aria-label'))).toEqual([
			'1 of 3',
			'2 of 3',
			'3 of 3'
		]);
		expect(slides[0]).toHaveAttribute('aria-roledescription', 'slide');
		expect(slides[0]).toHaveAttribute('data-active');
	});

	test('arrow buttons and keys step through the slides', async () => {
		const { api } = await ready();
		const next = vi.spyOn(api, 'scrollNext');
		const previous = vi.spyOn(api, 'scrollPrev');

		const nextButton = screen.getByRole('button', { name: 'Next slide' });
		expect(nextButton).toHaveAttribute('type', 'button');
		await fireEvent.click(nextButton);
		expect(next).toHaveBeenCalledTimes(1);

		await fireEvent.keyDown(screen.getByRole('region'), { key: 'ArrowRight' });
		expect(next).toHaveBeenCalledTimes(2);
		await fireEvent.keyDown(screen.getByRole('region'), { key: 'ArrowLeft' });
		expect(previous).toHaveBeenCalledTimes(1);
	});

	test('marks the centered slide as the selection moves', async () => {
		const { api } = await ready();
		// Listeners receive Embla's own object rather than the reactive copy
		// handed to setApi, so the stand-ins go on that one.
		let raw: CarouselApi | undefined;
		const grab = (value: CarouselApi) => (raw = value);
		api.on('select', grab);
		api.emit('select');
		api.off('select', grab);
		// jsdom has no layout, so Embla folds every slide into one snap. Give
		// each slide its own, as it would have in a browser.
		const engine = raw!.internalEngine();
		vi.spyOn(raw!, 'internalEngine').mockReturnValue({ ...engine, slideRegistry: [[0], [1], [2]] });
		vi.spyOn(raw!, 'selectedScrollSnap').mockReturnValue(1);
		api.emit('select');
		const slides = screen.getAllByRole('group');
		await waitFor(() => expect(slides[1]).toHaveAttribute('data-active'));
		expect(slides[0]).not.toHaveAttribute('data-active');
	});

	test('the focus effect writes how centered each slide is', async () => {
		const { container, api } = await ready('focus');
		const region = screen.getByRole('region');
		expect(region).toHaveAttribute('data-carousel-effect', 'focus');
		const viewport = container.querySelector('[data-slot="carousel-viewport"]')!;
		expect(viewport.className).toContain('cursor-grab');

		const slides = screen.getAllByRole('group');
		const box = (left: number, width: number) =>
			({ left, top: 0, width, height: 100, right: left + width, bottom: 100 }) as DOMRect;
		vi.spyOn(api.rootNode(), 'getBoundingClientRect').mockReturnValue(box(0, 400));
		slides.forEach((slide, index) =>
			vi
				.spyOn(slide.firstElementChild as HTMLElement, 'getBoundingClientRect')
				.mockReturnValue(box(100 + index * 200, 200))
		);
		api.emit('scroll');
		expect(slides[0].style.getPropertyValue('--carousel-focus')).toBe('1.000');
		expect(slides[0].inert).toBe(false);
		expect(slides[1].style.getPropertyValue('--carousel-focus')).toBe('0.333');
		expect(slides[2].style.getPropertyValue('--carousel-focus')).toBe('0.000');
	});

	test('with the focus effect, focus follows the selection out of a slide turning inert', async () => {
		const { api } = await ready('focus');
		let raw: CarouselApi | undefined;
		const grab = (value: CarouselApi) => (raw = value);
		api.on('select', grab);
		api.emit('select');
		api.off('select', grab);
		const engine = raw!.internalEngine();
		vi.spyOn(raw!, 'internalEngine').mockReturnValue({ ...engine, slideRegistry: [[0], [1], [2]] });
		const snap = vi.spyOn(raw!, 'selectedScrollSnap').mockReturnValue(0);
		api.emit('select');

		const use = screen.getByRole('button', { name: 'Use Research' });
		use.focus();
		snap.mockReturnValue(1);
		api.emit('select');
		const slides = screen.getAllByRole('group', { hidden: true });
		expect(slides[0].inert).toBe(true);
		expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Use Notes' }));

		// Focus that is not inside a slide stays where it is.
		const next = screen.getByRole('button', { name: 'Next slide' });
		next.focus();
		snap.mockReturnValue(2);
		api.emit('select');
		expect(document.activeElement).toBe(next);
	});

	test('leaves slides untouched without the effect', async () => {
		const { api } = await ready();
		api.emit('scroll');
		expect(screen.getAllByRole('group')[0].style.getPropertyValue('--carousel-focus')).toBe('');
		expect(screen.getByRole('region')).toHaveAttribute('data-carousel-effect', 'none');
	});
});
