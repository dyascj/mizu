import { act, fireEvent, render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import StoryProgress from './story-progress.svelte';

type FakeAnimation = {
	playState: 'running' | 'paused' | 'finished';
	onfinish: (() => void) | null;
	pause: () => void;
	play: () => void;
	cancel: () => void;
	finish: () => void;
};

// jsdom has no Web Animations API. The story timer is a fill animation, so
// each one is recorded here and can be finished by hand; anything else (the
// Svelte transitions) finishes on the next microtask.
const nativeAnimate = Element.prototype.animate;
let timers: FakeAnimation[] = [];

function fakeAnimate(this: Element, keyframes: Keyframe[]) {
	const animation: FakeAnimation = {
		playState: 'running',
		onfinish: null,
		pause() {
			this.playState = 'paused';
		},
		play() {
			this.playState = 'running';
		},
		cancel() {},
		finish() {
			this.playState = 'finished';
			this.onfinish?.();
		}
	};
	if (Array.isArray(keyframes) && keyframes[0]?.scale === '0 1') timers.push(animation);
	else queueMicrotask(() => animation.onfinish?.());
	return animation as unknown as Animation;
}

beforeEach(() => {
	vi.useFakeTimers();
	timers = [];
	Element.prototype.animate = fakeAnimate as unknown as typeof Element.prototype.animate;
});

afterEach(() => {
	vi.useRealTimers();
	Element.prototype.animate = nativeAnimate;
});

const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));
const timer = () => timers[timers.length - 1];

const captions = ['1,284 messages', '42 hours saved', '318 agent runs'];
const children = createRawSnippet((index: () => number) => ({
	render: () => `<p>${captions[index()]}</p>`
}));

function setup(props: Record<string, unknown> = {}) {
	const onIndexChange = vi.fn();
	const result = render(StoryProgress, {
		props: { count: 3, children, onIndexChange, label: 'Your month', ...props }
	});
	const region = screen.getByRole('region', { name: 'Your month' });
	region.getBoundingClientRect = () => DOMRect.fromRect({ x: 0, y: 0, width: 300, height: 480 });
	return { ...result, region, onIndexChange };
}

const live = (container: HTMLElement) => container.querySelector('[aria-live]') as HTMLElement;

describe('StoryProgress', () => {
	test('is a focusable stories region that shows the first story', () => {
		const { region } = setup();
		expect(region).toHaveAttribute('aria-roledescription', 'stories');
		expect(region).toHaveAttribute('tabindex', '0');
		expect(screen.getByText('1,284 messages')).toBeInTheDocument();
		expect(screen.getByText('1 / 3')).toBeInTheDocument();
	});

	test('advances quietly when a story runs out', async () => {
		const { container, onIndexChange } = setup();
		expect(timers).toHaveLength(1);
		await act(() => timer().finish());
		await advance(0);
		expect(onIndexChange).toHaveBeenCalledWith(1);
		expect(screen.getByText('42 hours saved')).toBeInTheDocument();
		expect(live(container)).toHaveAttribute('aria-live', 'off');
	});

	test('steps with the arrow keys and announces the story moved to', async () => {
		const { container, region } = setup();
		await fireEvent.keyDown(region, { key: 'ArrowRight' });
		expect(screen.getByText('2 / 3')).toBeInTheDocument();
		expect(live(container)).toHaveAttribute('aria-live', 'polite');
		await fireEvent.keyDown(region, { key: 'ArrowLeft' });
		await fireEvent.keyDown(region, { key: 'ArrowLeft' });
		expect(screen.getByText('3 / 3')).toBeInTheDocument();
	});

	test('pauses and resumes with Space and the pause button', async () => {
		const { region } = setup();
		await fireEvent.keyDown(region, { key: ' ' });
		expect(timer().playState).toBe('paused');
		const button = screen.getByRole('button', { name: 'Play stories' });
		await fireEvent.click(button);
		expect(timer().playState).toBe('running');
		expect(button).toHaveAccessibleName('Pause stories');
	});

	test('holds the timer while pressed, and a hold never navigates', async () => {
		const { region } = setup();
		await fireEvent.pointerDown(region, { button: 0, pointerId: 1, clientX: 250 });
		expect(timer().playState).toBe('paused');
		expect(region).not.toHaveAttribute('data-paused');
		await advance(300);
		expect(region).toHaveAttribute('data-paused');

		await fireEvent.pointerUp(region, { pointerId: 1, clientX: 250 });
		expect(screen.getByText('1 / 3')).toBeInTheDocument();
		expect(timer().playState).toBe('running');
	});

	test('taps the right half for the next story and the left half for the previous', async () => {
		const { region } = setup();
		await fireEvent.pointerDown(region, { button: 0, pointerId: 1, clientX: 250 });
		await fireEvent.pointerUp(region, { pointerId: 1, clientX: 250 });
		expect(screen.getByText('2 / 3')).toBeInTheDocument();
		await fireEvent.pointerDown(region, { button: 0, pointerId: 2, clientX: 40 });
		await fireEvent.pointerUp(region, { pointerId: 2, clientX: 40 });
		expect(screen.getByText('1 / 3')).toBeInTheDocument();
	});

	test('right to left, the arrows and the tap halves swap', async () => {
		document.body.style.direction = 'rtl';
		try {
			const { region } = setup();
			await fireEvent.keyDown(region, { key: 'ArrowLeft' });
			expect(screen.getByText('2 / 3')).toBeInTheDocument();
			await fireEvent.keyDown(region, { key: 'ArrowRight' });
			expect(screen.getByText('1 / 3')).toBeInTheDocument();
			await fireEvent.pointerDown(region, { button: 0, pointerId: 1, clientX: 40 });
			await fireEvent.pointerUp(region, { pointerId: 1, clientX: 40 });
			expect(screen.getByText('2 / 3')).toBeInTheDocument();
			await fireEvent.pointerDown(region, { button: 0, pointerId: 2, clientX: 250 });
			await fireEvent.pointerUp(region, { pointerId: 2, clientX: 250 });
			expect(screen.getByText('1 / 3')).toBeInTheDocument();
		} finally {
			document.body.style.direction = '';
		}
	});

	test('offers previous and next buttons to assistive technology only', async () => {
		setup();
		const next = screen.getByRole('button', { name: 'Next story' });
		await fireEvent.click(next, { detail: 1 });
		expect(screen.getByText('1 / 3')).toBeInTheDocument();
		await fireEvent.click(next, { detail: 0 });
		expect(screen.getByText('2 / 3')).toBeInTheDocument();
		await fireEvent.click(screen.getByRole('button', { name: 'Previous story' }), { detail: 0 });
		expect(screen.getByText('1 / 3')).toBeInTheDocument();
	});

	test('starts paused from the prop and stops after the last story without loop', async () => {
		const onComplete = vi.fn();
		const { region } = setup({ paused: true, loop: false, index: 2, onComplete });
		expect(timer().playState).toBe('paused');
		await fireEvent.keyDown(region, { key: 'ArrowRight' });
		expect(screen.getByText('3 / 3')).toBeInTheDocument();
		await fireEvent.keyDown(region, { key: ' ' });
		await act(() => timer().finish());
		expect(onComplete).toHaveBeenCalledTimes(1);
		expect(screen.getByText('3 / 3')).toBeInTheDocument();
	});
});
