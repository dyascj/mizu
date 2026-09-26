<script lang="ts" module>
	export type VoiceOrbState = 'idle' | 'listening' | 'thinking' | 'speaking';

	/** Loudness of an analyser's current window, mapped so room tone rests near 0 and speech peaks near 1. */
	export function analyserLevel(
		analyser: AnalyserNode,
		samples: Float32Array<ArrayBuffer>
	): number {
		analyser.getFloatTimeDomainData(samples);
		let sum = 0;
		for (const value of samples) sum += value * value;
		const rms = Math.sqrt(sum / samples.length);
		// Room tone sits near 0.005; ordinary speech peaks around 0.1.
		return Math.min(Math.max((rms - 0.008) * 9, 0), 1);
	}
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';
	import { createCloudRenderer } from './cloud-renderer.js';
	import { createMistRenderer, type MistBlob } from './mist-renderer.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** What the assistant is doing. */
		state?: 'idle' | 'listening' | 'thinking' | 'speaking';
		/** Orb diameter in CSS pixels, clamped to 16 through 512. */
		size?: number;
		/**
		 * Normalized audio level from your voice provider, clamped to 0 through 1.
		 * The cloud reads an unset level as silence; the mist simulates a voice.
		 */
		volume?: number;
		/**
		 * A live audio source to follow while listening or speaking, such as the
		 * microphone from `openMicrophone()` or your text-to-speech output. It
		 * takes precedence over `volume`.
		 */
		analyser?: AnalyserNode | null;
		/**
		 * `cloud` is a folded sky for small marks and chrome. `mist` is a glassy
		 * sphere of drifting light for voice screens: it drifts at rest, swirls
		 * while thinking, breathes while speaking, and swells with a live voice.
		 */
		variant?: 'cloud' | 'mist';
		/**
		 * Holds a still frame in either variant. The mist drifts even at rest and
		 * the cloud flows while active, so offer a way to set this when the orb
		 * sits beside other content for long (WCAG 2.2.2).
		 */
		paused?: boolean;
		class?: string;
		ref?: HTMLDivElement | null;
	};
	let {
		state: orbState = 'idle',
		size = 96,
		volume,
		analyser = null,
		variant = 'cloud',
		paused = false,
		class: className,
		ref = $bindable(null),
		...rest
	}: Props = $props();
	const diameter = $derived(Math.min(512, Math.max(16, Number.isFinite(size) ? size : 96)));
	const level = $derived(
		Math.min(1, Math.max(0, volume !== undefined && Number.isFinite(volume) ? volume : 0))
	);
	const mist = $derived(variant === 'mist');
	let canvas: HTMLCanvasElement;
	let body = $state<HTMLSpanElement | null>(null);
	let halos: HTMLSpanElement[] = $state([]);
	let ready = $state(false);
	let refresh: (() => void) | undefined;

	$effect(() => {
		void orbState;
		void level;
		void diameter;
		void variant;
		void paused;
		void analyser;
		refresh?.();
	});

	// Per blob: orbit rate, the Lissajous ratio of its path, and where it
	// starts, so the four never fall into step and the mist never visibly repeats.
	const BLOBS = [
		{ rate: 0.9, a: 1, b: 1.6, phase: 0 },
		{ rate: 0.7, a: 1.4, b: 1, phase: 2.1 },
		{ rate: 1.1, a: 1, b: 1.3, phase: 4.2 },
		{ rate: 0.55, a: 1.7, b: 1.1, phase: 5.3 }
	];

	// How lively the mist is and how far the blobs wander, as a share of the
	// orb. Slow on purpose: the mist drifts like weather and never races. Even
	// the busiest state takes well over ten seconds a lap.
	const MOODS: Record<VoiceOrbState, { speed: number; spread: number }> = {
		idle: { speed: 0.14, spread: 0.12 },
		listening: { speed: 0.22, spread: 0.15 },
		// One slow shared swirl, so thinking reads as a single motion, not noise.
		thinking: { speed: 0.5, spread: 0.18 },
		speaking: { speed: 0.32, spread: 0.17 }
	};

	// A voice lands faster than it fades, but both are soft enough that the
	// orb breathes with speech instead of twitching on every syllable.
	const ATTACK = 7;
	const RELEASE = 2.8;

	onMount(() => {
		if (
			typeof window.matchMedia !== 'function' ||
			typeof IntersectionObserver === 'undefined' ||
			typeof ResizeObserver === 'undefined'
		)
			return;
		const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
		let renderer:
			| { kind: 'cloud'; draw: (time: number, activity: number) => void; destroy: () => void }
			| { kind: 'mist'; draw: (blobs: MistBlob[], dark: boolean) => void; destroy: () => void }
			| undefined;
		let frame = 0;
		let visible = false;
		let previous = 0;
		let flow = 0;
		let smoothedLevel = 0;
		let lost = false;
		let dark = false;

		// Mist state. Each blob's angle advances a little every frame; deriving
		// it from time multiplied by speed would rescale all the time gone by
		// whenever the speed changed, flinging every blob around the orb at once.
		const angles = BLOBS.map((blob) => blob.phase);
		let clock = 0;
		let speed = MOODS[orbState].speed;
		let spread = MOODS[orbState].spread;
		let mistLevel = 0;
		let syllable = 0;
		let target = 0;
		let samples = new Float32Array(1024);
		const blobs: MistBlob[] = BLOBS.map(() => ({ x: 0, y: 0, scale: 1 }));

		function initialize() {
			renderer?.destroy();
			renderer = undefined;
			try {
				if (mist) {
					const created = createMistRenderer(canvas);
					if (created) renderer = { kind: 'mist', ...created };
				} else {
					const created = createCloudRenderer(canvas, diameter);
					if (created) renderer = { kind: 'cloud', ...created };
				}
			} catch {
				renderer = undefined;
			}
			ready = Boolean(renderer);
		}

		function live(): number | null {
			if (!analyser || (orbState !== 'listening' && orbState !== 'speaking')) return null;
			if (samples.length !== analyser.fftSize) samples = new Float32Array(analyser.fftSize);
			return analyserLevel(analyser, samples);
		}

		/** Where the mist's voice level wants to be this frame. */
		function wanted(delta: number): number {
			const heard = live();
			if (heard !== null) return heard;
			if (volume !== undefined) return level;
			if (orbState === 'listening') {
				// A quiet room with the occasional murmur.
				return 0.08 + 0.06 * Math.sin(clock * 2.3) + 0.04 * Math.sin(clock * 5.1);
			}
			if (orbState === 'speaking') {
				// A target that hops every syllable, with the odd pause for breath.
				syllable -= delta;
				if (syllable <= 0) {
					const pause = Math.random() < 0.14;
					syllable = pause ? 0.3 + Math.random() * 0.3 : 0.16 + Math.random() * 0.18;
					target = pause ? 0.05 : 0.35 + Math.random() * 0.5;
				}
				return target;
			}
			if (orbState === 'thinking') return 0.14 + 0.08 * Math.sin(clock * 3.2);
			return 0.06 + 0.04 * Math.sin(clock * 1.3);
		}

		function drawMist(delta: number, still: boolean) {
			const mood = MOODS[orbState];
			// Moods blend rather than switch, settling into a new state in about a second.
			const blend = still ? 1 : 1 - Math.exp(-1.6 * delta);
			speed += (mood.speed - speed) * blend;
			spread += (mood.spread - spread) * blend;
			const want = still && !analyser ? 0 : wanted(delta);
			mistLevel = still
				? want
				: mistLevel +
					(want - mistLevel) * (1 - Math.exp(-(want > mistLevel ? ATTACK : RELEASE) * delta));
			clock += delta;

			const motionLevel = still ? 0 : mistLevel;
			BLOBS.forEach((blob, i) => {
				if (!still) angles[i] += delta * speed * blob.rate;
				// The voice mostly swells and brightens the mist; it only nudges
				// where the blobs are, so loud moments never throw them around.
				const reach = (spread + motionLevel * 0.03) * 2;
				blobs[i].x = Math.cos(angles[i] * blob.a) * reach;
				blobs[i].y = Math.sin(angles[i] * blob.b) * reach;
				blobs[i].scale = 1 + motionLevel * (i % 2 ? 0.22 : 0.14);
			});
			if (renderer?.kind === 'mist') renderer.draw(blobs, dark);

			// The whole orb swells a touch with the voice, and the halos carry
			// the rest outward, the outer one lagging behind. Reduced motion
			// keeps them in place and lets only their glow follow the voice.
			if (body) body.style.scale = String(1 + motionLevel * 0.025);
			halos.forEach((halo, i) => {
				if (!halo) return;
				const grow = 1.12 + i * 0.14 + motionLevel * (0.06 + i * 0.07);
				halo.style.scale = String(still ? 1.12 + i * 0.14 : grow);
				halo.style.opacity = String(Math.min(1, 0.45 + mistLevel * 0.55 - i * 0.12));
			});
		}

		function drawCloud(delta: number, reduced: boolean) {
			if (renderer?.kind !== 'cloud') return;
			const heard = live() ?? level;
			smoothedLevel = reduced
				? 0
				: smoothedLevel + (heard - smoothedLevel) * (1 - Math.exp(-10 * delta));
			const activity =
				orbState === 'speaking'
					? 0.66 + smoothedLevel * 0.34
					: orbState === 'listening'
						? 0.28 + smoothedLevel * 0.32
						: 0.1;
			const pace =
				orbState === 'speaking'
					? 1.65 + smoothedLevel * 1.55
					: orbState === 'listening'
						? 0.72 + smoothedLevel * 0.78
						: 0.24;
			if (!reduced && orbState !== 'idle') flow += delta * pace;
			const scale = reduced
				? 1
				: orbState === 'speaking'
					? 1 + smoothedLevel * 0.12
					: orbState === 'listening'
						? 1 - smoothedLevel * 0.12
						: 1;
			canvas.style.transform = `scale(${scale})`;
			renderer.draw(reduced ? 0 : flow, activity);
		}

		function draw(now: number) {
			frame = 0;
			// A frame's timestamp can predate the sync that scheduled it; never run backward.
			const delta = previous ? Math.min(Math.max(0, (now - previous) / 1000), 0.05) : 0;
			previous = now;
			const reduced = motion.matches;
			let loop: boolean;
			if (mist) {
				// Paused and reduced motion hold a still frame; a live voice under
				// reduced motion still reaches the halos' glow.
				const still = reduced || paused;
				drawMist(delta, still);
				loop = !still || (reduced && !paused && live() !== null);
			} else {
				drawCloud(delta, reduced);
				loop = !reduced && !paused && orbState !== 'idle';
			}
			if (renderer && loop && visible && !document.hidden && !lost)
				frame = requestAnimationFrame(draw);
		}

		function sync() {
			cancelAnimationFrame(frame);
			frame = 0;
			previous = 0;
			// Older engines have no color-scheme to report; read that as light.
			dark = (getComputedStyle(canvas).colorScheme ?? '').includes('dark');
			if (!visible || document.hidden || lost) return;
			if (!renderer || renderer.kind !== variant) {
				// Each variant moves a different layer; clear what the other one left.
				if (mist) canvas.style.removeProperty('transform');
				else body?.style.removeProperty('scale');
				initialize();
			}
			draw(performance.now());
		}

		function contextLost(event: Event) {
			event.preventDefault();
			lost = true;
			ready = false;
			cancelAnimationFrame(frame);
			renderer = undefined;
		}
		function contextRestored() {
			lost = false;
			sync();
		}

		const intersection = new IntersectionObserver(([entry]) => {
			visible = entry.isIntersecting;
			sync();
		});
		intersection.observe(canvas);
		const resize = new ResizeObserver(sync);
		resize.observe(canvas);
		// A theme switch recolors the mist even while it holds still.
		const theme = new MutationObserver(sync);
		theme.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['class', 'style']
		});
		motion.addEventListener('change', sync);
		document.addEventListener('visibilitychange', sync);
		canvas.addEventListener('webglcontextlost', contextLost);
		canvas.addEventListener('webglcontextrestored', contextRestored);
		refresh = sync;

		return () => {
			refresh = undefined;
			cancelAnimationFrame(frame);
			intersection.disconnect();
			resize.disconnect();
			theme.disconnect();
			motion.removeEventListener('change', sync);
			document.removeEventListener('visibilitychange', sync);
			canvas.removeEventListener('webglcontextlost', contextLost);
			canvas.removeEventListener('webglcontextrestored', contextRestored);
			renderer?.destroy();
		};
	});
