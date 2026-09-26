import { act, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import ConfirmPopover from './confirm-popover.svelte';

beforeEach(() => {
	vi.stubGlobal(
		'ResizeObserver',
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		}
	);
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.useRealTimers();
});

const props = {
	title: 'Revoke this key?',
	description: 'Agents using it stop working right away.',
	confirmLabel: 'Revoke',
	doneLabel: 'Revoked',
	announcement: 'Key revoked'
};
const live = (container: HTMLElement) =>
	container.querySelector('[aria-live="polite"]')?.textContent?.trim();

describe('ConfirmPopover', () => {
	test('asks in an alert dialog with Cancel focused as the safe default', async () => {
		render(ConfirmPopover, { ...props, onConfirm: vi.fn() });
		const trigger = screen.getByRole('button', { name: 'Revoke' });
		expect(trigger).toHaveAttribute('aria-expanded', 'false');

		await fireEvent.click(trigger);
		const dialog = await screen.findByRole('alertdialog', { name: 'Revoke this key?' });
		expect(dialog).toHaveAccessibleDescription('Agents using it stop working right away.');
		await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus());
		expect(dialog.className).toContain('origin-(--bits-popover-content-transform-origin)');
		// It fades in from its starting style: no open-state rule, which Tailwind
		// emits later, is left to outrank it.
		expect(dialog.className).toContain('data-[starting-style]:opacity-0');
		expect(dialog.className).not.toMatch(/data-\[state=open\]:(opacity|scale)/);
	});

	test('cancel backs out without confirming', async () => {
		const onConfirm = vi.fn();
		render(ConfirmPopover, { ...props, onConfirm });
		await fireEvent.click(screen.getByRole('button', { name: 'Revoke' }));
		await fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
		await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
		expect(onConfirm).not.toHaveBeenCalled();
	});

	test('confirming closes, turns the trigger into its done state, announces, then resets', async () => {
		vi.useFakeTimers();
		const onConfirm = vi.fn();
		const { container } = render(ConfirmPopover, { ...props, onConfirm, resetAfter: 1000 });
		const trigger = screen.getByRole('button', { name: 'Revoke' });

		await fireEvent.click(trigger);
		const dialog = await screen.findByRole('alertdialog');
		await fireEvent.click(
			[...dialog.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Revoke')!
		);

		expect(onConfirm).toHaveBeenCalledOnce();
		expect(trigger).toHaveAttribute('aria-expanded', 'false');
		expect(trigger).toHaveAttribute('data-done');
		expect(trigger).toHaveAttribute('aria-disabled', 'true');
		expect(trigger).toHaveAccessibleName('Revoked');
		expect(live(container)).toBe('Key revoked');

		// A click while done does nothing.
		await fireEvent.click(trigger);
		expect(trigger).toHaveAttribute('aria-expanded', 'false');

		await act(() => vi.advanceTimersByTimeAsync(1000));
		expect(trigger).not.toHaveAttribute('data-done');
		expect(trigger).toHaveAccessibleName('Revoke');
		expect(live(container)).toBe('');
	});

	test('Enter and Space cannot reopen the popover while the trigger shows done', async () => {
		const onConfirm = vi.fn();
		render(ConfirmPopover, { ...props, onConfirm });
		const trigger = screen.getByRole('button', { name: 'Revoke' });

		// The keyboard path opens it normally.
		await fireEvent.keyDown(trigger, { key: 'Enter' });
		const dialog = await screen.findByRole('alertdialog');
		await fireEvent.click(
			[...dialog.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Revoke')!
		);
		expect(trigger).toHaveAttribute('data-done');

		for (const key of ['Enter', ' ']) {
			await fireEvent.keyDown(trigger, { key });
			expect(trigger).toHaveAttribute('aria-expanded', 'false');
		}
		expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
		expect(onConfirm).toHaveBeenCalledOnce();
	});

	test('Escape closes the popover', async () => {
		render(ConfirmPopover, { ...props, onConfirm: vi.fn() });
		await fireEvent.click(screen.getByRole('button', { name: 'Revoke' }));
		await screen.findByRole('alertdialog');
		await fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
		await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
	});
});
