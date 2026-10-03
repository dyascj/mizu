import { fireEvent, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import Harness from './pagination.test.svelte';

// jsdom has no Web Animations API; Svelte transitions finish on the next microtask.
const nativeAnimate = Element.prototype.animate;
beforeEach(() => {
	Element.prototype.animate = function () {
		return {
			cancel() {},
			set onfinish(done: () => void) {
				queueMicrotask(done);
			}
		} as unknown as Animation;
	};
});

afterEach(() => {
	Element.prototype.animate = nativeAnimate;
});

/** What each slot shows, reading the number printed on it. */
function row(container: HTMLElement) {
	return [...container.querySelectorAll('[data-pagination-slot]')].map((slot) =>
		slot.querySelector('button')
			? (slot.querySelector('[aria-hidden="true"]:last-child')?.textContent?.trim() ?? '')
			: 'gap'
	);
}

const pageButton = (n: number) => screen.getByRole('button', { name: `Page ${n}` });

describe('Pagination.Pages', () => {
	test('keeps seven places with the first and last page and marks the current one', () => {
		const { container } = render(Harness);
		expect(row(container)).toEqual(['1', '2', '3', '4', '5', 'gap', '20']);
		expect(pageButton(1)).toHaveAttribute('aria-current', 'page');
		expect(pageButton(2)).not.toHaveAttribute('aria-current');
		expect(screen.getAllByText('More pages')).toHaveLength(1);
	});

	test('centers the current page between two gaps in the middle of a long run', () => {
		const { container } = render(Harness, { page: 10 });
		expect(row(container)).toEqual(['1', 'gap', '9', '10', '11', 'gap', '20']);
	});

	test('shows every page when they all fit', () => {
		const { container } = render(Harness, { count: 50 });
		expect(row(container)).toEqual(['1', '2', '3', '4', '5']);
	});

	test('can keep five places for narrow rows', () => {
		const { container } = render(Harness, { page: 10, slots: 5 });
		expect(row(container)).toEqual(['1', 'gap', '10', 'gap', '20']);
	});

	test('the clicked number stays under the pointer until it leaves the control', async () => {
		const onPageChange = vi.fn();
		const { container } = render(Harness, { onPageChange });
		await fireEvent.pointerDown(pageButton(5), { pointerType: 'mouse' });
		await fireEvent.click(pageButton(5));
		expect(onPageChange).toHaveBeenCalledWith(5);
		expect(pageButton(5)).toHaveAttribute('aria-current', 'page');
		expect(row(container)).toEqual(['1', '2', '3', '4', '5', 'gap', '20']);

		const root = container.querySelector('[data-pagination-root]')!;
		await fireEvent.pointerLeave(root, { pointerType: 'mouse' });
		expect(row(container)).toEqual(['1', 'gap', '4', '5', '6', 'gap', '20']);
	});

	test('the previous and next buttons recenter the row', async () => {
		const { container } = render(Harness);
		await fireEvent.click(pageButton(5));
		await fireEvent.click(screen.getByRole('button', { name: /next/i }));
		expect(pageButton(6)).toHaveAttribute('aria-current', 'page');
		expect(row(container)).toEqual(['1', 'gap', '5', '6', '7', 'gap', '20']);
	});

	test('arrow keys, Home, and End move the page and focus follows it', async () => {
		const { container } = render(Harness, { page: 10 });
		pageButton(10).focus();
		await fireEvent.keyDown(pageButton(10), { key: 'ArrowRight' });
		await tick();
		expect(pageButton(11)).toHaveAttribute('aria-current', 'page');
		expect(pageButton(11)).toHaveFocus();
		expect(row(container)).toEqual(['1', 'gap', '10', '11', '12', 'gap', '20']);

		await fireEvent.keyDown(pageButton(11), { key: 'End' });
		await tick();
		expect(pageButton(20)).toHaveFocus();
		await fireEvent.keyDown(pageButton(20), { key: 'ArrowRight' });
		expect(pageButton(20)).toHaveAttribute('aria-current', 'page');
		await fireEvent.keyDown(pageButton(20), { key: 'Home' });
		await tick();
		expect(pageButton(1)).toHaveFocus();
	});

	test('arrow keys swap in right-to-left text, where the row mirrors', async () => {
		document.body.style.direction = 'rtl';
		try {
			render(Harness, { page: 10 });
			pageButton(10).focus();
			await fireEvent.keyDown(pageButton(10), { key: 'ArrowLeft' });
			await tick();
			expect(pageButton(11)).toHaveAttribute('aria-current', 'page');
			await fireEvent.keyDown(pageButton(11), { key: 'ArrowRight' });
			await tick();
			expect(pageButton(10)).toHaveAttribute('aria-current', 'page');
		} finally {
			document.body.style.direction = '';
		}
	});

	test('a key that cannot move the page leaves later changes alone', async () => {
		render(Harness, { page: 20 });
		pageButton(20).focus();
		await fireEvent.keyDown(pageButton(20), { key: 'ArrowRight' });
		await fireEvent.keyDown(pageButton(20), { key: 'End' });
		const previous = screen.getByRole('button', { name: /previous/i });
		previous.focus();
		await fireEvent.click(previous);
		await tick();
		expect(pageButton(19)).toHaveAttribute('aria-current', 'page');
		expect(previous).toHaveFocus();
	});

	test('reports changes to callback consumers as well as bound ones', async () => {
		const onPageChange = vi.fn();
		render(Harness, { page: 3, onPageChange });
		await fireEvent.click(pageButton(4));
		expect(onPageChange).toHaveBeenCalledOnce();
		expect(onPageChange).toHaveBeenCalledWith(4);
	});
});