</script>

<div
	bind:this={ref}
	role="status"
	aria-label={orbState}
	class={cn('voice-orb relative shrink-0 select-none', className)}
	style:width="{diameter}px"
	style:max-width="100%"
	style:aspect-ratio="1"
	data-variant={variant}
	data-renderer={ready ? 'webgl' : 'fallback'}
	{...rest}
>
	{#if mist}
		<!-- Two soft halos carry the voice outward from the glass. -->
		<span
			bind:this={halos[0]}
			aria-hidden="true"
			class="orb-blue pointer-events-none absolute inset-0 scale-[1.12] rounded-full opacity-45"
		></span>
		<span
			bind:this={halos[1]}
			aria-hidden="true"
			class="orb-purple pointer-events-none absolute inset-0 scale-[1.26] rounded-full opacity-35"
		></span>
	{/if}
	<span bind:this={body} class="absolute inset-0 block rounded-full" aria-hidden="true">
		<!-- The mist's glass edge is its own; the still wash only shows until WebGL is up. -->
		<span
			class={cn('orb-fallback', mist && 'orb-fallback-mist')}
			style:opacity={mist && ready ? 0 : undefined}
		></span>
		<canvas
			bind:this={canvas}
			aria-hidden="true"
			class="absolute inset-0 block size-full rounded-full"
			style:opacity={ready ? 1 : 0}
		></canvas>
	</span>
</div>

<style>
	.orb-fallback {
		position: absolute;
		inset: 0;
		border-radius: 50%;
		background: var(
			--voice-orb-fallback,
			linear-gradient(
				180deg,
				rgb(98 106 251),
				rgb(143 157 251) 32%,
				rgb(221 230 253) 52%,
				rgb(201 211 251)
			)
		);
	}

	/* Without WebGL the mist holds as a still wash of the same light. */
	.orb-fallback-mist {
		background:
			var(--orb-blue) 20% 30% / 80% 80% no-repeat,
			var(--orb-purple) 70% 60% / 80% 80% no-repeat,
			var(--voice-orb-fallback);
	}
</style>
