import { render, screen } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';

import Meter from './meter.svelte';

describe('Meter', () => {
	test('normalizes invalid ranges and clamps its exposed value', () => {
		render(Meter, { value: 200, min: 10, max: 0 });
		const meter = screen.getByRole('meter', { name: 'Meter' });

		expect(meter).toHaveAttribute('aria-valuemin', '10');
		expect(meter).toHaveAttribute('aria-valuemax', '11');
		expect(meter).toHaveAttribute('aria-valuenow', '11');
		expect(meter.firstElementChild).toHaveStyle({ width: '100%' });
	});

	test('formats the clamped display value', () => {
		render(Meter, {
			value: -10,
			min: 0,
			max: 100,
			showValue: true,
			format: (value) => `${value}%`
		});

		expect(screen.getByText('0%')).toBeInTheDocument();
	});
});
