import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import Reactions from './reactions.svelte';
import type { Reaction, ReactionChoice } from './reactions.svelte';

const nativeAnimate = Element.prototype.animate;
const animate = vi.fn<Element['animate']>(function fakeAnimate() {
	return {
		cancel() {},
		set onfinish(done: () => void) {
			queueMicrotask(done);
		}
	} as unknown as Animation;
});

const nativeGetAnimations = Element.prototype.getAnimations;

beforeEach(() => {
	Element.prototype.animate = animate;
	Element.prototype.getAnimations = () => [];
	animate.mockClear();
	vi.stubGlobal('matchMedia', (query: string) => ({
		matches: false,
		media: query,
		addEventListener() {},
		removeEventListener() {}
	}));
	vi.stubGlobal('requestAnimationFrame', () => 1);
	// jsdom lays nothing out; give the flight a box to land in.
	vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(
		DOMRect.fromRect({ x: 0, y: 0, width: 16, height: 16 })
	);
});

afterEach(() => {
	Element.prototype.animate = nativeAnimate;
	Element.prototype.getAnimations = nativeGetAnimations;
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

const choices: ReactionChoice[] = [
	{ emoji: '👍', label: 'thumbs up' },
	{ emoji: '❤️', label: 'heart' },
	{ emoji: '🎉', label: 'party popper' }
];

function setup(reactions: Reaction[]) {
	const onReact = vi.fn();
	const result = render(Reactions, { reactions, choices, onReact });
	return { ...result, onReact, add: screen.getByRole('button', { name: 'Add reaction' }) };
}

describe('Reactions', () => {
	test('names each pill by emoji, count, and whether the reader is in it', () => {
		setup([
			{ emoji: '🎉', count: 5, mine: true },
			{ emoji: '👍', count: 1, mine: false }
		]);
		expect(
			screen.getByRole('button', { name: 'party popper, 5 people, including you' })
		).toHaveAttribute('aria-pressed', 'true');
		expect(screen.getByRole('button', { name: 'thumbs up, 1 person' })).toHaveAttribute(
			'aria-pressed',
			'false'
		);
		expect(screen.getByRole('button', { name: 'Add reaction' })).toHaveAttribute(
			'aria-expanded',
			'false'
		);
	});

	test('tapping a pill adds or takes back the reader’s reaction, and an emptied pill folds away', async () => {
		const { onReact } = setup([
			{ emoji: '👍', count: 12, mine: false },
			{ emoji: '❤️', count: 1, mine: true }
		]);
		await fireEvent.click(screen.getByRole('button', { name: 'thumbs up, 12 people' }));
		expect(
			screen.getByRole('button', { name: 'thumbs up, 13 people, including you' })
		).toHaveAttribute('aria-pressed', 'true');
		expect(onReact).toHaveBeenLastCalledWith('👍', true);

		await fireEvent.click(screen.getByRole('button', { name: 'heart, 1 person, including you' }));
		expect(onReact).toHaveBeenLastCalledWith('❤️', false);
		await waitFor(() => expect(screen.queryByRole('button', { name: /^heart/ })).toBeNull());
	});

	test('taking back the last reaction on a focused pill keeps focus in the row', async () => {
		const { add } = setup([
			{ emoji: '👀', count: 1, mine: true },
			{ emoji: '👍', count: 3, mine: false }
		]);
		const eyes = screen.getByRole('button', { name: /^👀, 1 person, including you/ });
		eyes.focus();
		await fireEvent.click(eyes);
		const thumbs = screen.getByRole('button', { name: 'thumbs up, 3 people' });
		await waitFor(() => expect(thumbs).toHaveFocus());
		expect(add).not.toHaveFocus();
	});

	test('focus falls back to the add button when the row empties', async () => {
		const { add } = setup([{ emoji: '🎉', count: 1, mine: true }]);
		const pill = screen.getByRole('button', { name: 'party popper, 1 person, including you' });
		pill.focus();
		await fireEvent.click(pill);
		await waitFor(() => expect(add).toHaveFocus());
	});

	test('picking flies the emoji from the picker into a new pill', async () => {
		const { add, onReact } = setup([{ emoji: '👍', count: 2, mine: false }]);
		await fireEvent.click(add);
		expect(add).toHaveAttribute('aria-expanded', 'true');
		const picker = screen.getByRole('group', { name: 'Pick a reaction' });
		expect(add).toHaveAttribute('aria-controls', picker.id);

		await fireEvent.click(screen.getByRole('button', { name: 'React with heart' }));
		expect(onReact).toHaveBeenCalledWith('❤️', true);
		expect(add).toHaveAttribute('aria-expanded', 'false');
		expect(
			screen.getByRole('button', { name: 'heart, 1 person, including you' })
		).toBeInTheDocument();
		await waitFor(() =>
			expect(
				animate.mock.calls.some(([frames]) => 'translate' in ((frames as Keyframe[])[0] ?? {}))
			).toBe(true)
		);
	});

	test('picking one the reader already added takes it back', async () => {
		const { add, onReact } = setup([{ emoji: '🎉', count: 3, mine: true }]);
		await fireEvent.click(add);
		const choice = screen.getByRole('button', { name: 'React with party popper' });
		expect(choice).toHaveAttribute('aria-pressed', 'true');
		await fireEvent.click(choice);
		expect(onReact).toHaveBeenCalledWith('🎉', false);
		expect(screen.getByRole('button', { name: 'party popper, 2 people' })).toBeInTheDocument();
	});

	test('the keyboard opens into the picker, arrows move through it, and Escape returns', async () => {
		const { add } = setup([]);
		add.focus();
		await fireEvent.keyDown(add, { key: 'Enter' });
		await fireEvent.click(add, { detail: 0 });
		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'React with thumbs up' })).toHaveFocus()
		);
		await fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' });
		expect(screen.getByRole('button', { name: 'React with heart' })).toHaveFocus();
		await fireEvent.keyDown(document.activeElement!, { key: 'End' });
		expect(screen.getByRole('button', { name: 'React with party popper' })).toHaveFocus();
		await fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' });
		expect(screen.getByRole('button', { name: 'React with thumbs up' })).toHaveFocus();

		await fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
		expect(add).toHaveAttribute('aria-expanded', 'false');
		expect(add).toHaveFocus();
	});

	test('a press anywhere else closes the picker', async () => {
		const { add } = setup([]);
		await fireEvent.click(add);
		expect(add).toHaveAttribute('aria-expanded', 'true');
		await fireEvent.pointerDown(document.body);
		expect(add).toHaveAttribute('aria-expanded', 'false');
	});
});
