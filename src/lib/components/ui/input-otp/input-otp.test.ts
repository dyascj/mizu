import { act, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import Fixture from './input-otp.test.svelte';

// jsdom has no Web Animations API or ResizeObserver.
const nativeAnimate = Element.prototype.animate;
const nativeGetAnimations = Element.prototype.getAnimations;
const animate = vi.fn(function fakeAnimate(..._args: unknown[]) {
	return {
		cancel() {},
		finished: Promise.resolve(),
		set onfinish(done: () => void) {
			queueMicrotask(done);
		}
	} as unknown as Animation;
});

class NoopResizeObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
}

beforeEach(() => {
	vi.useFakeTimers();
	Element.prototype.animate = animate;
	Element.prototype.getAnimations = () => [];
	animate.mockClear();
	vi.stubGlobal('ResizeObserver', NoopResizeObserver);
	// bits-ui looks for password manager badges beside the field.
	document.elementFromPoint = () => null;
});

afterEach(() => {
	Element.prototype.animate = nativeAnimate;
	Element.prototype.getAnimations = nativeGetAnimations;
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));
const liveRegion = (container: HTMLElement) =>
	container.querySelector('[aria-live="polite"]')?.textContent?.trim();
/** The digits the slots show. */
const digits = (container: HTMLElement) =>
	[...container.querySelectorAll('[data-pin-input-cell]')].map((cell) => cell.textContent?.trim());
const shakes = () =>
	animate.mock.calls.filter(([keyframes]) => 'translate' in (keyframes as object)).length;

async function type(code: string) {
	const input = screen.getByRole('textbox', { name: 'Verification code' });
	await fireEvent.input(input, { target: { value: code } });
	await advance(0);
	return input;
}

describe('InputOTP', () => {
	test('verifies a finished code, locks while checking, and announces success', async () => {
		let resolve: (ok: boolean) => void = () => {};
		const onVerify = vi.fn(() => new Promise<boolean>((done) => (resolve = done)));
		const { container } = render(Fixture, { onVerify });

		const input = await type('123456');
		expect(onVerify).toHaveBeenCalledWith('123456');
		expect(input).toHaveAttribute('readonly');
		expect(container.querySelector('[data-status]')).toHaveAttribute('data-status', 'checking');

		resolve(true);
		await advance(0);
		expect(input).not.toHaveAttribute('readonly');
		expect(liveRegion(container)).toBe('Code verified');
		expect(screen.getByTestId('status')).toHaveTextContent('success');
	});

	test('shakes, marks, and clears a wrong code', async () => {
		const { container } = render(Fixture, { onVerify: () => false });
		const input = await type('000000');

		expect(liveRegion(container)).toBe('Wrong code, try again');
		expect(input).toHaveAttribute('aria-invalid', 'true');
		expect(input).toHaveAttribute('readonly');
		expect(shakes()).toBe(1);
		expect(container.querySelector('[data-pin-input-cell]')).toHaveClass('border-destructive');

		await advance(800);
		expect(input).toHaveValue('');
		expect(digits(container).join('')).toBe('');
		expect(input).not.toHaveAttribute('aria-invalid');
		expect(screen.getByTestId('status')).toHaveTextContent('idle');
	});

	test('treats a verifier that throws as a wrong code', async () => {
		const { container } = render(Fixture, {
			onVerify: () => Promise.reject(new Error('network'))
		});
		await type('123456');
		expect(liveRegion(container)).toBe('Wrong code, try again');
	});

	test('does not shake under reduced motion but still resets', async () => {
		vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }));
		render(Fixture, { onVerify: () => false });
		const input = await type('000000');
		expect(shakes()).toBe(0);
		await advance(800);
		expect(input).toHaveValue('');
	});

	test('shakes and resets when the status is set to error from outside', async () => {
		const { container } = render(Fixture, {});
		const input = await type('4821');
		await fireEvent.click(screen.getByRole('button', { name: 'Reject' }));
		expect(shakes()).toBe(1);
		expect(liveRegion(container)).toBe('Wrong code, try again');
		await advance(800);
		expect(input).toHaveValue('');
	});

	test('typing after success returns to idle', async () => {
		render(Fixture, { onVerify: () => true });
		const input = await type('123456');
		expect(screen.getByTestId('status')).toHaveTextContent('success');
		await fireEvent.input(input, { target: { value: '12345' } });
		expect(screen.getByTestId('status')).toHaveTextContent('idle');
	});

	test('shows a caret and the focus ring in the active slot', async () => {
		const { container } = render(Fixture, {});
		const ring = container.querySelector('[data-pin-input-root] > span[aria-hidden="true"]');
		expect(ring).toHaveAttribute('data-hidden');

		await fireEvent.focus(screen.getByRole('textbox', { name: 'Verification code' }));
		expect(container.querySelector('[data-pin-input-cell] .otp-caret')).toBeInTheDocument();
		expect(ring).not.toHaveAttribute('data-hidden');
	});

	test('keeps the focus ring on a verified code that can still be edited', async () => {
		const { container } = render(Fixture, { onVerify: () => true });
		const ring = container.querySelector('[data-pin-input-root] > span[aria-hidden="true"]');
		const input = await type('123456');
		await fireEvent.focus(input);
		expect(screen.getByTestId('status')).toHaveTextContent('success');
		expect(ring).not.toHaveAttribute('data-hidden');
	});

	test('marks a refused code invalid even when the consumer passes aria-invalid false', async () => {
		render(Fixture, { onVerify: () => false, invalid: false });
		const input = screen.getByRole('textbox', { name: 'Verification code' });
		expect(input).toHaveAttribute('aria-invalid', 'false');
		await type('000000');
		expect(input).toHaveAttribute('aria-invalid', 'true');
	});

	test('ignores a verification that resolves after unmount', async () => {
		let resolve: (ok: boolean) => void = () => {};
		const { unmount } = render(Fixture, {
			onVerify: () => new Promise<boolean>((done) => (resolve = done))
		});
		await type('123456');
		unmount();
		resolve(false);
		await advance(1000);
		expect(shakes()).toBe(0);
	});
});
