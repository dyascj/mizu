import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';

import Harness from './dialog.test.svelte';

const settings = () => screen.getByRole('dialog', { name: 'Assistant settings' });

describe('Dialog', () => {
	test('enters from a slightly smaller scale and leaves with a softer one', async () => {
		render(Harness);
		await fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
		const content = await screen.findByRole('dialog', { name: 'Assistant settings' });
		expect(content).toHaveAttribute('aria-modal', 'true');
		expect(content.className).toContain('motion-safe:data-starting-style:scale-[0.96]');
		expect(content.className).toContain('motion-safe:data-ending-style:scale-[0.98]');
	});

	test('the scrim fades in from its starting style, with no open-state rule to outrank it', async () => {
		render(Harness);
		await fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
		await screen.findByRole('dialog', { name: 'Assistant settings' });
		const overlay = document.querySelector<HTMLElement>('[data-dialog-overlay]')!;
		expect(overlay.className).toContain('data-starting-style:opacity-0');
		// Tailwind emits `data-[state=open]` after `data-starting-style`, so an
		// open-state opacity would win on the first frame and the fade would never run.
		expect(overlay.className).not.toMatch(/data-\[state=open\]:opacity/);
	});

	test('a dialog opened on top steps the one behind back until it closes', async () => {
		render(Harness);
		await fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
		await screen.findByRole('dialog', { name: 'Assistant settings' });
		expect(settings()).not.toHaveAttribute('data-nested-open');
		expect(settings().className).toContain('data-nested-open:scale-[0.97]');

		await fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
		const confirm = await screen.findByRole('dialog', { name: 'Delete assistant?' });
		expect(confirm).toHaveAttribute('data-nested');
		expect(settings()).toHaveAttribute('data-nested-open');

		await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
		await waitFor(() =>
			expect(screen.queryByRole('dialog', { name: 'Delete assistant?' })).not.toBeInTheDocument()
		);
		expect(settings()).not.toHaveAttribute('data-nested-open');
	});
});
