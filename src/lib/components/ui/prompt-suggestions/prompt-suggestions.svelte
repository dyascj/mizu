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
	{#each items as item, i (i)}
		<button
			type="button"
			onclick={() => onSelect?.(item)}
			class="bg-card text-foreground hover:bg-secondary focus-visible:ring-ring max-w-full rounded-2xl px-3.5 py-2 text-left text-sm [overflow-wrap:anywhere] shadow-xs transition-[background-color,scale] outline-none focus-visible:ring-2 active:scale-[0.98]"
		>
			{item}
		</button>
	{/each}
</div>
