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
		class="text-muted-foreground hover:text-foreground focus-visible:ring-ring flex w-fit items-center gap-1.5 rounded-full py-1 transition-colors outline-none focus-visible:ring-2 disabled:pointer-events-none"
	>
		<Sparkles class="size-3.5" />
		{#if streaming}
			<span class="text-shimmer animate-shimmer">{label}</span>
		{:else}
			<span>{summary}</span>
			<ChevronDown
				class={cn('size-3.5 transition-transform duration-(--duration-base)', open && 'rotate-180')}
			/>
		{/if}
	</button>
	{#if open && !streaming}
		<div
			class="reasoning-body bg-secondary/60 text-muted-foreground mt-1.5 rounded-xl px-4 py-3 leading-relaxed"
		>
			{@render children?.()}
		</div>
	{/if}
</div>

<style>
	.reasoning-body {
		animation: reasoning-open var(--duration-base) var(--ease-out) both;
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
		.reasoning-body {
			animation: none;
		}
	}
</style>
