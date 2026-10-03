import { fireEvent, render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import Link from './link.svelte';

const children = createRawSnippet(() => ({ render: () => '<span>Release notes</span>' }));

beforeEach(() => {
	// jsdom has no layout: the link spans 0 to 100px.
	vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
		left: 0,
		width: 100,
		top: 0,
		height: 20,
		right: 100,
		bottom: 20,
		x: 0,
		y: 0,
		toJSON() {}
	});
});

afterEach(() => {
	vi.restoreAllMocks();
});

function setup(props: Record<string, unknown> = {}) {
	render(Link, { props: { href: '/changelog', children, ...props } });
	return screen.getByRole('link', { name: 'Release notes' });
}

const insets = (el: HTMLElement) => [
	el.style.getPropertyValue('--line-left'),
	el.style.getPropertyValue('--line-right')
];

describe('Link', () => {
	test('is a plain anchor with its href and extra attributes', () => {
		const link = setup({ target: '_blank', rel: 'noreferrer' });
		expect(link).toHaveAttribute('href', '/changelog');
		expect(link).toHaveAttribute('target', '_blank');
		expect(link).toHaveAttribute('data-underline', 'hover');
	});

	test('draws the line from the side the pointer entered', async () => {
		const link = setup();
		await fireEvent.pointerEnter(link, { clientX: 90, pointerType: 'mouse' });
		expect(link).toHaveAttribute('data-drawn');
		expect(insets(link)).toEqual(['0%', '0%']);
	});

	test('erases toward the side the pointer left by', async () => {
		const link = setup();
		await fireEvent.pointerEnter(link, { clientX: 10, pointerType: 'mouse' });
		await fireEvent.pointerLeave(link, { clientX: 95, pointerType: 'mouse' });
		expect(link).not.toHaveAttribute('data-drawn');
		expect(link).toHaveAttribute('data-leaving');
		// Collapsed against the right edge.
		expect(insets(link)).toEqual(['100%', '0%']);

		await fireEvent.pointerLeave(link, { clientX: 5, pointerType: 'mouse' });
		expect(insets(link)).toEqual(['0%', '100%']);
	});

	test('ignores touch, which has no hover to follow', async () => {
		const link = setup();
		await fireEvent.pointerEnter(link, { clientX: 10, pointerType: 'touch' });
		expect(link).not.toHaveAttribute('data-drawn');
	});

	test('still calls handlers passed by the consumer', async () => {
		const onpointerenter = vi.fn();
		const onblur = vi.fn();
		const link = setup({ onpointerenter, onblur });
		await fireEvent.pointerEnter(link, { clientX: 10, pointerType: 'mouse' });
		await fireEvent.blur(link);
		expect(onpointerenter).toHaveBeenCalledOnce();
		expect(onblur).toHaveBeenCalledOnce();
	});

	test('erases on blur once the pointer is gone', async () => {
		const link = setup();
		await fireEvent.focus(link);
		await fireEvent.blur(link);
		expect(insets(link)).toEqual(['100%', '0%']);
	});

	test('right to left, focus draws from the right and blur erases to the left', async () => {
		document.body.style.direction = 'rtl';
		try {
			const link = setup();
			vi.spyOn(link, 'matches').mockReturnValue(true);
			await fireEvent.focus(link);
			expect(link).toHaveAttribute('data-drawn');
			await fireEvent.blur(link);
			expect(insets(link)).toEqual(['0%', '100%']);
		} finally {
			document.body.style.direction = '';
		}
	});

	test('can keep a resting line for prose, and wraps with the sentence', () => {
		const link = setup({ underline: 'always' });
		expect(link).toHaveAttribute('data-underline', 'always');
		expect(link).toHaveClass('inline');
		expect(link).not.toHaveClass('whitespace-nowrap');
	});

	test('navigation links stay on one line', () => {
		const link = setup();
		expect(link).toHaveClass('inline-block', 'whitespace-nowrap');
	});

	test('settles once the line has fully gone', async () => {
		const link = setup();
		await fireEvent.pointerEnter(link, { clientX: 10, pointerType: 'mouse' });
		await fireEvent.pointerLeave(link, { clientX: 95, pointerType: 'mouse' });
		await fireEvent(
			link,
			Object.assign(new Event('transitionend', { bubbles: true }), { propertyName: '--line-left' })
		);
		// Gone, so the next draw starts from the entry edge again.
		await fireEvent.pointerEnter(link, { clientX: 5, pointerType: 'mouse' });
		expect(insets(link)).toEqual(['0%', '0%']);
		expect(link).toHaveAttribute('data-drawn');
	});
});
