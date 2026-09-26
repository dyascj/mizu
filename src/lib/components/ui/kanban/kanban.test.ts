import { act, fireEvent, render, screen, within } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';

import Fixture from './kanban.test.svelte';

const initial = () => [
	{
		id: 'queued',
		title: 'Queued',
		cards: [
			{ id: 'digest', title: 'Inbox digest' },
			{ id: 'fares', title: 'Fare watch' }
		]
	},
	{ id: 'running', title: 'Running', cards: [{ id: 'scan', title: 'Pricing scan' }] },
	{ id: 'done', title: 'Done', cards: [] }
];

function setup() {
	const onChange = vi.fn();
	const result = render(Fixture, { columns: initial(), onChange });
	const column = (name: string) =>
		within(screen.getByRole('list', { name }))
			.queryAllByRole('button')
			.map((button) => button.textContent?.trim());
	const live = () => result.container.querySelector('[aria-live="assertive"]')?.textContent;
	return { ...result, onChange, column, live };
}

const card = (name: string) => screen.getByRole('button', { name });

describe('Kanban', () => {
	test('renders labelled columns with a single tab stop', () => {
		const { column } = setup();
		expect(screen.getByRole('group', { name: 'Agent tasks' })).toBeInTheDocument();
		expect(column('Queued')).toEqual(['Inbox digest', 'Fare watch']);
		expect(column('Done')).toEqual([]);
		expect(card('Inbox digest')).toHaveAttribute('tabindex', '0');
		expect(card('Fare watch')).toHaveAttribute('tabindex', '-1');
		expect(card('Inbox digest')).toHaveAccessibleDescription(/between columns/);
	});

	test('arrows move focus within and across columns', async () => {
		setup();
		card('Inbox digest').focus();
		await fireEvent.keyDown(card('Inbox digest'), { key: 'ArrowDown' });
		expect(document.activeElement).toBe(card('Fare watch'));
		await fireEvent.keyDown(card('Fare watch'), { key: 'ArrowRight' });
		// The nearest card in the next column, clamped to its length.
		expect(document.activeElement).toBe(card('Pricing scan'));
		// Empty columns are skipped.
		await fireEvent.keyDown(card('Pricing scan'), { key: 'ArrowRight' });
		expect(document.activeElement).toBe(card('Pricing scan'));
	});

	test('moves a held card between columns, keeps focus, and announces', async () => {
		const { column, onChange, live } = setup();
		card('Inbox digest').focus();
		await fireEvent.keyDown(card('Inbox digest'), { key: ' ' });
		expect(card('Inbox digest')).toHaveAttribute('aria-pressed', 'true');
		expect(live()).toMatch(/Picked up Inbox digest, Queued, position 1 of 2/);

		await fireEvent.keyDown(card('Inbox digest'), { key: 'ArrowRight' });
		await fireEvent.keyDown(card('Inbox digest'), { key: 'ArrowRight' });
		expect(column('Done')).toEqual(['Inbox digest']);
		expect(onChange).toHaveBeenCalledTimes(2);
		expect(live()).toBe('Moved to Done, position 1 of 1.');
		expect(document.activeElement).toBe(card('Inbox digest'));

		await fireEvent.keyDown(card('Inbox digest'), { key: 'Enter' });
		expect(card('Inbox digest')).toHaveAttribute('aria-pressed', 'false');
		expect(live()).toBe('Dropped Inbox digest in Done, position 1 of 1.');
	});

	test('Escape returns a held card to where it started', async () => {
		const { column, live } = setup();
		card('Fare watch').focus();
		await fireEvent.keyDown(card('Fare watch'), { key: 'Enter' });
		await fireEvent.keyDown(card('Fare watch'), { key: 'ArrowUp' });
		expect(column('Queued')).toEqual(['Fare watch', 'Inbox digest']);
		await fireEvent.keyDown(card('Fare watch'), { key: 'Escape' });
		expect(column('Queued')).toEqual(['Inbox digest', 'Fare watch']);
		expect(live()).toBe('Cancelled. Fare watch returned to Queued, position 2 of 2.');
	});

	test('a held card is set down when focus leaves the board', async () => {
		const { live } = setup();
		card('Pricing scan').focus();
		await fireEvent.keyDown(card('Pricing scan'), { key: ' ' });
		card('Pricing scan').blur();
		await act(() => new Promise((resolve) => requestAnimationFrame(resolve)));
		expect(card('Pricing scan')).toHaveAttribute('aria-pressed', 'false');
		expect(live()).toBe('Dropped Pricing scan in Running, position 1 of 1.');
	});
});
