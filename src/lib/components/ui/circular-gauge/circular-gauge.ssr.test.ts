// @vitest-environment node
import { render } from 'svelte/server';
import { describe, expect, test } from 'vitest';

import CircularGauge from './circular-gauge.svelte';

describe('CircularGauge server render', () => {
	test('shows the real reading before the browser takes over', () => {
		const { body } = render(CircularGauge, { props: { value: 72, label: 'Context used' } });
		expect(body).toMatch(/>\s*72\s*</);
		const dash = Number(body.match(/stroke-dasharray="([\d.]+)"/)?.[1]);
		const offset = Number(body.match(/stroke-dashoffset="([\d.]+)"/)?.[1]);
		expect(offset / dash).toBeCloseTo(0.28, 3);
	});

	test('lights the dial ticks up to the reading', () => {
		const { body } = render(CircularGauge, { props: { value: 50, variant: 'ticks' } });
		expect(body.match(/data-lit="true"/g)).toHaveLength(21);
	});
});
