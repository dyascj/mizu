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
</script>

<div bind:this={ref} class={cn('flex flex-wrap items-center gap-1.5', className)} {...rest}>
	{#each items as source, i (source.label)}
		<svelte:element
			this={source.url ? 'a' : 'span'}
			href={source.url}
			target={source.url ? '_blank' : undefined}
			rel={source.url ? 'noreferrer' : undefined}
			class="inline-flex items-center gap-1.5 rounded-full bg-secondary py-1 pr-2.5 pl-1 text-xs text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
		>
			<span
				class="grid size-4 place-items-center rounded-full bg-card text-[0.625rem] font-medium text-foreground shadow-xs tabular-nums"
			>
				{i + 1}
			</span>
			{source.label}
		</svelte:element>
	{/each}
</div>
