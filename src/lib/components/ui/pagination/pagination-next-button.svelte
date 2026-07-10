<script lang="ts">
	import { Pagination as PaginationPrimitive, type WithoutChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { ChevronRight } from '@lucide/svelte';
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
		'relative inline-flex h-9 shrink-0 select-none items-center justify-center gap-1 overflow-hidden rounded-full bg-transparent px-3 text-sm font-semibold text-foreground outline-none transition-[background-color,scale] duration-150 hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50',
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
