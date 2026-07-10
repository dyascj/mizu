<script lang="ts">
	import { cn } from '$lib/utils.js';

	let { class: className }: { class?: string } = $props();
</script>

<!-- The Mizu glow-orb brand mark: a soft pastel aura in a circle. Decorative;
     pair it with a visible wordmark for the accessible name. -->
<span class={cn('orb relative block size-8 shrink-0 select-none', className)} aria-hidden="true">
	<span class="orb-halo"></span>
	<span class="orb-body">
		<span class="orb-aura"></span>
	</span>
</span>

<style>
	.orb-body {
		position: absolute;
		inset: 0;
		border-radius: 9999px;
		overflow: hidden;
		background: #ffffff;
	}

	/* Oversized so the blur never reveals the layer's edge inside the circle. */
	.orb-aura {
		position: absolute;
		inset: -30%;
		border-radius: 9999px;
		background:
			radial-gradient(60% 60% at 30% 25%, #ffd9e8 0%, transparent 62%),
			radial-gradient(55% 55% at 76% 28%, #e6d9ff 0%, transparent 64%),
			radial-gradient(65% 65% at 68% 80%, #cfe9ff 0%, transparent 66%),
			radial-gradient(45% 45% at 26% 74%, #ffedd6 0%, transparent 62%);
		filter: blur(calc(var(--orb-blur-scale, 1) * 4px)) saturate(1.15);
		animation: orb-turn 24s linear infinite;
		will-change: transform;
	}

	/* Faint halo so the orb reads as lit, on white and on black. */
	.orb-halo {
		position: absolute;
		inset: -18%;
		border-radius: 9999px;
		background: radial-gradient(
			circle,
			rgba(230, 217, 255, 0.55) 0%,
			rgba(255, 217, 232, 0.3) 45%,
			transparent 70%
		);
		filter: blur(6px);
	}

	@keyframes orb-turn {
		to {
			transform: rotate(360deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.orb-aura {
			animation: none;
		}
	}
</style>
