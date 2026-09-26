import { act, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import EmailInput from './email-input.svelte';
import { changedRange, morphPlan, suggestEmail } from './suggest.js';

// jsdom has no Web Animations API; transitions finish on the next microtask.
const nativeAnimate = Element.prototype.animate;
const nativeGetAnimations = Element.prototype.getAnimations;

beforeEach(() => {
	vi.useFakeTimers();
	Element.prototype.animate = function fakeAnimate() {
		return {
			cancel() {},
			finished: Promise.resolve(),
			set onfinish(done: () => void) {
				queueMicrotask(done);
			}
		} as unknown as Animation;
	};
	Element.prototype.getAnimations = () => [];
});

afterEach(() => {
	Element.prototype.animate = nativeAnimate;
	Element.prototype.getAnimations = nativeGetAnimations;
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));
const live = (container: HTMLElement) =>
	container.querySelector('[aria-live="polite"]')?.textContent?.trim();

describe('suggestEmail', () => {
	test('fixes swaps, dropped letters, and slipped endings', () => {
		expect(suggestEmail('maya@gmial.com')).toBe('maya@gmail.com');
		expect(suggestEmail('maya@hotmial.com')).toBe('maya@hotmail.com');
		expect(suggestEmail('maya@yaho.com')).toBe('maya@yahoo.com');
		expect(suggestEmail('maya@gmail.con')).toBe('maya@gmail.com');
		expect(suggestEmail('maya@acme.cmo')).toBe('maya@acme.com');
	});

	test('fixes two slips in a long name that keeps its ending', () => {
		expect(suggestEmail('maya@yahooo.com')).toBe('maya@yahoo.com');
		expect(suggestEmail('maya@hotmali.cmo')).toBe('maya@hotmail.com');
		expect(suggestEmail('maya@hotmial.con')).toBe('maya@hotmail.com');
		expect(suggestEmail('maya@hotmaill.co.uk')).toBe('maya@hotmail.co.uk');
		expect(suggestEmail('maya@outloook.co')).toBe('maya@outlook.com');
	});

	test('never turns a regional provider into another country', () => {
		for (const domain of [
			'yahoo.ca',
			'hotmail.ca',
			'yahoo.co.jp',
			'yahoo.co.in',
			'hotmail.ch',
			'yahoo.cn',
			'hotmail.co.jp',
			'hotmail.fr',
			'hotmail.de',
			'yahoo.co.nz',
			'hotmail.co.nz',
			'live.ca'
		]) {
			expect(suggestEmail(`maya@${domain}`), domain).toBeNull();
		}
	});

	test('leaves real and unfamiliar domains alone', () => {
		expect(suggestEmail('maya@gmail.com')).toBeNull();
		expect(suggestEmail('maya@ymail.com')).toBeNull();
		expect(suggestEmail('maya@acme.io')).toBeNull();
		expect(suggestEmail('maya')).toBeNull();
	});

	test('checks against your own domains', () => {
		expect(suggestEmail('maya@acmecorp.cm', ['acmecorp.com'])).toBe('maya@acmecorp.com');
	});

	test('marks only the letters that changed', () => {
		expect(changedRange('maya@gmial.com', 'maya@gmail.com')).toEqual([7, 9]);
		const { after } = morphPlan('gmial', 'gmail');
		expect(after.map((glyph) => glyph.kind)).toEqual(['keep', 'keep', 'keep', 'move', 'keep']);
	});
});

describe('EmailInput', () => {
	test('suggests a fix once typing pauses, and announces it', async () => {
		const { container } = render(EmailInput, { 'aria-label': 'Work email' });
		const input = screen.getByRole('textbox', { name: 'Work email' });
		expect(input).toHaveAttribute('inputmode', 'email');
		expect(input).toHaveAttribute('autocomplete', 'email');

		await fireEvent.input(input, { target: { value: 'maya@gmial.co' } });
		await fireEvent.input(input, { target: { value: 'maya@gmial.com' } });
		expect(screen.queryByRole('button', { name: /Did you mean/ })).toBeNull();

		await advance(1100);
		const accept = screen.getByRole('button', { name: 'Did you mean maya@gmail.com?' });
		expect(accept.querySelector('.font-semibold')?.textContent).toBe('ai');
		expect(live(container)).toBe('Did you mean maya@gmail.com?');
	});

	test('accepting fixes the address, morphs the letters, and returns the caret', async () => {
		const onValueChange = vi.fn();
		const { container } = render(EmailInput, {
			'aria-label': 'Work email',
			value: 'maya@gmial.com',
			onValueChange
		});
		const input = screen.getByRole<HTMLInputElement>('textbox', { name: 'Work email' });

		await fireEvent.click(screen.getByRole('button', { name: /Did you mean/ }));
		expect(onValueChange).toHaveBeenCalledWith('maya@gmail.com');
		expect(input).toHaveValue('maya@gmail.com');
		expect(input).toHaveClass('text-transparent');
		expect(input).toHaveClass('caret-transparent');
		const overlay = () =>
			[...container.querySelectorAll('[aria-hidden="true"] > span')]
				.map((glyph) => glyph.textContent)
				.join('');
		expect(overlay()).toBe('maya@gmial.com');

		await advance(40);
		expect(overlay()).toBe('maya@gmail.com');
		expect(container.querySelectorAll('.email-fixed')).toHaveLength(2);
		expect(document.activeElement).toBe(input);
		expect(input.selectionStart).toBe(14);
		expect(input).toHaveClass('caret-transparent');

		// The caret comes back once the letters land, while the underline fades.
		await advance(500);
		expect(input).toHaveClass('text-transparent');
		expect(input).not.toHaveClass('caret-transparent');
		expect(container.querySelectorAll('.email-fixed')).toHaveLength(2);

		await advance(1000);
		expect(input).not.toHaveClass('text-transparent');
		expect(screen.queryByRole('button', { name: /Did you mean/ })).toBeNull();
	});

	test('fixes without the morph under reduced motion', async () => {
		vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }));
		render(EmailInput, { 'aria-label': 'Work email', value: 'maya@gmail.con' });
		await fireEvent.click(screen.getByRole('button', { name: /Did you mean/ }));
		const input = screen.getByRole('textbox', { name: 'Work email' });
		expect(input).toHaveValue('maya@gmail.com');
		expect(input).not.toHaveClass('text-transparent');
	});

	test('can be told the address is right', async () => {
		render(EmailInput, { 'aria-label': 'Work email', value: 'maya@gmial.com' });
		await fireEvent.click(screen.getByRole('button', { name: 'No, keep maya@gmial.com' }));
		expect(screen.queryByRole('button', { name: /Did you mean/ })).toBeNull();
		expect(document.activeElement).toBe(screen.getByRole('textbox'));
	});

	test('checks a paste at once, and a typed value when the field is left', async () => {
		render(EmailInput, { 'aria-label': 'Work email' });
		const input = screen.getByRole('textbox', { name: 'Work email' });
		await fireEvent.input(input, { target: { value: 'maya@yaho.com' } });
		expect(screen.getByRole('button', { name: /Did you mean maya@yahoo.com/ })).toBeInTheDocument();

		// A keystroke waits for a pause, or for the field to be left.
		await fireEvent.input(input, { target: { value: 'maya@yaho.co' } });
		await advance(0);
		expect(screen.queryByRole('button', { name: /Did you mean/ })).toBeNull();
		await fireEvent.blur(input);
		expect(screen.getByRole('button', { name: /Did you mean maya@yahoo.co/ })).toBeInTheDocument();

		await fireEvent.input(input, { target: { value: 'maya@gmail.con' } });
		expect(screen.getByRole('button', { name: /Did you mean maya@gmail.com/ })).toBeInTheDocument();
	});

	test('shows the hint while there is nothing to suggest, and describes the field with it', () => {
		render(EmailInput, { 'aria-label': 'Work email', hint: "We'll send a sign-in link here." });
		expect(screen.getByRole('textbox')).toHaveAccessibleDescription(
			"We'll send a sign-in link here."
		);
	});

	test('clears its timers when destroyed', async () => {
		const { unmount } = render(EmailInput, { 'aria-label': 'Work email', value: 'a@gmial.com' });
		await fireEvent.click(screen.getByRole('button', { name: /Did you mean/ }));
		await advance(0);
		const before = vi.getTimerCount();
		unmount();
		expect(vi.getTimerCount()).toBeLessThan(before);
		await advance(2000);
	});
});
