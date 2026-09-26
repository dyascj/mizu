import { fireEvent, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { describe, expect, test } from 'vitest';

import AccordionFixture from './accordion.test.svelte';

const flapOf = (trigger: HTMLElement) =>
	trigger.closest('[data-accordion-item]')!.querySelector('.mizu-accordion-flap');

describe('Accordion', () => {
	test('headers are buttons that open their answers and report it', async () => {
		render(AccordionFixture);
		const trigger = screen.getByRole('button', { name: 'Can it read my files?' });
		expect(trigger).toHaveAttribute('aria-expanded', 'false');

		await fireEvent.click(trigger);
		expect(trigger).toHaveAttribute('aria-expanded', 'true');
		expect(screen.getByText('Only the files you attach.')).toBeVisible();
	});

	test('panels open independently so an open answer never moves the clicked row', async () => {
		render(AccordionFixture);
		const first = screen.getByRole('button', { name: 'Does the assistant remember past chats?' });
		const second = screen.getByRole('button', { name: 'Can it read my files?' });

		await fireEvent.click(first);
		await fireEvent.click(second);
		expect(first).toHaveAttribute('aria-expanded', 'true');
		expect(second).toHaveAttribute('aria-expanded', 'true');
	});

	test('an answer open on arrival is simply there; a click unfolds it', async () => {
		render(AccordionFixture, { defaultOpen: ['memory'] });
		const open = screen.getByRole('button', { name: 'Does the assistant remember past chats?' });
		const closed = screen.getByRole('button', { name: 'Can it read my files?' });
		await tick();
		expect(flapOf(open)).not.toHaveAttribute('data-flap');

		await fireEvent.click(closed);
		await tick();
		expect(flapOf(closed)).toHaveAttribute('data-flap');
	});

	test('arrow keys move between headers', async () => {
		render(AccordionFixture);
		const first = screen.getByRole('button', { name: 'Does the assistant remember past chats?' });
		first.focus();
		await fireEvent.keyDown(first, { key: 'ArrowDown' });
		expect(screen.getByRole('button', { name: 'Can it read my files?' })).toHaveFocus();
	});
});
