import { createRawSnippet } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';

import Reasoning from './reasoning.svelte';

const children = createRawSnippet(() => ({ render: () => '<p>Reasoning details</p>' }));

describe('Reasoning', () => {
	test('toggles its disclosure when complete', async () => {
		render(Reasoning, { summary: 'Thought about it', children });
		const button = screen.getByRole('button', { name: /Thought about it/ });

		expect(button).toHaveAttribute('aria-expanded', 'false');
		await fireEvent.click(button);
		expect(button).toHaveAttribute('aria-expanded', 'true');
		expect(screen.getByText('Reasoning details')).toBeInTheDocument();
	});

	test('stays closed and disabled while streaming', () => {
		render(Reasoning, { streaming: true, label: 'Thinking now', open: true, children });

		expect(screen.getByRole('button', { name: 'Thinking now' })).toBeDisabled();
		expect(screen.queryByText('Reasoning details')).not.toBeInTheDocument();
	});
});
