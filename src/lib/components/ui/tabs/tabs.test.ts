import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import Harness from './tabs.test.svelte';

// jsdom has no layout. Settings sits on a second row, as in a wrapped list.
const boxes: Record<string, { x: number; y: number; width: number }> = {
	overview: { x: 4, y: 4, width: 88 },
	activity: { x: 96, y: 4, width: 76 },
	settings: { x: 4, y: 44, width: 80 }
};
const triggerBox = (el: HTMLElement) =>
	el.getAttribute('role') === 'tab' ? boxes[el.dataset.value ?? ''] : undefined;

beforeEach(() => {
	const getters = {
		offsetLeft: (el: HTMLElement) => triggerBox(el)?.x ?? 0,
		offsetTop: (el: HTMLElement) => triggerBox(el)?.y ?? 0,
		offsetWidth: (el: HTMLElement) => triggerBox(el)?.width ?? 0,
		offsetHeight: (el: HTMLElement) => (triggerBox(el) ? 32 : 0)
	};
	for (const [name, get] of Object.entries(getters)) {
		vi.spyOn(HTMLElement.prototype, name as 'offsetLeft', 'get').mockImplementation(function (
			this: HTMLElement
		) {
			return get(this);
		});
	}
});

afterEach(() => {
	vi.restoreAllMocks();
});

function indicator() {
	const el = screen.getByRole('tablist').querySelector<HTMLElement>(':scope > [aria-hidden]');
	if (!el) throw new Error('missing indicator');
	return el;
}

describe('Tabs', () => {
	test('keeps tab semantics with the indicator in the list', () => {
		render(Harness);
		expect(screen.getByRole('tablist', { name: 'Project' })).toHaveAttribute('data-indicator');
		expect(screen.getAllByRole('tab')).toHaveLength(3);
		expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
		expect(screen.getByText('Overview panel')).toBeVisible();
		expect(indicator().style.translate).toBe('4px 4px');
		expect(indicator().style.width).toBe('88px');
	});

	test('the indicator follows clicks, including onto a wrapped row', async () => {
		render(Harness);
		await fireEvent.click(screen.getByRole('tab', { name: 'Activity' }));
		expect(screen.getByRole('tab', { name: 'Activity' })).toHaveAttribute('aria-selected', 'true');
		await vi.waitFor(() => expect(indicator().style.translate).toBe('96px 4px'));

		await fireEvent.click(screen.getByRole('tab', { name: 'Settings' }));
		await vi.waitFor(() => expect(indicator().style.translate).toBe('4px 44px'));
		expect(indicator().style.width).toBe('80px');
	});

	test('arrow keys still move focus and activate tabs', async () => {
		render(Harness);
		const overview = screen.getByRole('tab', { name: 'Overview' });
		overview.focus();

		await fireEvent.keyDown(overview, { key: 'ArrowRight' });
		const activity = screen.getByRole('tab', { name: 'Activity' });
		expect(activity).toHaveFocus();
		expect(activity).toHaveAttribute('aria-selected', 'true');
		expect(screen.getByText('Activity panel')).toBeVisible();
		await vi.waitFor(() => expect(indicator().style.translate).toBe('96px 4px'));
	});
});
