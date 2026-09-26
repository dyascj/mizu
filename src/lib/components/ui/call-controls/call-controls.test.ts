import { act, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import CallControls from './call-controls.svelte';
import { formatCallTime } from './call-controls.svelte';

// jsdom has no Web Animations; finish every Svelte transition on the next tick.
beforeEach(() => {
	Element.prototype.animate = function () {
		const animation = { onfinish: null as null | (() => void), cancel() {}, currentTime: 0 };
		setTimeout(() => animation.onfinish?.());
		return animation as unknown as Animation;
	};
});

afterEach(() => {
	delete (Element.prototype as Partial<Element>).animate;
	vi.useRealTimers();
});

const settle = () => act(() => vi.advanceTimersByTimeAsync(600));

function setup(props: Record<string, unknown> = {}) {
	const onPhaseChange = vi.fn();
	const result = render(CallControls, { name: 'Mizu voice', onPhaseChange, ...props });
	const bar = screen.getByRole('group', { name: 'Call with Mizu voice' });
	const live = result.container.querySelector('[aria-live="polite"]')!;
	return { ...result, onPhaseChange, bar, live };
}

describe('formatCallTime', () => {
	test('pads minutes and seconds and adds hours when needed', () => {
		expect(formatCallTime(0)).toBe('00:00');
		expect(formatCallTime(65)).toBe('01:05');
		expect(formatCallTime(3729)).toBe('1:02:09');
		expect(formatCallTime(Number.NaN)).toBe('00:00');
	});
});

describe('CallControls', () => {
	test('rings with accept and decline and announces the caller', () => {
		const { bar, live } = setup();
		expect(bar).toHaveAttribute('data-phase', 'incoming');
		expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Decline' })).toBeInTheDocument();
		expect(screen.getByText('Incoming voice call')).toBeInTheDocument();
		expect(live.textContent).toBe('Mizu voice is calling');
	});

	test('accept turns into hang up in place and the call toggles unfold', async () => {
		vi.useFakeTimers();
		const { bar, live, onPhaseChange } = setup();
		const accept = screen.getByRole('button', { name: 'Accept' });
		await fireEvent.click(accept);
		await settle();
		expect(onPhaseChange).toHaveBeenCalledWith('active');
		expect(bar).toHaveAttribute('data-phase', 'active');
		expect(screen.getByRole('button', { name: 'End call' })).toBe(accept);
		expect(screen.queryByRole('button', { name: 'Decline' })).toBeNull();
		expect(screen.getByRole('button', { name: 'Mute' })).toHaveAttribute('aria-pressed', 'false');
		expect(screen.getByRole('button', { name: 'Speaker' })).toHaveAttribute(
			'aria-pressed',
			'false'
		);
		expect(live.textContent).toBe('Call started');
	});

	test('counts the call time without announcing every second', async () => {
		vi.useFakeTimers();
		const { live } = setup();
		await fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
		await act(() => vi.advanceTimersByTimeAsync(65_000));
		expect(screen.getByText('01:05')).toBeInTheDocument();
		expect(live.textContent).toBe('Call started');

		await fireEvent.click(screen.getByRole('button', { name: 'End call' }));
		await settle();
		expect(screen.getByText('Call ended · 01:05')).toBeInTheDocument();
		expect(live.textContent).toBe('Call ended');
		expect(screen.getByRole('button', { name: 'Call again' })).toBeInTheDocument();
	});

	test('uses the call time it is given', () => {
		setup({ phase: 'active', seconds: 42 });
		expect(screen.getByText('00:42')).toBeInTheDocument();
	});

	test('toggles mute and speaker', async () => {
		setup({ phase: 'active' });
		const mute = screen.getByRole('button', { name: 'Mute' });
		await fireEvent.click(mute);
		expect(mute).toHaveAttribute('aria-pressed', 'true');
		const speaker = screen.getByRole('button', { name: 'Speaker' });
		await fireEvent.click(speaker);
		expect(speaker).toHaveAttribute('aria-pressed', 'true');
	});

	test('declining keeps focus on the bar and offers to call again', async () => {
		vi.useFakeTimers();
		const { onPhaseChange, live } = setup();
		const decline = screen.getByRole('button', { name: 'Decline' });
		decline.focus();
		await fireEvent.click(decline);
		await settle();
		expect(onPhaseChange).toHaveBeenCalledWith('declined');
		expect(live.textContent).toBe('Call declined');
		const again = screen.getByRole('button', { name: 'Call again' });
		expect(again).toHaveFocus();
		await fireEvent.click(again);
		expect(onPhaseChange).toHaveBeenLastCalledWith('incoming');
	});

	test('stops its clock when the call ends or the bar goes away', async () => {
		vi.useFakeTimers();
		const { unmount } = setup({ phase: 'active' });
		await settle();
		expect(vi.getTimerCount()).toBe(1);
		unmount();
		expect(vi.getTimerCount()).toBe(0);
	});
});
