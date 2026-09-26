import { act, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';

// jsdom has no WebGL; stand-in renderers let the frame loop run.
const draws = vi.hoisted(() => ({ cloud: vi.fn(), mist: vi.fn() }));
vi.mock('./cloud-renderer.js', () => ({
	createCloudRenderer: () => ({ draw: draws.cloud, destroy() {} })
}));
vi.mock('./mist-renderer.js', () => ({
	createMistRenderer: () => ({ draw: draws.mist, destroy() {} })
}));

import VoiceOrb from './voice-orb.svelte';
import { analyserLevel } from './voice-orb.svelte';
import { openMicrophone } from './microphone.js';

afterEach(() => {
	vi.unstubAllGlobals();
});

/** An analyser whose time-domain window holds one constant sample value. */
function fakeAnalyser(sample: number) {
	return {
		fftSize: 8,
		getFloatTimeDomainData(target: Float32Array) {
			target.fill(sample);
		}
	} as unknown as AnalyserNode;
}

describe('analyserLevel', () => {
	test('rests at 0 for room tone and saturates at 1 for loud speech', () => {
		const samples = new Float32Array(8);
		expect(analyserLevel(fakeAnalyser(0.005), samples)).toBe(0);
		expect(analyserLevel(fakeAnalyser(0.05), samples)).toBeCloseTo(0.378, 2);
		expect(analyserLevel(fakeAnalyser(0.5), samples)).toBe(1);
	});
});

describe('VoiceOrb', () => {
	test('reports what the assistant is doing', () => {
		render(VoiceOrb, { state: 'listening' });
		expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'listening');
	});

	test('keeps the cloud as the default and offers the mist', () => {
		const { container, unmount } = render(VoiceOrb);
		const cloud = container.querySelector('.voice-orb')!;
		expect(cloud).toHaveAttribute('data-variant', 'cloud');
		expect(cloud.querySelectorAll('.orb-blue, .orb-purple')).toHaveLength(0);
		unmount();

		const mist = render(VoiceOrb, { variant: 'mist', state: 'speaking' }).container;
		const orb = mist.querySelector('.voice-orb')!;
		expect(orb).toHaveAttribute('data-variant', 'mist');
		expect(orb.querySelectorAll('.orb-blue, .orb-purple')).toHaveLength(2);
		expect(orb.querySelector('.orb-fallback-mist')).not.toBeNull();
	});

	test('clamps its size and shows the still fallback without WebGL', () => {
		const { container } = render(VoiceOrb, { size: 2000, variant: 'mist' });
		const orb = container.querySelector<HTMLElement>('.voice-orb')!;
		expect(orb.style.width).toBe('512px');
		expect(orb).toHaveAttribute('data-renderer', 'fallback');
	});

	test('passes attributes through so decorative orbs can hide', () => {
		render(VoiceOrb, { role: 'presentation', 'aria-hidden': 'true' });
		expect(screen.queryByRole('status')).toBeNull();
	});
});

describe('VoiceOrb frame loop', () => {
	/** Stubs what the loop needs, shows the orb on screen, and queues its frames. */
	function stage() {
		let queue: FrameRequestCallback[] = [];
		let now = performance.now();
		vi.stubGlobal('matchMedia', (query: string) => ({
			matches: false,
			media: query,
			addEventListener() {},
			removeEventListener() {}
		}));
		vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
			queue.push(callback);
			return queue.length;
		});
		vi.stubGlobal('cancelAnimationFrame', () => {
			queue = [];
		});
		const shown: IntersectionObserverCallback[] = [];
		vi.stubGlobal(
			'IntersectionObserver',
			class {
				constructor(callback: IntersectionObserverCallback) {
					shown.push(callback);
				}
				observe() {}
				disconnect() {}
			}
		);
		vi.stubGlobal(
			'ResizeObserver',
			class {
				observe() {}
				disconnect() {}
			}
		);
		draws.cloud.mockClear();
		draws.mist.mockClear();
		return {
			pending: () => queue.length,
			show: () =>
				act(() =>
					shown.forEach((callback) =>
						callback(
							[{ isIntersecting: true } as IntersectionObserverEntry],
							{} as IntersectionObserver
						)
					)
				),
			frames(count: number) {
				for (let i = 0; i < count; i++) {
					const run = queue;
					queue = [];
					now += 16;
					for (const callback of run) callback(now);
				}
			}
		};
	}

	test('paused holds the cloud on a still frame too', async () => {
		const loop = stage();
		const { rerender } = render(VoiceOrb, { state: 'speaking', paused: true });
		await loop.show();
		expect(draws.cloud).toHaveBeenCalled();
		expect(loop.pending()).toBe(0);

		await rerender({ state: 'speaking', paused: false });
		expect(loop.pending()).toBe(1);
	});

	test('switching variants clears the styles the other one left behind', async () => {
		const loop = stage();
		const { container, rerender } = render(VoiceOrb, { state: 'speaking', volume: 1 });
		await loop.show();
		loop.frames(30);
		const canvas = container.querySelector('canvas')!;
		const body = canvas.parentElement!;
		expect(canvas.style.transform).toMatch(/scale\(1\.\d+\)/);

		await rerender({ state: 'speaking', volume: 1, variant: 'mist' });
		loop.frames(30);
		expect(canvas.style.transform).toBe('');
		expect(Number(body.style.scale)).toBeGreaterThan(1);

		await rerender({ state: 'speaking', volume: 1, variant: 'cloud' });
		expect(body.style.scale).toBe('');
	});
});

describe('openMicrophone', () => {
	test('wires the stream into an analyser and closes everything once', async () => {
		const stop = vi.fn();
		const close = vi.fn(() => Promise.resolve());
		const connect = vi.fn();
		const analyser = { fftSize: 0 };
		vi.stubGlobal('navigator', {
			mediaDevices: { getUserMedia: vi.fn(async () => ({ getTracks: () => [{ stop }] })) }
		});
		vi.stubGlobal(
			'AudioContext',
			class {
				createAnalyser = () => analyser;
				createMediaStreamSource = () => ({ connect });
				close = close;
			}
		);
		const microphone = await openMicrophone();
		expect(microphone.analyser).toBe(analyser);
		expect(analyser.fftSize).toBe(1024);
		expect(connect).toHaveBeenCalledWith(analyser);
		microphone.close();
		microphone.close();
		expect(stop).toHaveBeenCalledTimes(1);
		expect(close).toHaveBeenCalledTimes(1);
	});

	test('stops the stream when the audio graph cannot be built', async () => {
		const stop = vi.fn();
		vi.stubGlobal('navigator', {
			mediaDevices: { getUserMedia: vi.fn(async () => ({ getTracks: () => [{ stop }] })) }
		});
		vi.stubGlobal(
			'AudioContext',
			class {
				constructor() {
					throw new Error('no audio');
				}
			}
		);
		await expect(openMicrophone()).rejects.toThrow('no audio');
		expect(stop).toHaveBeenCalledTimes(1);
	});

	test('rejects when the reader blocks the microphone', async () => {
		vi.stubGlobal('navigator', {
			mediaDevices: { getUserMedia: vi.fn(async () => Promise.reject(new Error('denied'))) }
		});
		await expect(openMicrophone()).rejects.toThrow('denied');
	});
});
