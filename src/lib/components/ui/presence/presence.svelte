<script lang="ts" module>
	export type PresenceState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'happy' | 'sleeping';
	export type PresenceTone = 'water' | 'iris' | 'ember' | 'mint' | 'mono';

	const defaultLabels: Record<PresenceState, string> = {
		idle: 'Assistant is ready',
		listening: 'Assistant is listening',
		thinking: 'Assistant is thinking',
		speaking: 'Assistant is speaking',
		happy: 'Assistant is pleased',
		sleeping: 'Assistant is resting'
	};
</script>

<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** What the assistant is doing. Each state has its own expression and motion. */
		state?: PresenceState;
		/** Color family. `mono` follows the theme's foreground. */
		tone?: PresenceTone;
		/** Diameter in CSS pixels, clamped to 24 through 480. */
		size?: number;
		/** Normalized audio level while listening or speaking, clamped to 0 through 1. */
		volume?: number;
		/** Eyes follow a fine pointer and the body squishes when pressed. */
		interactive?: boolean;
		/** Accessible description. Defaults to a sentence describing the state. */
		label?: string;
		class?: string;
		ref?: HTMLDivElement | null;
	};

	let {
		state: presenceState = 'idle',
		tone = 'water',
		size = 96,
		volume = 0,
		interactive = true,
		label,
		class: className,
		ref = $bindable(null),
		...rest
	}: Props = $props();

	const diameter = $derived(Math.min(480, Math.max(24, Number.isFinite(size) ? size : 96)));
	const level = $derived(Math.min(1, Math.max(0, Number.isFinite(volume) ? volume : 0)));
	const voiced = $derived(presenceState === 'listening' || presenceState === 'speaking');

	let blinking = $state(false);
	let gaze = $state({ x: 0, y: 0 });
	let pressed = $state(false);

	function media(query: string) {
		return typeof window.matchMedia === 'function' && window.matchMedia(query).matches;
	}

	// Blink at natural, irregular intervals, occasionally twice in a row.
	$effect(() => {
		if (presenceState === 'sleeping' || media('(prefers-reduced-motion: reduce)')) return;
		let timer: ReturnType<typeof setTimeout>;
		const schedule = (delay: number) => {
			timer = setTimeout(() => {
				if (document.visibilityState === 'hidden') return schedule(1000);
				blinking = true;
				timer = setTimeout(() => {
					blinking = false;
					schedule(Math.random() < 0.2 ? 180 : 2400 + Math.random() * 3600);
				}, 130);
			}, delay);
		};
		schedule(1600 + Math.random() * 2000);
		return () => {
			clearTimeout(timer);
			blinking = false;
		};
	});

	// Look toward a fine pointer anywhere on the page, then drift back to center.
	$effect(() => {
		const node = ref;
		if (
			!node ||
			!interactive ||
			media('(prefers-reduced-motion: reduce)') ||
			!media('(hover: hover) and (pointer: fine)')
		)
			return;
		let frame = 0;
		let idle: ReturnType<typeof setTimeout>;
		const look = (event: PointerEvent) => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => {
				const rect = node.getBoundingClientRect();
				const dx = event.clientX - (rect.left + rect.width / 2);
				const dy = event.clientY - (rect.top + rect.height / 2);
				const distance = Math.hypot(dx, dy) || 1;
				const reach = Math.min(1, distance / 400);
				gaze = { x: (dx / distance) * reach, y: (dy / distance) * reach };
			});
			clearTimeout(idle);
			idle = setTimeout(() => (gaze = { x: 0, y: 0 }), 2400);
		};
		window.addEventListener('pointermove', look, { passive: true });
		return () => {
			window.removeEventListener('pointermove', look);
			cancelAnimationFrame(frame);
			clearTimeout(idle);
			gaze = { x: 0, y: 0 };
		};
	});
</script>

<div
	bind:this={ref}
	role="img"
	aria-label={label ?? defaultLabels[presenceState]}
	data-state={presenceState}
	data-tone={tone}
	data-blinking={blinking || undefined}
	data-pressed={pressed || undefined}
	class={cn('mizu-presence relative inline-grid shrink-0 select-none', className)}
	style:--presence-size="{diameter}px"
	style:--presence-level={voiced ? level : 0}
	style:--gaze-x={gaze.x}
	style:--gaze-y={gaze.y}
	onpointerdown={interactive ? () => (pressed = true) : undefined}
	onpointerup={interactive ? () => (pressed = false) : undefined}
	onpointerleave={interactive ? () => (pressed = false) : undefined}
	{...rest}
