import { act, fireEvent, render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import Checklist from './checklist.svelte';

const tasks = [
	{
		id: 'key',
		title: 'Add an API key',
		description: 'Keys stay in your vault.',
		action: 'Add key'
	},
	{ id: 'model', title: 'Pick a default model', description: 'Change it per chat any time.' },
	{ id: 'invite', title: 'Invite a teammate' }
];

// jsdom has no Web Animations API; Svelte transitions finish on the next microtask.
const nativeAnimate = Element.prototype.animate;
beforeEach(() => {
	vi.useFakeTimers();
	Element.prototype.animate = function () {
		return {
			cancel() {},
			set onfinish(done: () => void) {
				queueMicrotask(done);
			}
		} as unknown as Animation;
	};
});
afterEach(() => {
	Element.prototype.animate = nativeAnimate;
	vi.useRealTimers();
});

const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));
const isInert = (el: Element | null) =>
	!!el && ((el as HTMLElement).inert === true || el.hasAttribute('inert'));
const live = (container: HTMLElement) => container.querySelector('[aria-live="polite"]');

describe('Checklist', () => {
	test('labels the section, counts progress, and exposes it as a progressbar', () => {
		render(Checklist, { tasks, done: ['key'] });
		expect(screen.getByRole('region', { name: 'Get started' })).toBeInTheDocument();
		expect(screen.getByText('1 of 3 complete')).toBeInTheDocument();
		const ring = screen.getByRole('progressbar', { name: 'Setup progress' });
		expect(ring).toHaveAttribute('aria-valuenow', '33');
		expect(ring).toHaveTextContent('33%');
		expect(screen.getByRole('checkbox', { name: 'Add an API key' })).toBeChecked();
	});

	test('checks a task, counts the ring up, and announces the new total', async () => {
		const onToggle = vi.fn();
		const { container } = render(Checklist, { tasks, onToggle });
		await fireEvent.click(screen.getByRole('checkbox', { name: 'Invite a teammate' }));

		expect(onToggle).toHaveBeenCalledWith(tasks[2], true);
		expect(live(container)?.textContent).toBe('Invite a teammate done. 1 of 3 complete.');
		const ring = screen.getByRole('progressbar');
		expect(ring).toHaveAttribute('aria-valuenow', '33');
		await advance(16);
		expect(Number(ring.textContent?.replace('%', ''))).toBeLessThan(33);
		await advance(1000);
		expect(ring).toHaveTextContent('33%');
	});

	test('opens a row with its disclosure button and does the task from its action', async () => {
		const onAction = vi.fn();
		render(Checklist, { tasks, onAction });
		const toggle = screen.getByRole('button', { name: 'Add an API key' });
		expect(toggle).toHaveAttribute('aria-expanded', 'false');
		const details = document.getElementById(toggle.getAttribute('aria-controls') ?? '');
		expect(isInert(details)).toBe(true);

		await fireEvent.click(toggle);
		expect(toggle).toHaveAttribute('aria-expanded', 'true');
		expect(isInert(details)).toBe(false);

		const action = screen.getByRole('button', { name: 'Add key' });
		await fireEvent.click(action);
		expect(onAction).toHaveBeenCalledWith(tasks[0]);
		expect(screen.getByRole('checkbox', { name: 'Add an API key' })).toBeChecked();
		expect(screen.getByRole('button', { name: 'Done' })).toHaveAttribute('aria-disabled', 'true');
	});

	test('celebrates once the last task lands, then offers a dismiss', async () => {
		const onComplete = vi.fn();
		const onDismiss = vi.fn();
		const { container } = render(Checklist, {
			tasks,
			done: ['key', 'model'],
			onComplete,
			onDismiss
		});
		await fireEvent.click(screen.getByRole('checkbox', { name: 'Invite a teammate' }));
		expect(screen.queryByText("You're all set")).not.toBeInTheDocument();

		await advance(1000);
		expect(onComplete).toHaveBeenCalledTimes(1);
		expect(screen.getByText("You're all set")).toBeInTheDocument();
		expect(live(container)?.textContent).toBe("All tasks complete. You're all set.");
		const list = screen.getByRole('list').parentElement?.parentElement ?? null;
		expect(isInert(list)).toBe(true);

		await fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
		expect(onDismiss).toHaveBeenCalledTimes(1);
	});

	test('moves keyboard focus to the finished heading instead of losing it', async () => {
		render(Checklist, { tasks, done: ['key', 'model'] });
		const last = screen.getByRole('checkbox', { name: 'Invite a teammate' });
		last.focus();
		await fireEvent.click(last);
		await advance(1000);
		expect(document.activeElement).toHaveTextContent("You're all set");
	});

	test('keeps keyboard focus in the card with a custom finished state', async () => {
		const finished = createRawSnippet(() => ({ render: () => '<p>Custom finish</p>' }));
		render(Checklist, { tasks, done: ['key', 'model'], finished });
		const last = screen.getByRole('checkbox', { name: 'Invite a teammate' });
		last.focus();
		await fireEvent.click(last);
		await advance(1000);
		expect(document.activeElement).not.toBe(document.body);
		expect(document.activeElement).toHaveTextContent('Custom finish');
	});

	test('returns to the list when a finished task is unchecked from outside', async () => {
		const { rerender } = render(Checklist, { tasks, done: ['key', 'model', 'invite'] });
		await advance(1000);
		expect(screen.getByText("You're all set")).toBeInTheDocument();
		await rerender({ tasks, done: ['key'] });
		expect(screen.queryByText("You're all set")).not.toBeInTheDocument();
		await advance(1000);
		expect(vi.getTimerCount()).toBe(0);
	});
});
