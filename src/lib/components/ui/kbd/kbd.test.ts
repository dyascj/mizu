import { fireEvent, render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';

import Kbd from './kbd.svelte';
import { keyLabel, keyMatches, shortcutMatches, shortcutSpoken } from './keys.js';

const label = (text: string) => createRawSnippet(() => ({ render: () => `<span>${text}</span>` }));

afterEach(() => {
	vi.restoreAllMocks();
});

describe('Kbd', () => {
	test('shrugs off keydown events with no key, as browser autofill sends', async () => {
		render(Kbd, { match: 'k', children: label('K') });
		const bare = new KeyboardEvent('keydown');
		Object.defineProperty(bare, 'key', { value: undefined });
		Object.defineProperty(bare, 'code', { value: undefined });
		expect(() => keyMatches('k', bare, false)).not.toThrow();
		expect(keyMatches('k', bare, false)).toBe(false);
		expect(shortcutMatches(['Mod', 'K'], bare, false)).toBe(false);
		expect(() => window.dispatchEvent(bare)).not.toThrow();
		expect(screen.getByText('K').closest('kbd')).not.toHaveAttribute('data-pressed');
	});

	test('renders a quiet cap by default', () => {
		render(Kbd, { children: label('K') });
		const cap = screen.getByText('K').closest('kbd')!;
		expect(cap).toBeInTheDocument();
		expect(cap).not.toHaveAttribute('data-pressed');
	});

	test('sinks while the matching real key is held and rises on release', async () => {
		render(Kbd, { match: 'k', children: label('K') });
		const cap = screen.getByText('K').closest('kbd')!;

		await fireEvent.keyDown(window, { key: 'k', code: 'KeyK' });
		expect(cap).toHaveAttribute('data-pressed');

		await fireEvent.keyUp(window, { key: 'k', code: 'KeyK' });
		expect(cap).not.toHaveAttribute('data-pressed');
	});

	test('matches letters by physical key so Shift still finds the cap', async () => {
		render(Kbd, { match: 'k', children: label('K') });
		const cap = screen.getByText('K').closest('kbd')!;
		await fireEvent.keyDown(window, { key: 'K', code: 'KeyK', shiftKey: true });
		expect(cap).toHaveAttribute('data-pressed');
	});

	test('ignores other keys and releases when the window loses focus', async () => {
		render(Kbd, { match: 'Enter', children: label('Enter') });
		const cap = screen.getByText('Enter').closest('kbd')!;

		await fireEvent.keyDown(window, { key: 'a', code: 'KeyA' });
		expect(cap).not.toHaveAttribute('data-pressed');

		await fireEvent.keyDown(window, { key: 'Enter', code: 'Enter' });
		expect(cap).toHaveAttribute('data-pressed');
		await fireEvent.blur(window);
		expect(cap).not.toHaveAttribute('data-pressed');
	});

	test('prints the platform label for a modifier and follows its key', async () => {
		render(Kbd, { match: 'mod' });
		const cap = screen.getByText('Ctrl');
		await fireEvent.keyDown(window, { key: 'Control', code: 'ControlLeft', ctrlKey: true });
		expect(cap).toHaveAttribute('data-pressed');
	});

	test('uses Apple glyphs on Apple platforms and releases every cap with Command', async () => {
		vi.spyOn(navigator, 'platform', 'get').mockReturnValue('MacIntel');
		render(Kbd, { match: 'k', children: label('K') });
		const cap = screen.getByText('K').closest('kbd')!;

		await fireEvent.keyDown(window, { key: 'k', code: 'KeyK', metaKey: true });
		expect(cap).toHaveAttribute('data-pressed');
		// macOS never sends the K keyup while Command is down.
		await fireEvent.keyUp(window, { key: 'Meta', code: 'MetaLeft' });
		expect(cap).not.toHaveAttribute('data-pressed');
	});

	test('holds down when pressed from outside', () => {
		render(Kbd, { pressed: true, children: label('S') });
		expect(screen.getByText('S').closest('kbd')).toHaveAttribute('data-pressed');
	});
});

describe('key helpers', () => {
	test('labels and speaks modifiers per platform', () => {
		expect(keyLabel('Mod', true)).toBe('⌘');
		expect(keyLabel('Mod', false)).toBe('Ctrl');
		expect(keyLabel('Shift', true)).toBe('⇧');
		expect(shortcutSpoken(['Mod', 'Shift', 'P'], true)).toBe('Command Shift P');
		expect(shortcutSpoken(['Mod', '['], false)).toBe('Control left bracket');
	});

	test('matches a whole shortcut only with exactly its modifiers', () => {
		const event = (init: KeyboardEventInit) => new KeyboardEvent('keydown', init);
		expect(shortcutMatches(['Mod', 'K'], event({ key: 'k', ctrlKey: true }), false)).toBe(true);
		expect(shortcutMatches(['Mod', 'K'], event({ key: 'k', metaKey: true }), true)).toBe(true);
		expect(
			shortcutMatches(['Mod', 'K'], event({ key: 'k', ctrlKey: true, shiftKey: true }), false)
		).toBe(false);
		expect(shortcutMatches(['K'], event({ key: 'k', ctrlKey: true }), false)).toBe(false);
		expect(shortcutMatches(['?'], event({ key: '?', shiftKey: true }), false)).toBe(true);
	});
});
