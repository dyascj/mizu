<script lang="ts">
	import { Pagination as PaginationPrimitive, type WithoutChild } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		page,
		children,
		...restProps
	}: WithoutChild<PaginationPrimitive.PageProps> & { class?: string } = $props();
</script>

<PaginationPrimitive.Page
	bind:ref
	{page}
	class={cn(
		'relative inline-flex size-9 shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-transparent text-sm font-semibold text-foreground outline-none transition-[background-color,scale,box-shadow] duration-150 hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.96]',
		'data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selected]:shadow-sm data-[selected]:hover:bg-primary-hover',
		className
	)}
	{...restProps}
>
	{#if children}
		<span class="relative z-10">{@render children()}</span>
	{:else}
		<span class="relative z-10">{page.value}</span>
	{/if}
</PaginationPrimitive.Page>
