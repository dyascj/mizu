<script lang="ts">
	import { onMount } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';
	import { createCloudRenderer } from './cloud-renderer.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** What the assistant is doing. */
		state?: 'idle' | 'listening' | 'thinking' | 'speaking';
		/** Orb diameter in CSS pixels, clamped to 16 through 512. */
		size?: number;
		/** Normalized audio level from your voice provider, clamped to 0 through 1. */
		volume?: number;
		class?: string;
		ref?: HTMLDivElement | null;
	};
	let {
		state: orbState = 'idle',
		size = 96,
		volume = 0,
		class: className,
		ref = $bindable(null),
		...rest
	}: Props = $props();
	const diameter = $derived(Math.min(512, Math.max(16, Number.isFinite(size) ? size : 96)));
	const level = $derived(Math.min(1, Math.max(0, Number.isFinite(volume) ? volume : 0)));
	let canvas: HTMLCanvasElement;
	let ready = $state(false);
	let refresh: (() => void) | undefined;

	$effect(() => {
		void orbState;
		void level;
		void diameter;
		refresh?.();
	});

	onMount(() => {
		if (
			typeof window.matchMedia !== 'function' ||
			typeof IntersectionObserver === 'undefined' ||
			typeof ResizeObserver === 'undefined'
		)
			return;
		const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
		let renderer: ReturnType<typeof createCloudRenderer>;
		let frame = 0;
		let visible = false;
		let previous = 0;
		let flow = 0;
		let smoothedLevel = 0;
		let lost = false;

		function initialize() {
			try {
				renderer = createCloudRenderer(canvas, diameter);
			} catch {
				renderer = undefined;
			}
			ready = Boolean(renderer);
		}

		function draw(now: number) {
			frame = 0;
			const delta = previous ? Math.min((now - previous) / 1000, 0.05) : 0;
			previous = now;
			const reduced = motion.matches;
			smoothedLevel = reduced
				? 0
				: smoothedLevel + (level - smoothedLevel) * (1 - Math.exp(-10 * delta));
			const activity =
				orbState === 'speaking'
					? 0.66 + smoothedLevel * 0.34
					: orbState === 'listening'
						? 0.28 + smoothedLevel * 0.32
						: 0.1;
			const speed =
				orbState === 'speaking'
					? 1.65 + smoothedLevel * 1.55
					: orbState === 'listening'
						? 0.72 + smoothedLevel * 0.78
						: 0.24;
			if (!reduced && orbState !== 'idle') flow += delta * speed;
			const scale = reduced
				? 1
				: orbState === 'speaking'
					? 1 + smoothedLevel * 0.12
					: orbState === 'listening'
						? 1 - smoothedLevel * 0.12
						: 1;
			canvas.style.transform = `scale(${scale})`;
			renderer?.draw(reduced ? 0 : flow, activity);
			if (renderer && !reduced && visible && !document.hidden && orbState !== 'idle' && !lost)
				frame = requestAnimationFrame(draw);
		}

		function sync() {
			cancelAnimationFrame(frame);
			frame = 0;
			previous = 0;
			if (!visible || document.hidden || lost) return;
			if (!renderer) initialize();
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
	data-renderer={ready ? 'webgl' : 'fallback'}
	{...rest}
>
	<span class="orb-fallback" aria-hidden="true"></span>
	<canvas
		bind:this={canvas}
		aria-hidden="true"
		class="absolute inset-0 block size-full rounded-full"
		style:opacity={ready ? 1 : 0}
	></canvas>
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
</style>
