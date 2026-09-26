import { fireEvent, render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';

import Lens from './lens.svelte';

const base = createRawSnippet(() => ({ render: () => '<p>Leaves at 9:40</p>' }));
const reveal = createRawSnippet(() => ({ render: () => '<p>From your booking email</p>' }));

const props = {
	children: base,
	reveal,
	label: 'Travel answer',
	description: 'Under the lens, each claim shows its source.'
};

function mockBox(element: HTMLElement) {
	vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
		x: 0,
		y: 0,
		left: 0,
		top: 0,
		right: 400,
		bottom: 300,
		width: 400,
		height: 300,
		toJSON: () => ({})
	});
}

// Reduced motion makes every spring jump, so positions are exact at once.
function reduceMotion() {
	vi.stubGlobal('matchMedia', (query: string) => ({
		matches: query.includes('reduce'),
		addEventListener() {},
		removeEventListener() {}
	}));
}

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

const clip = (surface: HTMLElement) =>
	(surface.querySelector('[aria-hidden="true"]') as HTMLElement).style.clipPath;

describe('Lens', () => {
	test('is one labelled, described tab stop and hides the revealed layer from assistive technology', () => {
		render(Lens, props);
		const surface = screen.getByRole('group', { name: 'Travel answer' });
		expect(surface).toHaveAttribute('tabindex', '0');
		expect(surface).toHaveAttribute('aria-roledescription', 'lens');
		expect(surface).toHaveAccessibleDescription(
			'Under the lens, each claim shows its source. Arrow keys move the lens. Enter makes it larger.'
		);
		expect(
			screen.getByText('From your booking email').closest('[aria-hidden="true"]')
		).not.toBeNull();
	});

	test('opens under a mouse and closes when it leaves', async () => {
		reduceMotion();
		render(Lens, props);
		const surface = screen.getByRole('group');
		mockBox(surface);

		await fireEvent.pointerEnter(surface, { pointerType: 'mouse', clientX: 100, clientY: 80 });
		expect(surface).toHaveAttribute('data-shown');
		expect(clip(surface)).toBe('circle(72px at 100px 80px)');

		await fireEvent.pointerLeave(surface, { pointerType: 'mouse' });
		expect(surface).not.toHaveAttribute('data-shown');
	});

	test('a click toggles the larger lens and announces it', async () => {
		reduceMotion();
		const { container } = render(Lens, props);
		const surface = screen.getByRole('group');
		mockBox(surface);

		await fireEvent.pointerEnter(surface, { pointerType: 'mouse', clientX: 100, clientY: 80 });
		await fireEvent.pointerDown(surface, { pointerType: 'mouse', clientX: 100, clientY: 80 });
		await fireEvent.click(surface, { clientX: 100, clientY: 80 });
		expect(clip(surface)).toBe('circle(118px at 100px 80px)');
		expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent('Large lens');

		// A press that travelled was steering, not clicking.
		await fireEvent.pointerDown(surface, { pointerType: 'mouse', clientX: 100, clientY: 80 });
		await fireEvent.click(surface, { clientX: 140, clientY: 80 });
		expect(clip(surface)).toBe('circle(118px at 100px 80px)');
	});

	test('the keyboard opens, moves, enlarges, and closes the lens', async () => {
		reduceMotion();
		render(Lens, props);
		const surface = screen.getByRole('group');
		mockBox(surface);

		await fireEvent.keyDown(surface, { key: 'ArrowRight' });
		expect(surface).toHaveAttribute('data-shown');
		expect(clip(surface)).toBe('circle(72px at 224px 150px)');

		await fireEvent.keyDown(surface, { key: 'ArrowDown', shiftKey: true });
		expect(clip(surface)).toBe('circle(72px at 224px 222px)');

		await fireEvent.keyDown(surface, { key: 'Enter' });
		expect(clip(surface)).toBe('circle(118px at 224px 222px)');

		await fireEvent.keyDown(surface, { key: 'Escape' });
		expect(surface).not.toHaveAttribute('data-shown');
	});

	test('keeps the lens inside the surface', async () => {
		reduceMotion();
		render(Lens, props);
		const surface = screen.getByRole('group');
		mockBox(surface);
		for (let i = 0; i < 12; i++) await fireEvent.keyDown(surface, { key: 'ArrowLeft' });
		expect(clip(surface)).toBe('circle(72px at 0px 150px)');
	});

	test('handlers passed by the caller run first and can take over a key', async () => {
		reduceMotion();
		const onkeydown = vi.fn((event: KeyboardEvent) => {
			if (event.key === 'Enter') event.preventDefault();
		});
		const onpointerenter = vi.fn();
		render(Lens, { ...props, onkeydown, onpointerenter });
		const surface = screen.getByRole('group');
		mockBox(surface);
		await fireEvent.keyDown(surface, { key: 'ArrowRight' });
		expect(surface).toHaveAttribute('data-shown');
		await fireEvent.keyDown(surface, { key: 'Enter' });
		expect(onkeydown).toHaveBeenCalledTimes(2);
		expect(clip(surface)).toBe('circle(72px at 224px 150px)');
		await fireEvent.pointerEnter(surface, { pointerType: 'mouse', clientX: 10, clientY: 10 });
		expect(onpointerenter).toHaveBeenCalledOnce();
	});
});
