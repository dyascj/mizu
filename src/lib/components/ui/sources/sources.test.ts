import { render, screen } from '@testing-library/svelte';
import { expect, test } from 'vitest';
import Sources from './sources.svelte';

test('keeps repeated citation labels and only links web URLs', () => {
	render(Sources, {
		items: [
			{ label: 'Documentation', url: 'https://example.com/one' },
			{ label: 'Documentation', url: '/docs/two' },
			{ label: 'Unsafe script', url: 'javascript:alert(1)' },
			{ label: 'Unsafe data', url: 'data:text/html,hello' }
		]
	});
	expect(screen.getAllByRole('link')).toHaveLength(2);
	expect(screen.getAllByText('Documentation')).toHaveLength(2);
	expect(screen.getByText('Unsafe script').closest('a')).toBeNull();
	expect(screen.getByText('Unsafe data').closest('a')).toBeNull();
});
