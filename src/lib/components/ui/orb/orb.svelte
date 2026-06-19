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
	<!-- rotating layer holding the offset blobs -->
	<div class="absolute inset-0" class:mizu-orb-spin={spin}>
		<!-- base bloom -->
		<div
			class="absolute inset-[8%] rounded-full bg-mizu-400 opacity-80 blur-2xl mix-blend-normal dark:mix-blend-screen"
		></div>
		<!-- pulsing cyan blob A (offset up-left) -->
		<div
			class="mizu-orb-pulse-a absolute top-[6%] left-[10%] h-[60%] w-[60%] rounded-full bg-mizu-300 blur-3xl mix-blend-normal dark:mix-blend-screen"
		></div>
		<!-- pulsing cyan blob B (offset down-right) -->
		<div
			class="mizu-orb-pulse-b absolute right-[8%] bottom-[8%] h-[55%] w-[55%] rounded-full bg-mizu-500 blur-3xl mix-blend-normal dark:mix-blend-screen"
		></div>
	</div>
	<!-- crisp rim, not rotated so the highlight stays steady -->
	<div
		class="absolute inset-[10%] rounded-full border border-white/30"
		style="box-shadow: 0 0 60px rgba(1,178,255,0.7);"
	></div>
	<!-- top wet highlight -->
	<div
		class="absolute top-[14%] left-1/2 h-[26%] w-[40%] -translate-x-1/2 rounded-[50%] bg-white/40 blur-2xl"
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
</style>
