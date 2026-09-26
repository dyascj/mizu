import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import StickyStack from './sticky-stack.svelte';

const items = [
	{ title: 'Ask in plain words', description: 'No prompts to learn.' },
	{ title: 'It reads the workspace', description: 'Docs, threads, and tickets.' },
	{ title: 'Drafts land as suggestions', description: 'Nothing changes on its own.' }
];

function stubReducedMotion(reduce: boolean) {
	vi.stubGlobal('matchMedia', (query: string) => ({
		matches: query.includes('reduce') ? reduce : false,
		media: query,
		addEventListener() {},
		removeEventListener() {}
	}));
}

beforeEach(() => {
	stubReducedMotion(false);
	// Runs the frame at once and reports it finished, as a real frame would be by the next scroll.
	vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
		callback(0);
		return 0;
	});
});

afterEach(() => {
	vi.unstubAllGlobals();
});

function setup() {
	render(StickyStack, { items, label: 'How the assistant works' });
	const region = screen.getByRole('region', { name: 'How the assistant works' });
	const jumps = screen.getAllByRole('button');
	return { region, jumps };
}

async function scrollTo(region: HTMLElement, top: number) {
	region.scrollTop = top;
	await fireEvent.scroll(region);
}

describe('StickyStack', () => {
	test('renders a focusable scroll region with a jump button per card', () => {
		const { region, jumps } = setup();
		expect(region).toHaveAttribute('tabindex', '0');
		expect(screen.getAllByRole('article')).toHaveLength(3);
		expect(screen.getByRole('navigation', { name: 'Jump to card' })).toBeInTheDocument();
		expect(jumps.map((button) => button.getAttribute('aria-label'))).toEqual([
			'1. Ask in plain words',
			'2. It reads the workspace',
			'3. Drafts land as suggestions'
		]);
		expect(jumps[0]).toHaveAttribute('aria-current', 'step');
	});

	test('sinks covered cards and moves the current step as cards arrive', async () => {
		const { region, jumps } = setup();
		const [first, second] = screen.getAllByRole('article');

		// Card two sticks at 20 + 14 = 34px after its natural 20 + 360 = 380px.
		await scrollTo(region, 346);
		expect(jumps[1]).toHaveAttribute('aria-current', 'step');
		expect(jumps[0]).not.toHaveAttribute('aria-current');
		expect(Number(first.style.scale)).toBeCloseTo(0.96, 5);
		expect(second.style.scale).toBe('1');

		await scrollTo(region, 0);
		expect(jumps[0]).toHaveAttribute('aria-current', 'step');
		expect(first.style.scale).toBe('1');
	});

	test('jumps to a card, smoothly unless reduced motion is on', async () => {
		const { region, jumps } = setup();
		const scrollToSpy = vi.fn();
		region.scrollTo = scrollToSpy as typeof region.scrollTo;

		await fireEvent.click(jumps[2]);
		expect(scrollToSpy).toHaveBeenLastCalledWith({ top: 20 + 2 * 360 - 48, behavior: 'smooth' });

		stubReducedMotion(true);
		await fireEvent.click(jumps[0]);
		expect(scrollToSpy).toHaveBeenLastCalledWith({ top: 0, behavior: 'auto' });
	});

	test('holds cards flat under reduced motion', async () => {
		stubReducedMotion(true);
		const { region } = setup();
		await scrollTo(region, 346);
		expect(screen.getAllByRole('article')[0].style.scale).toBe('');
	});
});
