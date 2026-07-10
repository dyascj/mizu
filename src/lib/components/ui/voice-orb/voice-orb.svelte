<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** What the assistant is doing; drives the animation. */
		state?: 'idle' | 'listening' | 'thinking' | 'speaking';
		size?: number;
		class?: string;
		ref?: HTMLDivElement | null;
	};

	let {
		state = 'idle',
		size = 96,
		class: className,
		ref = $bindable(null),
		...rest
	}: Props = $props();
</script>

<div
	bind:this={ref}
	role="status"
	aria-label={state}
	class={cn('voice-orb relative select-none', `is-${state}`, className)}
	style="width: {size}px; height: {size}px;"
	{...rest}
>
	<span class="orb-halo"></span>
	<span class="orb-body">
		<span class="orb-aura"></span>
	</span>
</div>

<style>
	.voice-orb {
		pointer-events: none;
	}

	.orb-body {
		position: absolute;
		inset: 0;
		border-radius: 9999px;
		overflow: hidden;
		background: #ffffff;
		transition: transform 0.4s ease;
	}

	.orb-aura {
		position: absolute;
		inset: -30%;
		border-radius: 9999px;
		background:
			radial-gradient(60% 60% at 30% 25%, #ffc4dd 0%, transparent 62%),
			radial-gradient(55% 55% at 76% 28%, #dcc8ff 0%, transparent 64%),
			radial-gradient(65% 65% at 68% 80%, #bcdfff 0%, transparent 66%),
			radial-gradient(45% 45% at 26% 74%, #ffe4c2 0%, transparent 62%);
		filter: blur(6px) saturate(1.15);
		animation: orb-turn 24s linear infinite;
		will-change: transform;
	}

	.orb-halo {
		position: absolute;
		inset: -16%;
		border-radius: 9999px;
		background: radial-gradient(
			circle,
			rgba(230, 217, 255, 0.55) 0%,
			rgba(255, 217, 232, 0.3) 45%,
			transparent 70%
		);
		filter: blur(8px);
		transition: opacity 0.4s ease;
	}

	/* listening: a slow, attentive breath */
	.is-listening .orb-body {
		animation: orb-breathe 2.4s ease-in-out infinite;
	}
	.is-listening .orb-aura {
		animation-duration: 14s;
	}

	/* thinking: the aura churns faster, the halo dims */
	.is-thinking .orb-aura {
		animation-duration: 6s;
		filter: blur(6px) saturate(1.5);
	}
	.is-thinking .orb-halo {
		opacity: 0.6;
	}

	/* speaking: quick, voice-like pulses */
	.is-speaking .orb-body {
		animation: orb-speak 0.9s ease-in-out infinite;
	}
	.is-speaking .orb-aura {
		animation-duration: 10s;
	}

	@keyframes orb-turn {
		to {
			transform: rotate(360deg);
		}
	}
	@keyframes orb-breathe {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.06);
		}
	}
	@keyframes orb-speak {
		0%,
		100% {
			transform: scale(1);
		}
		30% {
			transform: scale(1.09);
		}
		60% {
			transform: scale(1.03);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.orb-aura,
		.is-listening .orb-body,
		.is-speaking .orb-body {
			animation: none;
		}
	}
</style>
