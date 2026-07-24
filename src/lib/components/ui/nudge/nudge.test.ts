import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';

import Nudge from './nudge.svelte';

describe('Nudge', () => {
	test('exposes status content and reports dismissal', async () => {
		const onDismiss = vi.fn();
		render(Nudge, { title: 'A useful suggestion', onDismiss });

		expect(screen.getByRole('status')).toHaveTextContent('A useful suggestion');
		await fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
		expect(onDismiss).toHaveBeenCalledOnce();
	});
});
