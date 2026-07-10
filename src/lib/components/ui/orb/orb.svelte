<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		size?: number;
		spin?: boolean;
		active?: boolean;
		class?: string;
		ref?: HTMLDivElement | null;
	};

	let {
		size = 280,
		spin = true,
		active = true,
		class: className,
		ref = $bindable(null),
		...rest
	}: Props = $props();
</script>

<div
	bind:this={ref}
	aria-hidden="true"
	class={cn(
		'pointer-events-none relative transition-transform duration-700 ease-out',
		active ? 'scale-100' : 'scale-90 opacity-70',
		className
	)}
	style="width: {size}px; height: {size}px;"
	{...rest}
>
	<!-- rotating layer holding the offset pastel blobs -->
	<div class="absolute inset-0" class:mizu-orb-spin={spin}>
		<!-- pink (up-left) -->
		<div
			class="mizu-orb-pulse-a absolute top-[4%] left-[6%] h-[62%] w-[62%] rounded-full bg-[#ffc4dd] blur-3xl mix-blend-normal dark:mix-blend-screen"
		></div>
		<!-- lavender (right) -->
		<div
			class="absolute top-[16%] right-[4%] h-[58%] w-[58%] rounded-full bg-[#dcc8ff] opacity-90 blur-3xl mix-blend-normal dark:mix-blend-screen"
		></div>
		<!-- blue (down) -->
		<div
			class="mizu-orb-pulse-b absolute bottom-[4%] left-[22%] h-[58%] w-[58%] rounded-full bg-[#bcdfff] blur-3xl mix-blend-normal dark:mix-blend-screen"
		></div>
		<!-- peach (down-left) -->
		<div
			class="absolute bottom-[14%] left-[4%] h-[44%] w-[44%] rounded-full bg-[#ffe4c2] opacity-80 blur-3xl mix-blend-normal dark:mix-blend-screen"
		></div>
	</div>
	<!-- steady halo, not rotated so the glow stays even -->
	<div
		class="absolute inset-[10%] rounded-full"
		style="box-shadow: 0 0 60px rgba(230, 217, 255, 0.8);"
	></div>
</div>

<style>
	@keyframes spin-slow {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	@keyframes orb-pulse-a {
		0%,
		100% {
			transform: translate(0, 0) scale(1);
			opacity: 0.55;
		}
		50% {
			transform: translate(6%, 4%) scale(1.12);
			opacity: 0.85;
		}
	}

	@keyframes orb-pulse-b {
		0%,
		100% {
			transform: translate(0, 0) scale(1.08);
			opacity: 0.7;
		}
		50% {
			transform: translate(-5%, -6%) scale(0.95);
			opacity: 0.4;
		}
	}

	.mizu-orb-spin {
		animation: spin-slow 22s linear infinite;
	}

	.mizu-orb-pulse-a {
		animation: orb-pulse-a 7s ease-in-out infinite;
	}

	.mizu-orb-pulse-b {
		animation: orb-pulse-b 9s ease-in-out infinite;
	}

	/* Self-contained: a static (but still glowing) orb when motion is reduced,
	   even if this component is copied in without Mizu's global app.css reset. */
	@media (prefers-reduced-motion: reduce) {
		.mizu-orb-spin,
		.mizu-orb-pulse-a,
		.mizu-orb-pulse-b {
			animation: none;
		}
	}
</style>
