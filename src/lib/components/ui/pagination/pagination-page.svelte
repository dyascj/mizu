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
		'text-foreground hover:bg-secondary focus-visible:ring-ring focus-visible:ring-offset-background relative inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-transparent text-sm font-semibold transition-[background-color,scale,box-shadow] duration-200 outline-none select-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.96]',
		'data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selected]:hover:bg-primary-hover data-[selected]:shadow-sm',
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
