<script lang="ts">
	import { Pagination as PaginationPrimitive, type WithoutChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithoutChild<PaginationPrimitive.NextButtonProps> & {
		class?: string;
		children?: Snippet;
	} = $props();
</script>

<PaginationPrimitive.NextButton
	bind:ref
	class={cn(
		'text-foreground hover:bg-secondary focus-visible:ring-ring focus-visible:ring-offset-background relative inline-flex h-9 shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full bg-transparent px-3 text-sm font-semibold transition-[background-color,scale] duration-150 outline-none select-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50',
		className
	)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{:else}
		<span>Next</span>
		<ChevronRight class="size-4" aria-hidden="true" />
	{/if}
</PaginationPrimitive.NextButton>
