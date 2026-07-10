<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** Starter prompts to offer. */
		items: string[];
		onSelect?: (item: string) => void;
		class?: string;
		ref?: HTMLDivElement | null;
	};

	let { items, onSelect, class: className, ref = $bindable(null), ...rest }: Props = $props();
</script>

<div bind:this={ref} class={cn('flex flex-wrap gap-2', className)} {...rest}>
	{#each items as item (item)}
		<button
			type="button"
			onclick={() => onSelect?.(item)}
			class="rounded-full bg-card px-3.5 py-2 text-sm text-foreground shadow-xs outline-none transition-[background-color,scale] hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] dark:border dark:border-border"
		>
			{item}
		</button>
	{/each}
</div>
