<script lang="ts">
	import type { Snippet } from 'svelte';
	import Check from '@lucide/svelte/icons/check';
	import X from '@lucide/svelte/icons/x';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import { Spinner } from '$lib/components/ui/spinner';
	import { cn } from '$lib/utils.js';

	type Props = {
		/** What the assistant is doing, e.g. "Searching the web". */
		name: string;
		state?: 'running' | 'done' | 'error';
		/** Optional detail line, e.g. the query or file name. */
		detail?: string;
		open?: boolean;
		class?: string;
		/** Expandable result content. */
		children?: Snippet;
	};

	let {
		name,
		state = 'running',
		detail,
		open = $bindable(false),
		class: className,
		children
	}: Props = $props();
</script>

<div class={cn('w-full max-w-full text-sm', className)}>
	<button
		type="button"
		disabled={!children || state === 'running'}
		onclick={() => (open = !open)}
		aria-expanded={open}
		class="bg-secondary/60 enabled:hover:bg-secondary focus-visible:ring-ring flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left transition-colors outline-none focus-visible:ring-2 disabled:cursor-default"
	>
		{#if state === 'running'}
			<Spinner size={16} />
		{:else if state === 'done'}
			<span
				class="bg-success text-success-foreground grid size-4 shrink-0 place-items-center rounded-full"
			>
				<Check class="size-3" strokeWidth={3} />
			</span>
		{:else}
			<span
				class="bg-destructive text-destructive-foreground grid size-4 shrink-0 place-items-center rounded-full"
			>
				<X class="size-3" strokeWidth={3} />
			</span>
		{/if}
		<span class="min-w-0 flex-1">
			<span class={cn('block truncate font-medium', state === 'running' && 'tool-shimmer')}
				>{name}</span
			>
			{#if detail}
				<span class="text-muted-foreground block truncate text-xs">{detail}</span>
			{/if}
		</span>
		{#if children && state !== 'running'}
			<ChevronDown
				class={cn(
					'text-muted-foreground size-3.5 shrink-0 transition-transform duration-200',
					open && 'rotate-180'
				)}
			/>
		{/if}
	</button>
	{#if open && children && state !== 'running'}
		<div
			class="tool-result bg-secondary/40 text-muted-foreground mt-1.5 rounded-xl px-4 py-3 leading-relaxed"
		>
			{@render children()}
		</div>
	{/if}
</div>

<style>
	.tool-shimmer {
		background: linear-gradient(
			90deg,
			var(--foreground) 0%,
			var(--foreground) 35%,
			var(--muted-foreground) 50%,
			var(--foreground) 65%,
			var(--foreground) 100%
		);
		background-size: 200% 100%;
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		animation: tool-sweep 2s linear infinite;
	}

	.tool-result {
		animation: tool-open 200ms ease-out both;
	}

	@keyframes tool-sweep {
		from {
			background-position: 200% 0;
		}
		to {
			background-position: -200% 0;
		}
	}

	@keyframes tool-open {
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
		.tool-shimmer,
		.tool-result {
			animation: none;
		}
	}
</style>
