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

const four = [{ label: 'Plan' }, { label: 'Search' }, { label: 'Draft' }, { label: 'Review' }];
const item = (label: string) => screen.getByText(label).closest('li') as HTMLElement;
const delay = (label: string, kind: 'line' | 'step') =>
	parseFloat(item(label).style.getPropertyValue(`--${kind}-delay`));

describe('Stepper motion', () => {
	test('fills connectors as a relay toward the new step and drains them in reverse', async () => {
		const { rerender } = render(Stepper, { steps: four, current: 0 });

		await rerender({ steps: four, current: 3 });
		// Forward: each connector starts after the one before it.
		expect(delay('Plan', 'line')).toBe(0);
		expect(delay('Search', 'line')).toBeGreaterThan(delay('Plan', 'line'));
		expect(delay('Draft', 'line')).toBeGreaterThan(delay('Search', 'line'));
		// A node lights as its line arrives.
		expect(delay('Search', 'step')).toBeGreaterThan(delay('Plan', 'line'));
		expect(delay('Review', 'step')).toBeGreaterThan(delay('Draft', 'step'));

		await rerender({ steps: four, current: 0 });
		// Back: the connector nearest the old step drains first.
		expect(delay('Draft', 'line')).toBe(0);
		expect(delay('Search', 'line')).toBeGreaterThan(delay('Draft', 'line'));
		expect(delay('Plan', 'line')).toBeGreaterThan(delay('Search', 'line'));
	});

	test('announces moves politely but stays quiet on first render', async () => {
		const { container, rerender } = render(Stepper, { steps: four, current: 1 });
		const live = container.querySelector('[aria-live="polite"]');
		expect(live?.textContent).toBe('');

		await rerender({ steps: four, current: 2 });
		expect(live?.textContent).toBe('Step 3 of 4: Draft');
	});

	test('describes each step state to screen readers without renaming it', () => {
		render(Stepper, { steps: four, current: 1 });
		expect(item('Plan')).toHaveTextContent('Plan, completed');
		expect(item('Draft')).toHaveTextContent('Draft, not started');
		expect(item('Search')).toHaveAttribute('aria-current', 'step');
	});

	test('marks every step complete when the flow finishes', async () => {
		const { container, rerender } = render(Stepper, { steps: four, current: 3 });
		expect(item('Review')).toHaveAttribute('aria-current', 'step');

		await rerender({ steps: four, current: 3, complete: true });
		expect(item('Review')).not.toHaveAttribute('aria-current');
		expect(item('Review')).toHaveTextContent('Review, completed');
		expect(container.querySelector('[aria-live="polite"]')?.textContent).toBe('All steps complete');
	});

	test('draws one halo around the current step', async () => {
		const { container, rerender } = render(Stepper, { steps: four, current: 2 });
		const halo = container.querySelectorAll<HTMLElement>('[data-stepper-halo]');
		expect(halo).toHaveLength(1);
		expect(halo[0].style.insetInlineStart).toContain('250%');

		vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }));
		await rerender({ steps: four, current: 0 });
		expect(halo[0].style.insetInlineStart).toContain('50%');
		vi.unstubAllGlobals();
	});
});
