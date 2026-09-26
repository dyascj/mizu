import { act, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import SendButton from './send-button.svelte';

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));
const liveRegion = (container: HTMLElement) =>
	container.querySelector('[aria-live="polite"]')?.textContent?.trim();

describe('SendButton', () => {
	test('has a stable name and a quiet live region', () => {
		const { container } = render(SendButton, {});
		const button = screen.getByRole('button', { name: 'Send' });
		expect(button).toHaveAttribute('type', 'button');
		expect(liveRegion(container)).toBe('');
	});

	test('sends once, flies the plane, announces Sent, and comes back', async () => {
		const onSend = vi.fn();
		const { container } = render(SendButton, { onSend, timeout: 1600 });
		const button = screen.getByRole('button', { name: 'Send' });
		const plane = container.querySelector<HTMLElement>('button > span > span > span');

		await fireEvent.click(button);
		expect(onSend).toHaveBeenCalledTimes(1);
		expect(button).toHaveAttribute('data-status', 'sending');
		expect(button).toHaveAttribute('aria-disabled', 'true');

		await advance(200);
		expect(plane?.style.translate).not.toBe('');

		// Repeat presses are ignored mid-flight.
		await fireEvent.click(button);
		expect(onSend).toHaveBeenCalledTimes(1);

		await advance(200);
		expect(button).toHaveAttribute('data-status', 'sent');
		expect(liveRegion(container)).toBe('Sent');
		expect(button).toHaveAccessibleName('Send');

		await advance(1200);
		expect(button).toHaveAttribute('data-status', 'idle');
		expect(plane?.style.translate).toBe('');
		expect(liveRegion(container)).toBe('');
	});

	test('submits its form once and holds back a second submission mid-flight', async () => {
		const onsubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
		const form = document.createElement('form');
		form.addEventListener('submit', onsubmit);
		document.body.append(form);
		render(SendButton, { target: form, props: { type: 'submit', iconOnly: true } });
		const button = screen.getByRole('button', { name: 'Send' });
		expect(button).toHaveAttribute('type', 'submit');

		await fireEvent.click(button);
		await fireEvent.click(button);
		expect(onsubmit).toHaveBeenCalledTimes(1);
		form.remove();
	});

	test('stays enabled when disabled arrives mid-flight, then disables at rest', async () => {
		const { rerender } = render(SendButton, { timeout: 1000 });
		const button = screen.getByRole('button', { name: 'Send' });
		await fireEvent.click(button);
		await rerender({ timeout: 1000, disabled: true });
		expect(button).not.toBeDisabled();
		await advance(1000);
		expect(button).toBeDisabled();
	});

	test('skips the flight under reduced motion', async () => {
		vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }));
		const { container } = render(SendButton, {});
		await fireEvent.click(screen.getByRole('button', { name: 'Send' }));
		await advance(0);
		expect(liveRegion(container)).toBe('Sent');
	});

	test('clears its timers and frame loop when destroyed', async () => {
		const { unmount } = render(SendButton, {});
		await fireEvent.click(screen.getByRole('button', { name: 'Send' }));
		await advance(100);
		unmount();
		expect(vi.getTimerCount()).toBe(0);
	});
});
