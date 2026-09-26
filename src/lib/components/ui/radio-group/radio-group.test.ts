import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import Harness from './radio-group.test.svelte';

// jsdom has no layout: give each card a box down a column.
const boxes: Record<string, DOMRect> = {
	Hobby: DOMRect.fromRect({ x: 0, y: 0, width: 320, height: 72 }),
	Pro: DOMRect.fromRect({ x: 0, y: 84, width: 320, height: 72 }),
	Team: DOMRect.fromRect({ x: 0, y: 168, width: 320, height: 96 })
};

const nativeAnimate = Element.prototype.animate;
let animations: Keyframe[][] = [];

beforeEach(() => {
	animations = [];
	vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
		const card = this.closest('[role="radio"]');
		return (card && boxes[card.textContent?.trim() ?? '']) || DOMRect.fromRect();
	});
	// jsdom has no Web Animations API; record what a transition asks for and finish at once.
	Element.prototype.animate = function (keyframes: Keyframe[] | PropertyIndexedKeyframes | null) {
		animations.push(keyframes as Keyframe[]);
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
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

const ring = () => document.querySelectorAll('[data-slot="radio-card-ring"]');

describe('RadioGroup cards', () => {
	test('are radios in a labelled group, with the ring on the picked card', () => {
		render(Harness);
		const group = screen.getByRole('radiogroup', { name: 'Plan' });
		const cards = within(group).getAllByRole('radio');
		expect(cards).toHaveLength(3);
		expect(within(group).getByRole('radio', { name: 'Pro' })).toHaveAttribute(
			'aria-checked',
			'true'
		);
		expect(ring()).toHaveLength(1);
		expect(within(group).getByRole('radio', { name: 'Pro' }).contains(ring()[0])).toBe(true);
	});

	test('the ring glides from the card that had it', async () => {
		const onValueChange = vi.fn();
		render(Harness, { onValueChange });
		const hobby = screen.getByRole('radio', { name: 'Hobby' });
		await fireEvent.click(hobby);
		expect(onValueChange).toHaveBeenCalledWith('hobby');
		expect(hobby).toHaveAttribute('aria-checked', 'true');
		expect(ring()).toHaveLength(1);
		expect(hobby.contains(ring()[0])).toBe(true);
		// Starts over the Pro card, 84px lower, and settles in place.
		const frames = animations.at(-1) ?? [];
		expect(String(frames[0]?.translate)).toBe('0px 84px');
		expect(String(frames.at(-1)?.translate)).toBe('0px 0px');
	});

	test('lands without gliding under reduced motion', async () => {
		vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }));
		render(Harness);
		await fireEvent.click(screen.getByRole('radio', { name: 'Hobby' }));
		expect(animations.filter((frames) => frames.some((frame) => frame.translate))).toHaveLength(0);
	});

	test('arrow keys move the selection and the ring', async () => {
		render(Harness);
		const pro = screen.getByRole('radio', { name: 'Pro' });
		pro.focus();
		await fireEvent.keyDown(pro, { key: 'ArrowUp' });
		const hobby = screen.getByRole('radio', { name: 'Hobby' });
		expect(hobby).toHaveAttribute('aria-checked', 'true');
		expect(hobby.contains(ring()[0])).toBe(true);
	});

	test('disabled cards cannot be picked', async () => {
		render(Harness);
		const team = screen.getByRole('radio', { name: 'Team' });
		expect(team).toBeDisabled();
		await fireEvent.click(team);
		expect(team).toHaveAttribute('aria-checked', 'false');
	});

	test('plain items still work beside cards', async () => {
		render(Harness);
		const group = screen.getByRole('radiogroup', { name: 'Tone' });
		await fireEvent.click(within(group).getByRole('radio', { name: 'Bold' }));
		expect(within(group).getByRole('radio', { name: 'Bold' })).toHaveAttribute(
			'aria-checked',
			'true'
		);
	});
});