>
	<span class="presence-glow" aria-hidden="true"></span>
	<span class="presence-body" aria-hidden="true">
		<span class="presence-sheen"></span>
		<svg class="presence-face" viewBox="0 0 100 100">
			<g class="presence-eyes">
				{#each [36, 64] as cx (cx)}
					<g class="presence-eye" style:transform-origin="{cx}px 46px">
						<rect class="presence-pupil" x={cx - 6} y="34" width="12" height="24" rx="6" />
						<path
							class="presence-smile"
							d="M{cx - 7.5} 50a7.5 6.5 0 0 1 15 0"
							fill="none"
							stroke-width="4.5"
							stroke-linecap="round"
						/>
					</g>
				{/each}
			</g>
		</svg>
	</span>
</div>

<style>
	.mizu-presence {
		--presence-highlight: #e2e7ff;
		--presence-mid: #8f9dfb;
		--presence-deep: #5b61f5;
		--presence-glow: rgb(98 106 251 / 0.42);
		--presence-eye: #ffffff;
		width: var(--presence-size);
		height: var(--presence-size);
		place-items: center;
		touch-action: manipulation;
	}
	.mizu-presence[data-tone='iris'] {
		--presence-highlight: #ffe4f6;
		--presence-mid: #c49bff;
		--presence-deep: #7b57f5;
		--presence-glow: rgb(160 110 250 / 0.42);
	}
	.mizu-presence[data-tone='ember'] {
		--presence-highlight: #ffecd2;
		--presence-mid: #ff9d7e;
		--presence-deep: #ee4f6b;
		--presence-glow: rgb(245 110 105 / 0.4);
	}
	.mizu-presence[data-tone='mint'] {
		--presence-highlight: #e3fff3;
		--presence-mid: #72dfbd;
		--presence-deep: #129c83;
		--presence-glow: rgb(40 190 150 / 0.38);
	}
	.mizu-presence[data-tone='mono'] {
		--presence-highlight: color-mix(in oklab, var(--foreground) 18%, var(--background));
		--presence-mid: color-mix(in oklab, var(--foreground) 55%, var(--background));
		--presence-deep: var(--foreground);
		--presence-glow: color-mix(in oklab, var(--foreground) 22%, transparent);
		--presence-eye: var(--background);
	}

	.presence-glow,
	.presence-body {
		grid-area: 1 / 1;
		width: 100%;
		height: 100%;
	}

	/* A soft colored shadow that swells with the voice level. */
	.presence-glow {
		border-radius: 50%;
		background: var(--presence-glow);
		filter: blur(calc(var(--presence-size) * 0.16));
		translate: 0 calc(var(--presence-size) * 0.1);
		scale: calc(0.72 + var(--presence-level) * 0.18);
		opacity: 0.75;
		transition:
			scale var(--duration-base) var(--ease-out),
			opacity var(--duration-slow) var(--ease-out);
	}

	/* The body: a squircle with a pearly radial gradient that slowly shifts shape. */
	.presence-body {
		position: relative;
		overflow: hidden;
		border-radius: 46% 54% 50% 50% / 48% 46% 54% 52%;
		background:
			radial-gradient(120% 100% at 28% 18%, var(--presence-highlight) 0%, transparent 52%),
			radial-gradient(
				140% 120% at 70% 90%,
				var(--presence-deep) 0%,
				var(--presence-mid) 55%,
				var(--presence-highlight) 100%
			);
		box-shadow:
			inset 0 calc(var(--presence-size) * -0.06) calc(var(--presence-size) * 0.12)
				color-mix(in oklab, var(--presence-deep) 55%, transparent),
			inset 0 calc(var(--presence-size) * 0.04) calc(var(--presence-size) * 0.08)
				rgb(255 255 255 / 0.45);
		scale: calc(1 + var(--presence-level) * 0.05) calc(1 - var(--presence-level) * 0.035);
		transition: scale var(--duration-spring) var(--ease-spring-bouncy);
		animation:
			presence-morph 7s var(--ease-in-out) infinite,
			presence-breathe 4.8s var(--ease-in-out) infinite;
	}
	.mizu-presence[data-pressed] .presence-body {
		scale: 1.08 0.9;
		transition-duration: var(--duration-fast);
		transition-timing-function: var(--ease-out);
	}

	/* A moving specular highlight, like light on water. */
	.presence-sheen {
		position: absolute;
		inset: 8% 14% auto auto;
		width: 34%;
		height: 22%;
		border-radius: 50%;
		background: radial-gradient(closest-side, rgb(255 255 255 / 0.7), transparent);
		filter: blur(calc(var(--presence-size) * 0.02));
		rotate: -24deg;
		animation: presence-sheen 7s var(--ease-in-out) infinite;
	}

	.presence-face {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		overflow: visible;
	}
	.presence-eyes {
		translate: calc(var(--gaze-x) * 6px) calc(var(--gaze-y) * 5px);
		transition: translate var(--duration-spring) var(--ease-spring);
	}
	.presence-eye {
		transition: scale var(--duration-fast) var(--ease-out);
	}
	.presence-pupil {
		fill: var(--presence-eye);
		transform-box: fill-box;
		transform-origin: center;
		transition:
			scale var(--duration-base) var(--ease-spring),
			translate var(--duration-base) var(--ease-spring),
			opacity var(--duration-fast) var(--ease-out);
	}
	.presence-smile {
		stroke: var(--presence-eye);
		opacity: 0;
		transform-box: fill-box;
		transform-origin: center;
		scale: 0.6;
		transition:
			opacity var(--duration-fast) var(--ease-out),
			scale var(--duration-base) var(--ease-spring-bouncy);
	}

	.mizu-presence[data-blinking] .presence-pupil {
		scale: 1 0.08;
		transition-duration: var(--duration-instant);
	}

	/* Expressions */
	.mizu-presence[data-state='listening'] .presence-pupil {
		scale: 1.08 1.16;
	}
	.mizu-presence[data-state='listening'] .presence-glow {
		opacity: 1;
	}
	.mizu-presence[data-state='thinking'] .presence-pupil {
		scale: 0.92 0.7;
		translate: 5px -9px;
	}
	.mizu-presence[data-state='thinking'] .presence-body {
		animation:
			presence-morph 3.2s var(--ease-in-out) infinite,
			presence-ponder 2.4s var(--ease-in-out) infinite;
	}
	.mizu-presence[data-state='thinking'] .presence-sheen {
		animation-duration: 2.4s;
	}
	.mizu-presence[data-state='speaking'] .presence-pupil {
		scale: 1 calc(0.82 - var(--presence-level) * 0.25);
	}
	.mizu-presence[data-state='speaking'] .presence-glow {
		opacity: 1;
	}
	.mizu-presence[data-state='happy'] .presence-pupil,
	.mizu-presence[data-state='happy'][data-blinking] .presence-pupil {
		opacity: 0;
		scale: 1 0.3;
	}
	.mizu-presence[data-state='happy'] .presence-smile {
		opacity: 1;
		scale: 1;
	}
	.mizu-presence[data-state='happy'] .presence-body {
		animation:
			presence-morph 7s var(--ease-in-out) infinite,
			presence-hop 1.6s var(--ease-in-out) infinite;
	}
	.mizu-presence[data-state='sleeping'] .presence-pupil {
		scale: 1.1 0.14;
		translate: 0 5px;
	}
	.mizu-presence[data-state='sleeping'] .presence-body {
		animation: presence-breathe 6.4s var(--ease-in-out) infinite;
		filter: saturate(0.7);
	}
	.mizu-presence[data-state='sleeping'] .presence-glow {
		opacity: 0.35;
	}

	@keyframes presence-morph {
		0%,
		100% {
			border-radius: 46% 54% 50% 50% / 48% 46% 54% 52%;
		}
		33% {
			border-radius: 54% 46% 48% 52% / 44% 52% 48% 56%;
		}
		66% {
			border-radius: 50% 50% 56% 44% / 52% 48% 52% 48%;
		}
	}
	@keyframes presence-breathe {
		50% {
			translate: 0 calc(var(--presence-size) * -0.015);
		}
	}
	@keyframes presence-ponder {
		50% {
			rotate: -4deg;
			translate: 0 calc(var(--presence-size) * -0.02);
		}
	}
	@keyframes presence-hop {
		0%,
		100% {
			translate: 0 0;
		}
		40% {
			translate: 0 calc(var(--presence-size) * -0.05);
		}
	}
	@keyframes presence-sheen {
		50% {
			translate: calc(var(--presence-size) * -0.05) calc(var(--presence-size) * 0.02);
			opacity: 0.7;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.presence-body,
		.presence-sheen,
		.mizu-presence[data-state] .presence-body {
			animation: none;
		}
	}
</style>
