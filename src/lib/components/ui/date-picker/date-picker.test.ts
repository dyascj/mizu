import { fireEvent, render, screen } from '@testing-library/svelte';
import { CalendarDate } from '@internationalized/date';
import { describe, expect, test, vi } from 'vitest';

import Harness from './date-picker.test.svelte';

const september = new CalendarDate(2026, 9, 15);

async function open() {
	await fireEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
	return screen.findByRole('dialog', { name: 'Choose a date' });
}

describe('DatePicker', () => {
	test('opens a calendar that pages one month at a time', async () => {
		render(Harness, { value: september });
		const dialog = await open();
		expect(dialog).toHaveTextContent('September 2026');

		await fireEvent.click(screen.getByRole('button', { name: /next/i }));
		await vi.waitFor(() => expect(dialog).toHaveTextContent('October 2026'));
		expect(dialog).not.toHaveTextContent('September 2026');
		expect(dialog.querySelectorAll('table')).toHaveLength(1);
	});

	test('marks the chosen day with a single fill and reports it', async () => {
		const onValueChange = vi.fn();
		render(Harness, { value: september, onValueChange });
		const dialog = await open();
		expect(dialog.querySelectorAll('[data-day-fill]')).toHaveLength(1);

		const target = dialog.querySelector<HTMLElement>('[data-bits-day][data-value="2026-09-22"]')!;
		await fireEvent.click(target);
		expect(onValueChange).toHaveBeenLastCalledWith(new CalendarDate(2026, 9, 22));
	});

	test('the selected fill takes its color from the day, so class overrides flow into it', async () => {
		render(Harness, { value: september });
		const dialog = await open();
		const selected = dialog.querySelector<HTMLElement>('[data-bits-day][data-selected]')!;
		expect(selected).toHaveClass('data-[selected]:bg-primary');

		const fill = selected.querySelector('[data-day-fill]')!;
		expect([...fill.classList].filter((name) => /^bg-/.test(name))).toEqual(['bg-inherit']);
	});
});
