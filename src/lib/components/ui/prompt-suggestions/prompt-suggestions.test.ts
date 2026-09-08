import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';

import PromptSuggestions from './prompt-suggestions.svelte';

describe('PromptSuggestions', () => {
	test('reports the selected prompt', async () => {
		const onSelect = vi.fn();
		render(PromptSuggestions, { items: ['Plan a trip', 'Summarize this'], onSelect });

		await fireEvent.click(screen.getByRole('button', { name: 'Summarize this' }));
		expect(onSelect).toHaveBeenCalledWith('Summarize this');
	});
});

test('renders repeated suggestions without duplicate keys', async () => {
	const onSelect = vi.fn();
	render(PromptSuggestions, { items: ['Try again', 'Try again'], onSelect });
	const buttons = screen.getAllByRole('button', { name: 'Try again' });
	expect(buttons).toHaveLength(2);
	await fireEvent.click(buttons[1]);
	expect(onSelect).toHaveBeenCalledWith('Try again');
});
