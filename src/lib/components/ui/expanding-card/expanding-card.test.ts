import { act, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import Fixture from './expanding-card.test.svelte';

beforeEach(() => {
	// Reduced motion makes the morph instant, so each step lands in one tick.
	vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }));
});

afterEach(() => vi.unstubAllGlobals());

const flush = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

function setup() {
	const onOpenChange = vi.fn();
	const result = render(Fixture, { onOpenChange });
	const card = screen.getByRole('button', { name: /Churn interviews/ });
	return { ...result, card, onOpenChange };
}

describe('ExpandingCard', () => {
	test('is a button that announces its dialog', () => {
		const { card } = setup();
		expect(card).toHaveAttribute('aria-haspopup', 'dialog');
		expect(card).toHaveAttribute('aria-expanded', 'false');
		expect(card).toHaveTextContent('Aug 30');
		expect(screen.queryByRole('dialog')).toBeNull();
	});

	test('opens into a labelled modal dialog and focuses its close button', async () => {
		const { card, onOpenChange } = setup();
		await fireEvent.click(card);
		await flush();
		const dialog = screen.getByRole('dialog', { name: 'Churn interviews' });
		expect(dialog).toHaveAttribute('aria-modal', 'true');
		expect(dialog).toHaveTextContent('Summarised from 22 call transcripts.');
		expect(card).toHaveAttribute('aria-expanded', 'true');
		expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close' }));
		expect(onOpenChange).toHaveBeenCalledWith(true);
	});

	test('the detail view keeps the direction its card reads in', async () => {
		const target = document.body.appendChild(document.createElement('div'));
		target.style.direction = 'rtl';
		try {
			render(Fixture, { target, props: { onOpenChange: vi.fn() } });
			await fireEvent.click(screen.getByRole('button', { name: /Churn interviews/ }));
			await flush();
			const dialog = screen.getByRole('dialog', { name: 'Churn interviews' });
			expect(target.contains(dialog)).toBe(false);
			expect(dialog.closest('[dir]')).toHaveAttribute('dir', 'rtl');
		} finally {
			target.remove();
		}
	});

	test('Escape closes and returns focus to the card', async () => {
		const { card, onOpenChange } = setup();
		await fireEvent.click(card);
		await flush();
		await fireEvent.keyDown(document, { key: 'Escape' });
		await flush();
		expect(screen.queryByRole('dialog')).toBeNull();
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
		expect(document.activeElement).toBe(card);
	});

	test('the close button and the backdrop both close it', async () => {
		const { card } = setup();
		await fireEvent.click(card);
		await flush();
		await fireEvent.click(screen.getByRole('button', { name: 'Close' }));
		await flush();
		expect(screen.queryByRole('dialog')).toBeNull();

		await fireEvent.click(card);
		await flush();
		const backdrop = document.body.querySelector('.fixed.inset-0[aria-hidden="true"]');
		await fireEvent.click(backdrop!);
		await flush();
		expect(screen.queryByRole('dialog')).toBeNull();
	});

	test('keeps Tab inside the dialog', async () => {
		const { card } = setup();
		await fireEvent.click(card);
		await flush();
		const dialog = screen.getByRole('dialog');
		const close = screen.getByRole('button', { name: 'Close' });
		const link = screen.getByRole('link', { name: 'Open transcripts' });
		link.focus();
		await fireEvent.keyDown(dialog, { key: 'Tab' });
		expect(document.activeElement).toBe(close);
		await fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
		expect(document.activeElement).toBe(link);
	});

	test('opening again mid-fold turns the fold around instead of sticking closed', async () => {
		// Full motion, so the fold is still running when the card is pressed again.
		vi.stubGlobal('matchMedia', () => ({ matches: false }));
		const { card, onOpenChange } = setup();
		await fireEvent.click(card);
		await flush();
		await fireEvent.keyDown(document, { key: 'Escape' });
		await flush();
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
		// The fold is under way: the dialog is still mounted while it folds back.
		const folding = screen.getByRole('dialog', { hidden: true });
		expect(folding).toBeInTheDocument();
		// It lies over the card, so it and the backdrop let a press through to the card.
		expect(folding).toHaveClass('pointer-events-none');
		expect(document.querySelector('.backdrop-blur-sm')).toHaveClass('pointer-events-none');
		await fireEvent.click(card);
		await act(() => new Promise((resolve) => setTimeout(resolve, 1200)));
		expect(onOpenChange).toHaveBeenLastCalledWith(true);
		expect(card).toHaveAttribute('aria-expanded', 'true');
		expect(screen.getByRole('dialog', { name: 'Churn interviews' })).toBeInTheDocument();
		// And it still closes normally afterwards.
		await fireEvent.keyDown(document, { key: 'Escape' });
		await act(() => new Promise((resolve) => setTimeout(resolve, 1200)));
		expect(screen.queryByRole('dialog', { hidden: true })).toBeNull();
	});

	test('calls a caller onclick and lets it cancel opening', async () => {
		const onclick = vi.fn((event: MouseEvent) => event.preventDefault());
		render(Fixture, { onclick });
		const card = screen.getByRole('button', { name: /Churn interviews/ });
		await fireEvent.click(card);
		await flush();
		expect(onclick).toHaveBeenCalledOnce();
		expect(screen.queryByRole('dialog')).toBeNull();
	});

	test('opens and closes from the bound prop', async () => {
		const { rerender, card } = setup();
		await rerender({ open: true });
		await flush();
		expect(screen.getByRole('dialog')).toBeInTheDocument();
		expect(card).toHaveAttribute('aria-expanded', 'true');
		await rerender({ open: false });
		await flush();
		expect(screen.queryByRole('dialog')).toBeNull();
	});
});
