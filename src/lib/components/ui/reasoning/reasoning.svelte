<script lang="ts">
	import type { Snippet } from 'svelte';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import { cn } from '$lib/utils.js';

	type Props = {
		/** Still thinking: the header shimmers and the body stays closed. */
		streaming?: boolean;
		/** Label while streaming. */
		label?: string;
		/** Summary once done, e.g. "Thought for 6 seconds". */
		summary?: string;
		open?: boolean;
		class?: string;
		children?: Snippet;
	};

	let {
		streaming = false,
		label = 'Thinking...',
		summary = 'Thought about it',
		open = $bindable(false),
		class: className,
		children
	}: Props = $props();
</script>

<div class={cn('flex w-fit max-w-full flex-col text-sm', className)}>
	<button
		type="button"
		disabled={streaming}
		onclick={() => (open = !open)}
		aria-expanded={open}
		class="flex w-fit items-center gap-1.5 rounded-full py-1 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none"
	>
		<Sparkles class="size-3.5" />
		{#if streaming}
			<span class="reasoning-shimmer">{label}</span>
		{:else}
			<span>{summary}</span>
			<ChevronDown class={cn('size-3.5 transition-transform duration-200', open && 'rotate-180')} />
		{/if}
	</button>
	{#if open && !streaming}
		<div class="reasoning-body mt-1.5 rounded-xl bg-secondary/60 px-4 py-3 leading-relaxed text-muted-foreground">
			{@render children?.()}
		</div>
	{/if}
</div>

<style>
	.reasoning-shimmer {
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
		animation: reasoning-sweep 2s linear infinite;
	}

	.reasoning-body {
		animation: reasoning-open 200ms ease-out both;
	}

	@keyframes reasoning-sweep {
		from {
			background-position: 200% 0;
		}
		to {
			background-position: -200% 0;
		}
	}

	@keyframes reasoning-open {
		from {
			opacity: 0;
			transform: translateY(-3px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.reasoning-shimmer,
		.reasoning-body {
			animation: none;
		}
	}
</style>
