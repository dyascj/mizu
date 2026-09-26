<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		label?: string;
		/** shimmer sweeps light across the label; dots is the classic typing hint. */
		variant?: 'shimmer' | 'dots';
		class?: string;
		ref?: HTMLDivElement | null;
	};

	let {
		label = 'Thinking...',
		variant = 'shimmer',
		class: className,
		ref = $bindable(null),
		...rest
	}: Props = $props();
</script>

<div
	bind:this={ref}
	role="status"
	aria-label={label}
	class={cn('flex w-fit items-center gap-2 text-sm', className)}
	{...rest}
>
	{#if variant === 'dots'}
		<span class="flex items-center gap-1" aria-hidden="true">
			<span class="thinking-dot bg-muted-foreground size-1.5 rounded-full"></span>
			<span
				class="thinking-dot bg-muted-foreground size-1.5 rounded-full"
				style="animation-delay: 150ms;"
			></span>
			<span
				class="thinking-dot bg-muted-foreground size-1.5 rounded-full"
				style="animation-delay: 300ms;"
			></span>
		</span>
		<span class="text-muted-foreground">{label}</span>
	{:else}
		<span class="text-shimmer animate-shimmer" aria-hidden="true">{label}</span>
	{/if}
</div>

<style>
	.thinking-dot {
		animation: thinking-bounce 1.2s ease-in-out infinite;
	}

	@keyframes thinking-bounce {
		0%,
		60%,
		100% {
			transform: translateY(0);
			opacity: 0.5;
		}
		30% {
			transform: translateY(-3px);
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.thinking-dot {
			animation: none;
		}
	}
</style>
