import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';

import ShortcutSheet from './shortcut-sheet.svelte';
import type { Shortcut } from './types.js';

const shortcuts: Shortcut[] = [
	{ id: 'new-chat', label: 'New chat', group: 'Chats', keys: ['Mod', 'K'] },
	{ id: 'next', label: 'Next message', group: 'Chats', keys: ['J'] },
	{ id: 'model', label: 'Switch model', group: 'Models', keys: ['Mod', 'Shift', 'M'] }
];

afterEach(() => {
	vi.useRealTimers();
});

async function openSheet() {
	await fireEvent.keyDown(window, { key: '?', shiftKey: true });
	await tick();
	return screen.findByRole('dialog');
}

describe('ShortcutSheet', () => {
	test('names each group section by its heading, even when the group has spaces', async () => {
		render(ShortcutSheet, {
			shortcuts: [
				...shortcuts,
				{ id: 'bold', label: 'Bold', group: 'Text editing', keys: ['Mod', 'B'] }
			]
		});
		const dialog = await openSheet();
		for (const name of ['Chats', 'Models', 'Text editing']) {
			expect(within(dialog).getByRole('region', { name })).toBeInTheDocument();
		}
	});

	test('renders a trigger that names the sheet and advertises its key', () => {
		render(ShortcutSheet, { shortcuts });
		const trigger = screen.getByRole('button', { name: 'Keyboard shortcuts' });
		expect(trigger).toHaveAttribute('aria-keyshortcuts', '?');
		expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
	});

	test('opens on ? and lists every shortcut by group with spoken keys', async () => {
		const onOpenChange = vi.fn();
		render(ShortcutSheet, { shortcuts, onOpenChange });
		const dialog = await openSheet();

		expect(onOpenChange).toHaveBeenCalledWith(true);
		expect(within(dialog).getByRole('heading', { name: 'Keyboard shortcuts' })).toBeInTheDocument();
		expect(within(dialog).getByRole('heading', { name: 'Chats' })).toBeInTheDocument();
		expect(within(dialog).getByRole('heading', { name: 'Models' })).toBeInTheDocument();
		expect(within(dialog).getByText('Control Shift M')).toBeInTheDocument();
	});

	test('does not open while typing in a field', async () => {
		render(ShortcutSheet, { shortcuts });
		const field = document.createElement('input');
		document.body.append(field);
		await fireEvent.keyDown(field, { key: '?', shiftKey: true });
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		field.remove();
	});

	test('lights the row of a pressed shortcut, reports it, then lets it fade', async () => {
		const onPress = vi.fn();
		render(ShortcutSheet, { shortcuts, onPress });
		const dialog = await openSheet();
		vi.useFakeTimers();

		await fireEvent.keyDown(document.body, {
			key: 'm',
			code: 'KeyM',
			ctrlKey: true,
			shiftKey: true
		});
		const row = within(dialog).getByText('Switch model').closest('li')!;
		expect(row).toHaveAttribute('data-lit');
		expect(onPress).toHaveBeenCalledWith(shortcuts[2]);

		await vi.advanceTimersByTimeAsync(1000);
		expect(row).not.toHaveAttribute('data-lit');
	});

	test('leaves plain keys to the search field but still takes Mod shortcuts there', async () => {
		const onPress = vi.fn();
		render(ShortcutSheet, { shortcuts, onPress });
		const dialog = await openSheet();
		const search = within(dialog).getByRole('searchbox', { name: 'Search shortcuts' });

		await fireEvent.keyDown(search, { key: 'j', code: 'KeyJ' });
		expect(onPress).not.toHaveBeenCalled();

		await fireEvent.keyDown(search, { key: 'k', code: 'KeyK', ctrlKey: true });
		expect(onPress).toHaveBeenCalledWith(shortcuts[0]);
	});

	test('filters by label or group and announces the count', async () => {
		render(ShortcutSheet, { shortcuts });
		const dialog = await openSheet();
		const search = within(dialog).getByRole('searchbox', { name: 'Search shortcuts' });

		await fireEvent.input(search, { target: { value: 'model' } });
		expect(within(dialog).queryByText('New chat')).not.toBeInTheDocument();
		expect(within(dialog).getByText('Switch model')).toBeInTheDocument();
		expect(within(dialog).getByText('1 shortcut')).toHaveAttribute('aria-live', 'polite');

		await fireEvent.input(search, { target: { value: 'zebra' } });
		expect(within(dialog).getByText(/No shortcuts match/)).toBeInTheDocument();
	});

	test('closes when ? is pressed again outside the field', async () => {
		render(ShortcutSheet, { shortcuts });
		const dialog = await openSheet();
		const list = within(dialog).getByRole('region', { name: 'Shortcuts' });

		await fireEvent.keyDown(list, { key: '?', shiftKey: true });
		await tick();
		expect(screen.getByRole('button', { name: 'Keyboard shortcuts' })).toHaveAttribute(
			'aria-expanded',
			'false'
		);
	});

	test('can drop the trigger and the hotkey', async () => {
		render(ShortcutSheet, { shortcuts, trigger: false, hotkey: null });
		expect(screen.queryByRole('button')).not.toBeInTheDocument();
		await fireEvent.keyDown(window, { key: '?', shiftKey: true });
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});
});
