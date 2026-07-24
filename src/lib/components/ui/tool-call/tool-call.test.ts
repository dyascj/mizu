import { createRawSnippet } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';

import ToolCall from './tool-call.svelte';

const children = createRawSnippet(() => ({ render: () => '<p>Tool result</p>' }));

describe('ToolCall', () => {
	test('reveals completed result content', async () => {
		render(ToolCall, { name: 'Search complete', state: 'done', children });
		const button = screen.getByRole('button', { name: /Search complete/ });

		await fireEvent.click(button);
		expect(button).toHaveAttribute('aria-expanded', 'true');
		expect(screen.getByText('Tool result')).toBeInTheDocument();
	});

	test('cannot open while running', () => {
		render(ToolCall, { name: 'Searching', state: 'running', children });

		expect(screen.getByRole('button', { name: /Searching/ })).toBeDisabled();
		expect(screen.queryByText('Tool result')).not.toBeInTheDocument();
	});
});
