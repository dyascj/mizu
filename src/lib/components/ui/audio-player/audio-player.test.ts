import { act, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// svelte/motion reads the media query as it loads, so the stub comes first.
vi.hoisted(() => {
	window.matchMedia = ((query: string) => ({
		matches: query.includes('reduce'),
		media: query,
		addEventListener() {},
		removeEventListener() {}
	})) as unknown as typeof window.matchMedia;
});

import AudioPlayer from './audio-player.svelte';
import { formatAudioTime, speechPeaks } from './audio-player.svelte';

// Reduced motion (see the stub above) makes seeks land at once, so tests read exact positions.
const chapters = [
	{ start: 0, title: 'Cold open' },
	{ start: 60, title: 'The numbers' },
	{ start: 180, title: 'Questions' }
];

beforeEach(() => {
	vi.useFakeTimers();
	// jsdom has no Web Animations; finish every Svelte transition on the next tick.
	Element.prototype.animate = function () {
		const animation = { onfinish: null as null | (() => void), cancel() {}, currentTime: 0 };
		setTimeout(() => animation.onfinish?.());
		return animation as unknown as Animation;
	};
});

afterEach(() => {
	delete (Element.prototype as Partial<Element>).animate;
	vi.useRealTimers();
	vi.restoreAllMocks();
});

function setup(props: Record<string, unknown> = {}) {
	const result = render(AudioPlayer, {
		title: 'Weekly briefing',
		duration: 300,
		chapters,
		...props
	});
	const slider = screen.getByRole('slider', { name: 'Seek' });
	return { ...result, slider };
}

describe('formatAudioTime', () => {
	test('formats minutes and hours', () => {
		expect(formatAudioTime(0)).toBe('0:00');
		expect(formatAudioTime(94)).toBe('1:34');
		expect(formatAudioTime(3729)).toBe('1:02:09');
	});
});

describe('speechPeaks', () => {
	test('is deterministic, bounded, and quiet where chapters begin', () => {
		const a = speechPeaks(100, 300, chapters);
		expect(a).toEqual(speechPeaks(100, 300, chapters));
		expect(a).toHaveLength(100);
		expect(Math.max(...a)).toBeLessThanOrEqual(1);
		expect(a[20]).toBeLessThan(0.15);
	});
});

describe('AudioPlayer', () => {
	test('exposes a seek slider with a spoken position and chapter', () => {
		const { slider } = setup();
		expect(slider).toHaveAttribute('tabindex', '0');
		expect(slider).toHaveAttribute('aria-valuemin', '0');
		expect(slider).toHaveAttribute('aria-valuemax', '300');
		expect(slider).toHaveAttribute('aria-valuenow', '0');
		expect(slider).toHaveAttribute('aria-valuetext', '0:00 of 5:00, Cold open');
		expect(screen.getByRole('status')).toHaveTextContent('Paused');
	});

	test('seeks with the keyboard', async () => {
		const { slider } = setup();
		await fireEvent.keyDown(slider, { key: 'ArrowRight' });
		expect(slider).toHaveAttribute('aria-valuenow', '5');
		await fireEvent.keyDown(slider, { key: 'PageUp' });
		expect(slider).toHaveAttribute('aria-valuenow', '35');
		await fireEvent.keyDown(slider, { key: 'ArrowLeft' });
		expect(slider).toHaveAttribute('aria-valuenow', '30');
		await fireEvent.keyDown(slider, { key: 'End' });
		expect(slider).toHaveAttribute('aria-valuetext', '5:00 of 5:00, Questions');
		await fireEvent.keyDown(slider, { key: 'Home' });
		expect(slider).toHaveAttribute('aria-valuenow', '0');
	});

	test('jumps to a chapter from the chapter track', async () => {
		const { slider } = setup();
		await fireEvent.click(screen.getByRole('button', { name: 'Chapter 2: The numbers, 1:00' }));
		expect(slider).toHaveAttribute('aria-valuenow', '60');
		expect(slider).toHaveAttribute('aria-valuetext', '1:00 of 5:00, The numbers');
	});

	test('skips back 15 and forward 30 seconds', async () => {
		const { slider } = setup();
		await fireEvent.click(screen.getByRole('button', { name: 'Forward 30 seconds' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Forward 30 seconds' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Back 15 seconds' }));
		expect(slider).toHaveAttribute('aria-valuenow', '45');
	});

	test('plays on a simulated clock and announces the state', async () => {
		let now = 0;
		vi.spyOn(performance, 'now').mockImplementation(() => now);
		const { slider } = setup();
		await fireEvent.click(screen.getByRole('button', { name: 'Play' }));
		expect(screen.getByRole('status')).toHaveTextContent('Playing at 1x');
		now = 3000;
		await act(() => vi.advanceTimersByTimeAsync(100));
		expect(slider).toHaveAttribute('aria-valuenow', '3');

		await fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
		expect(screen.getByRole('status')).toHaveTextContent('Paused');
		now = 9000;
		await act(() => vi.advanceTimersByTimeAsync(100));
		expect(slider).toHaveAttribute('aria-valuenow', '3');
	});

	test('Space toggles playback from the slider', async () => {
		const { slider } = setup();
		await fireEvent.keyDown(slider, { key: ' ' });
		expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
		await fireEvent.keyDown(slider, { key: 'k' });
		expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
	});

	test('cycles the playback speed', async () => {
		setup();
		await fireEvent.click(screen.getByRole('button', { name: 'Playback speed 1x' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Playback speed 1.5x' }));
		expect(screen.getByRole('button', { name: 'Playback speed 2x' })).toBeInTheDocument();
	});

	test('right to left, the timeline mirrors for arrow keys and the pointer', async () => {
		const target = document.body.appendChild(document.createElement('div'));
		target.dir = 'rtl';
		target.style.direction = 'rtl';
		render(AudioPlayer, { target, props: { title: 'Weekly briefing', duration: 300, chapters } });
		const slider = screen.getByRole('slider', { name: 'Seek' });
		await fireEvent.keyDown(slider, { key: 'ArrowLeft' });
		expect(slider).toHaveAttribute('aria-valuenow', '5');
		await fireEvent.keyDown(slider, { key: 'ArrowRight' });
		expect(slider).toHaveAttribute('aria-valuenow', '0');

		// A press a quarter of the way in from the right edge lands a quarter through.
		vi.spyOn(slider, 'getBoundingClientRect').mockReturnValue(
			DOMRect.fromRect({ x: 0, y: 0, width: 400, height: 56 })
		);
		await fireEvent.pointerDown(slider, { button: 0, pointerId: 1, clientX: 300 });
		await fireEvent.pointerUp(slider, { pointerId: 1, clientX: 300 });
		expect(slider).toHaveAttribute('aria-valuenow', '75');
		target.remove();
	});

	test('hides the chapter track when there is only one chapter', () => {
		setup({ chapters: undefined });
		expect(screen.queryByRole('button', { name: /Chapter/ })).toBeNull();
		expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', '0:00 of 5:00');
	});
});
