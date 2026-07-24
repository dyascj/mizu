import { render, screen } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';

import CircularGauge from './circular-gauge.svelte';

describe('CircularGauge', () => {
	test('clamps value and geometry to valid meter output', () => {
		render(CircularGauge, { value: Number.NaN, size: -20, strokeWidth: 100 });
		const meter = screen.getByRole('meter', { name: 'Progress' });
		const svg = meter.querySelector('svg');
		const circles = meter.querySelectorAll('circle');

		expect(meter).toHaveAttribute('aria-valuenow', '0');
		expect(meter).toHaveStyle({ width: '16px', height: '16px' });
		expect(svg).toHaveAttribute('width', '16');
		expect(circles[0]).toHaveAttribute('r', '4');
		expect(circles[0]).toHaveAttribute('stroke-width', '8');
	});

	test('uses the primary token for the progress treatment', () => {
		const { container } = render(CircularGauge, { value: 50 });
		const markup = container.innerHTML;

		expect(markup).toContain('var(--primary)');
		expect(markup).not.toMatch(/#(?:5cd5ff|0090d9)|rgba\(1,178,255/);
	});
});
