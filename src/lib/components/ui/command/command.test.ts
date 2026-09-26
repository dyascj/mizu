import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import Harness from './command.test.svelte';

beforeEach(() => {
	vi.stubGlobal(
		'ResizeObserver',
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		}
	);
	Element.prototype.scrollIntoView ??= () => {};
});

afterEach(() => {
	vi.unstubAllGlobals();
});

const marked = (option: HTMLElement) =>
	[...option.querySelectorAll('.text-foreground')].map((part) => part.textContent);

describe('Command', () => {
	test('one pill carries the highlight between results', () => {
		render(Harness);
		const pills = document.querySelectorAll('[data-highlight-pill]');
		expect(pills).toHaveLength(1);
		expect(pills[0]).toHaveAttribute('aria-hidden', 'true');
		expect(pills[0].parentElement).toHaveAttribute('data-highlight-glide');
	});

	test('marks the part of each result the search matched', async () => {
		render(Harness);
		const input = screen.getByPlaceholderText('Type a command');
		await fireEvent.input(input, { target: { value: 'set' } });

		// A contiguous run wins over scattered letters.
		const settings = await screen.findByRole('option', { name: 'Go to settings' });
		await waitFor(() => expect(marked(settings)).toEqual(['set']));

		// The letters in order are the fallback.
		await fireEvent.input(input, { target: { value: 'swm' } });
		const model = await screen.findByRole('option', { name: 'Switch model' });
		await waitFor(() => expect(marked(model)).toEqual(['Sw', 'm']));
	});

	test('shows labels plainly without a search', () => {
		render(Harness);
		expect(marked(screen.getByRole('option', { name: 'Switch model' }))).toEqual([]);
	});

	test('the dialog toggles with its shortcut and runs the picked command', async () => {
		const onRun = vi.fn();
		render(Harness, { dialog: true, onRun });
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

		await fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
		expect(await screen.findByRole('dialog')).toBeInTheDocument();

		await fireEvent.click(screen.getByRole('option', { name: 'Switch model' }));
		expect(onRun).toHaveBeenCalledWith('Switch model');

		await fireEvent.keyDown(window, { key: 'K', metaKey: true });
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
	});

	test('ignores the letter without a modifier', async () => {
		render(Harness, { dialog: true });
		await fireEvent.keyDown(window, { key: 'k' });
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});
});
