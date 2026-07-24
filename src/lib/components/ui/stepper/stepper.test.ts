import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';

import Stepper from './stepper.svelte';

const steps = [{ label: 'Account' }, { label: 'Profile' }, { label: 'Finish' }];

describe('Stepper', () => {
	test('displays out-of-range current values at the nearest valid step', async () => {
		const { rerender } = render(Stepper, { steps, current: 99 });

		expect(screen.getByText('Finish').closest('li')).toHaveAttribute('aria-current', 'step');
		await rerender({ steps, current: -4 });
		expect(screen.getByText('Account').closest('li')).toHaveAttribute('aria-current', 'step');
	});

	test('reports clickable step changes', async () => {
		const onStepChange = vi.fn();
		render(Stepper, { steps, clickable: true, onStepChange });

		await fireEvent.click(screen.getByRole('button', { name: 'Profile' }));
		expect(onStepChange).toHaveBeenCalledWith(1);
		expect(screen.getByText('Profile').closest('li')).toHaveAttribute('aria-current', 'step');
	});
});
