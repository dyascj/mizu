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
			<span class="thinking-dot size-1.5 rounded-full bg-muted-foreground"></span>
			<span class="thinking-dot size-1.5 rounded-full bg-muted-foreground" style="animation-delay: 150ms;"
			></span>
			<span class="thinking-dot size-1.5 rounded-full bg-muted-foreground" style="animation-delay: 300ms;"
			></span>
		</span>
		<span class="text-muted-foreground">{label}</span>
	{:else}
		<span class="thinking-shimmer" aria-hidden="true">{label}</span>
	{/if}
</div>

<style>
	.thinking-dot {
		animation: thinking-bounce 1.2s ease-in-out infinite;
	}

	.thinking-shimmer {
		background: linear-gradient(
			90deg,
			var(--muted-foreground) 0%,
			var(--muted-foreground) 35%,
			var(--foreground) 50%,
			var(--muted-foreground) 65%,
			var(--muted-foreground) 100%
		);
		background-size: 200% 100%;
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		animation: thinking-sweep 2s linear infinite;
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

	@keyframes thinking-sweep {
		from {
			background-position: 200% 0;
		}
		to {
			background-position: -200% 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.thinking-dot,
		.thinking-shimmer {
			animation: none;
		}
	}
</style>
