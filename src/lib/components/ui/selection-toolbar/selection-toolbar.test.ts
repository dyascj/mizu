import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import Harness from './selection-toolbar.test.svelte';

beforeEach(() => {
	vi.stubGlobal(
		'ResizeObserver',
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		}
	);
	vi.stubGlobal('matchMedia', (query: string) => ({
		matches: false,
		media: query,
		addEventListener() {},
		removeEventListener() {}
	}));
	vi.stubGlobal('requestAnimationFrame', () => 1);
	// jsdom has no layout for ranges.
	Range.prototype.getBoundingClientRect = () => new DOMRect(40, 120, 80, 20);
	Range.prototype.getClientRects = () => [new DOMRect(40, 120, 80, 20)] as unknown as DOMRectList;
});

afterEach(() => {
	vi.unstubAllGlobals();
	window.getSelection()?.removeAllRanges();
});

/** Selects `length` characters from `start` inside the element's text. */
async function selectIn(testId: string, start: number, length: number) {
	const node = screen.getByTestId(testId).firstChild!;
	const range = document.createRange();
	range.setStart(node, start);
	range.setEnd(node, start + length);
	const selection = window.getSelection()!;
	selection.removeAllRanges();
	selection.addRange(range);
	await fireEvent(document, new Event('selectionchange'));
}

// Queried directly: a closed toolbar is aria-hidden, which role queries skip.
const toolbar = () => document.querySelector<HTMLElement>('[role="toolbar"]')!;

describe('SelectionToolbar', () => {
	test('stays hidden and out of the tab order until text is selected', () => {
		render(Harness);
		expect(toolbar()).toHaveAttribute('aria-label', 'Draft actions');
		expect(toolbar()).toHaveAttribute('aria-hidden', 'true');
		expect(toolbar()).toHaveAttribute('data-state', 'closed');
		expect(toolbar().inert).toBe(true);
	});

	test('appears for a selection inside the text and hands its actions the selected text', async () => {
		const onAsk = vi.fn();
		render(Harness, { onAsk });
		await selectIn('text', 4, 14);
		await waitFor(() => expect(toolbar()).toHaveAttribute('data-state', 'open'));
		expect(toolbar()).not.toHaveAttribute('aria-hidden');

		await fireEvent.click(screen.getByRole('button', { name: 'Ask' }));
		expect(onAsk).toHaveBeenCalledWith('retrieval step');
	});

	test('ignores selections elsewhere on the page', async () => {
		render(Harness);
		await selectIn('outside', 0, 9);
		expect(toolbar()).toHaveAttribute('data-state', 'closed');
	});

	test('closes when the selection collapses', async () => {
		render(Harness);
		await selectIn('text', 4, 14);
		await waitFor(() => expect(toolbar()).toHaveAttribute('data-state', 'open'));
		window.getSelection()?.collapseToStart();
		await fireEvent(document, new Event('selectionchange'));
		await waitFor(() => expect(toolbar()).toHaveAttribute('data-state', 'closed'));
	});

	test('one tab stop, arrow keys between buttons, and Escape to dismiss', async () => {
		render(Harness);
		await selectIn('text', 4, 14);
		await waitFor(() => expect(toolbar()).toHaveAttribute('data-state', 'open'));
		const [ask, explain, bold] = screen.getAllByRole('button');
		await waitFor(() => expect(ask).toHaveAttribute('tabindex', '0'));
		expect(explain).toHaveAttribute('tabindex', '-1');

		ask.focus();
		await fireEvent.keyDown(ask, { key: 'ArrowRight' });
		expect(explain).toHaveFocus();
		await fireEvent.keyDown(explain, { key: 'End' });
		expect(bold).toHaveFocus();
		expect(bold).toHaveAttribute('aria-pressed', 'false');
		await fireEvent.keyDown(bold, { key: 'ArrowRight' });
		expect(ask).toHaveFocus();

		await fireEvent.keyDown(ask, { key: 'Escape' });
		await waitFor(() => expect(toolbar()).toHaveAttribute('data-state', 'closed'));
		// Stays dismissed for the same selection.
		await fireEvent(document, new Event('selectionchange'));
		expect(toolbar()).toHaveAttribute('data-state', 'closed');
	});

	test('right to left, ArrowLeft moves to the next button', async () => {
		document.body.style.direction = 'rtl';
		try {
			render(Harness);
			await selectIn('text', 4, 14);
			await waitFor(() => expect(toolbar()).toHaveAttribute('data-state', 'open'));
			const [ask, explain] = screen.getAllByRole('button');
			ask.focus();
			await fireEvent.keyDown(ask, { key: 'ArrowLeft' });
			expect(explain).toHaveFocus();
			await fireEvent.keyDown(explain, { key: 'ArrowRight' });
			expect(ask).toHaveFocus();
		} finally {
			document.body.style.direction = '';
		}
	});

	test('announces what actions report', async () => {
		const { container } = render(Harness);
		await selectIn('text', 4, 14);
		await waitFor(() => expect(toolbar()).toHaveAttribute('data-state', 'open'));
		await fireEvent.click(screen.getByRole('button', { name: 'Bold' }));
		await waitFor(() =>
			expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent('Bold on')
		);
	});

	test('typing hides it at once', async () => {
		render(Harness);
		await selectIn('text', 4, 14);
		await waitFor(() => expect(toolbar()).toHaveAttribute('data-state', 'open'));
		await fireEvent.keyDown(screen.getByTestId('text'), { key: 'a' });
		expect(toolbar()).toHaveAttribute('data-state', 'closed');
		expect(toolbar().className).toContain('data-[state=closed]:transition-none');
	});
});
