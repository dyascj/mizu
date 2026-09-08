<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Source = { label: string; url?: string };

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** Citations backing the answer, in order. */
		items: Source[];
		class?: string;
		ref?: HTMLDivElement | null;
	};

	let { items, class: className, ref = $bindable(null), ...rest }: Props = $props();

	function safeHref(url?: string) {
		if (!url) return undefined;
		try {
			const parsed = new URL(url, 'https://mizu.invalid');
			return ['https:', 'http:'].includes(parsed.protocol) ? url : undefined;
		} catch {
			return undefined;
		}
	}
</script>

<div bind:this={ref} class={cn('flex flex-wrap items-center gap-1.5', className)} {...rest}>
	{#each items as source, i (i)}
		{@const href = safeHref(source.url)}
		<svelte:element
			this={href ? 'a' : 'span'}
			{href}
			target={href ? '_blank' : undefined}
			rel={href ? 'noreferrer' : undefined}
			class="bg-secondary text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring inline-flex max-w-full items-center gap-1.5 rounded-full py-1 pr-2.5 pl-1 text-xs transition-colors outline-none focus-visible:ring-2"
		>
			<span
				class="bg-card text-foreground grid size-5 shrink-0 place-items-center rounded-full text-xs font-medium tabular-nums shadow-xs"
			>
				{i + 1}
			</span>
			<span class="min-w-0 [overflow-wrap:anywhere]">{source.label}</span>
		</svelte:element>
	{/each}
</div>
