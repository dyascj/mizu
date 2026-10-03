<script lang="ts">
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		children,
		child,
		class: className,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLElement>> & {
		child?: Snippet<[{ props: Record<string, unknown> }]>;
	} = $props();

	const mergedProps = $derived({
		class: cn(
			'text-foreground ring-sidebar-ring flex h-8 w-full shrink-0 items-center gap-2.5 rounded-lg px-2 text-start text-sm font-medium outline-hidden [&>svg]:text-muted-foreground [button&]:hover:bg-secondary/70 transition-[margin,opacity,filter] delay-(--duration-instant) duration-(--duration-base) ease-out focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0',
			// Like the item labels, it is gone before the closing edge reaches it.
			'group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:blur-[4px] group-data-[collapsible=icon]:delay-0 group-data-[collapsible=icon]:duration-(--duration-instant) group-data-[collapsible=icon]:ease-in motion-reduce:blur-none',
			className
		),
		'data-slot': 'sidebar-group-label',
		'data-sidebar': 'group-label',
		...restProps
	});
</script>

{#if child}
	{@render child({ props: mergedProps })}
{:else}
	<div bind:this={ref} {...mergedProps}>
		{@render children?.()}
	</div>
{/if}
