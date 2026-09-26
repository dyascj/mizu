import { act, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import TagsInput from './tags-input.svelte';

// jsdom has no Web Animations API; transitions and nudges finish on the next microtask.
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

beforeEach(() => {
	Element.prototype.animate = animate;
	Element.prototype.getAnimations = () => [];
	animate.mockClear();
});

afterEach(() => {
	Element.prototype.animate = nativeAnimate;
	Element.prototype.getAnimations = nativeGetAnimations;
	vi.unstubAllGlobals();
});

const liveRegion = () => document.querySelector('[aria-live="polite"]')?.textContent?.trim();
const chips = (container: HTMLElement) =>
	[...container.querySelectorAll('li')].map(
		(chip) => chip.querySelector('span + span')?.textContent
	);

describe('TagsInput', () => {
	test('adds, deduplicates, removes, and reports tags from the keyboard', async () => {
		const onValueChange = vi.fn();
		render(TagsInput, { value: ['one'], onValueChange });
		const input = screen.getByRole('textbox', { name: 'Add a tag' });

		await fireEvent.input(input, { target: { value: 'two' } });
		await fireEvent.keyDown(input, { key: 'Enter' });
		expect(onValueChange).toHaveBeenLastCalledWith(['one', 'two']);

		await fireEvent.input(input, { target: { value: 'two' } });
		await fireEvent.keyDown(input, { key: ',' });
		expect(onValueChange).toHaveBeenCalledTimes(1);
		expect(input).toHaveValue('two');

		await fireEvent.input(input, { target: { value: '' } });
		await fireEvent.keyDown(input, { key: 'Backspace' });
		expect(onValueChange).toHaveBeenLastCalledWith(['one']);
	});

	test('normalizes the maximum and honors validation', async () => {
		const onValueChange = vi.fn();
		const validate = (tag: string) => tag.startsWith('m');
		render(TagsInput, { value: [], max: 1.4, validate, onValueChange });
		const input = screen.getByRole('textbox', { name: 'Add a tag' });

		await fireEvent.input(input, { target: { value: 'other' } });
		await fireEvent.keyDown(input, { key: 'Enter' });
		expect(onValueChange).not.toHaveBeenCalled();
		expect(input).toHaveValue('other');

		await fireEvent.input(input, { target: { value: 'mizu' } });
		await fireEvent.keyDown(input, { key: 'Enter' });
		expect(onValueChange).toHaveBeenCalledWith(['mizu']);
		expect(input).toHaveAttribute('readonly');
	});
});

test('does not commit a tag during IME composition', async () => {
	const onValueChange = vi.fn();
	render(TagsInput, { onValueChange });
	const input = screen.getByRole('textbox');
	await fireEvent.input(input, { target: { value: '日本語' } });
	await fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
	expect(onValueChange).not.toHaveBeenCalled();
	expect(input).toHaveValue('日本語');
});

describe('TagsInput motion and announcements', () => {
	test('a typed tag forms in place around its letters', async () => {
		const { container } = render(TagsInput, { value: ['one'] });
		const input = screen.getByRole('textbox', { name: 'Add a tag' });

		await fireEvent.input(input, { target: { value: 'two' } });
		await fireEvent.keyDown(input, { key: 'Enter' });
		const chip = container.querySelectorAll('li')[1];
		expect(chip).toHaveAttribute('data-forming');
		expect(chip.querySelector('[aria-hidden="true"]')).toHaveClass('chip-body');
		expect(container.querySelectorAll('li')[0]).not.toHaveAttribute('data-forming');
		expect(liveRegion()).toBe('Added two');
		expect(input).toHaveValue('');
	});

	test('announces removals and keeps focus in the field', async () => {
		const { container } = render(TagsInput, { value: ['alpha', 'beta'] });
		const input = screen.getByRole('textbox', { name: 'Add a tag' });
		await fireEvent.click(screen.getByRole('button', { name: 'Remove alpha' }));
		await act(() => Promise.resolve());
		expect(liveRegion()).toBe('Removed alpha');
		expect(document.activeElement).toBe(input);
		expect(chips(container)).toContain('beta');
	});

	test('nudges the chip that already holds a duplicate and says so', async () => {
		const { container } = render(TagsInput, { value: ['alpha'] });
		const input = screen.getByRole('textbox', { name: 'Add a tag' });
		await fireEvent.input(input, { target: { value: 'alpha' } });
		await fireEvent.keyDown(input, { key: 'Enter' });
		expect(liveRegion()).toBe('alpha is already added');
		const [target, keyframes] = [animate.mock.contexts.at(-1), animate.mock.calls.at(-1)?.[0]];
		expect(target).toBe(container.querySelector('li'));
		expect(keyframes).toHaveProperty('translate');
	});

	test('nudges with a fade instead of a shake under reduced motion', async () => {
		vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }));
		render(TagsInput, { value: ['alpha'] });
		const input = screen.getByRole('textbox', { name: 'Add a tag' });
		await fireEvent.input(input, { target: { value: 'alpha' } });
		await fireEvent.keyDown(input, { key: 'Enter' });
		expect(animate.mock.calls.at(-1)?.[0]).toHaveProperty('opacity');
	});

	test('splits a pasted list into tags', async () => {
		const onValueChange = vi.fn();
		render(TagsInput, { value: ['alpha'], onValueChange });
		const input = screen.getByRole('textbox', { name: 'Add a tag' });
		await fireEvent.paste(input, { clipboardData: { getData: () => 'beta, gamma\nalpha' } });
		expect(onValueChange).toHaveBeenLastCalledWith(['alpha', 'beta', 'gamma']);
		expect(liveRegion()).toBe('Added beta, gamma');
		expect(input).toHaveValue('');
	});

	test('keeps a pasted part that fails validation in the field', async () => {
		const onValueChange = vi.fn();
		render(TagsInput, { validate: (tag: string) => tag.length > 2, onValueChange });
		const input = screen.getByRole('textbox', { name: 'Add a tag' });
		await fireEvent.paste(input, { clipboardData: { getData: () => 'ok,valid' } });
		expect(onValueChange).toHaveBeenLastCalledWith(['valid']);
		expect(input).toHaveValue('ok');
	});

	test('pastes a list over the selected text, not after it', async () => {
		const onValueChange = vi.fn();
		render(TagsInput, { onValueChange });
		const input = screen.getByRole('textbox', { name: 'Add a tag' }) as HTMLInputElement;
		await fireEvent.input(input, { target: { value: 'foo' } });
		input.setSelectionRange(0, 3);
		await fireEvent.paste(input, { clipboardData: { getData: () => 'alpha,beta' } });
		expect(onValueChange).toHaveBeenLastCalledWith(['alpha', 'beta']);
		expect(input).toHaveValue('');
	});

	test('commits at a typed comma even without a comma keydown', async () => {
		const onValueChange = vi.fn();
		render(TagsInput, { onValueChange });
		const input = screen.getByRole('textbox', { name: 'Add a tag' });
		await fireEvent.input(input, { target: { value: 'rain,dr' } });
		expect(onValueChange).toHaveBeenLastCalledWith(['rain']);
		expect(input).toHaveValue('dr');
	});
});
