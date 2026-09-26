import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';

import DonutChart from './donut-chart.svelte';

const data = [
	{ label: 'Chat', value: 600 },
	{ label: 'Agents', value: 300 },
	{ label: 'Evals', value: 100, color: 'var(--success)' }
];

function setup(props: Record<string, unknown> = {}) {
	vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }));
	const result = render(DonutChart, {
		data,
		label: 'Requests by workload',
		totalLabel: 'Requests',
		locale: 'en-US',
		...props
	});
	const center = () =>
		(result.container.querySelector('.text-3xl') as HTMLElement).textContent?.trim();
	const caption = () =>
		(result.container.querySelector('.max-w-\\[120px\\]') as HTMLElement).textContent?.trim();
	return { ...result, center, caption };
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('DonutChart', () => {
	test('shows the total in the center and every slice in a data table', () => {
		const { center, caption } = setup();
		expect(center()).toBe('1,000');
		expect(caption()).toBe('Requests');
		const table = screen.getByRole('table', { name: 'Requests by workload' });
		const rows = Array.from(table.querySelectorAll('tbody tr')).map((row) => row.textContent);
		expect(rows).toEqual(['Chat60060%', 'Agents30030%', 'Evals10010%']);
	});

	test('legend buttons preview a slice on hover and pin it on click', async () => {
		const { center, caption } = setup();
		const agents = screen.getByRole('button', { name: /Agents/ });
		expect(agents).toHaveAttribute('aria-pressed', 'false');

		await fireEvent.pointerEnter(agents, { pointerType: 'mouse' });
		expect(center()).toBe('300');
		expect(caption()).toBe('Agents');
		await fireEvent.pointerLeave(agents, { pointerType: 'mouse' });
		expect(center()).toBe('1,000');

		await fireEvent.click(agents);
		expect(agents).toHaveAttribute('aria-pressed', 'true');
		expect(center()).toBe('300');

		await fireEvent.click(agents);
		expect(agents).toHaveAttribute('aria-pressed', 'false');
		expect(center()).toBe('1,000');
	});

	test('pinning one slice unpins the other', async () => {
		setup();
		const chat = screen.getByRole('button', { name: /Chat/ });
		const evals = screen.getByRole('button', { name: /Evals/ });
		await fireEvent.click(chat);
		await fireEvent.click(evals);
		expect(chat).toHaveAttribute('aria-pressed', 'false');
		expect(evals).toHaveAttribute('aria-pressed', 'true');
	});

	test('colors slices by graded primary unless a color is given', () => {
		const { container } = setup();
		const circles = Array.from(container.querySelectorAll('circle'));
		expect(circles[0].style.stroke).toContain('var(--primary) 100%');
		expect(circles[1].style.stroke).toContain('var(--primary) 72%');
		expect(circles[2].style.stroke).toBe('var(--success)');
	});

	test('draws the whole ring at once under reduced motion', () => {
		const { container } = setup();
		const circle = container.querySelector('circle') as SVGCircleElement;
		// The first slice's arc, minus the gap between slices.
		expect(Number.parseFloat(circle.style.strokeDasharray)).toBeGreaterThan(200);
	});

	test('uses a custom format everywhere values are shown', () => {
		const { center } = setup({ format: (v: number) => `${v} req` });
		expect(center()).toBe('1000 req');
		expect(screen.getByRole('button', { name: /Chat/ })).toHaveTextContent('600 req');
	});
});
