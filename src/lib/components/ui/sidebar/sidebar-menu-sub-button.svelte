<script lang="ts">
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		children,
		child,
		class: className,
		size = 'md',
		isActive = false,
		...restProps
	}: WithElementRef<HTMLAnchorAttributes, HTMLAnchorElement | HTMLButtonElement> & {
		child?: Snippet<[{ props: Record<string, unknown> }]>;
		size?: 'sm' | 'md';
		isActive?: boolean;
	} = $props();

	const mergedProps = $derived({
		class: cn(
			'ring-sidebar-ring relative flex min-w-0 items-center gap-2 rounded-lg px-2 outline-hidden focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0',
			'text-muted-foreground hover:bg-secondary/50 hover:text-foreground',
			'data-[active=true]:bg-secondary data-[active=true]:text-foreground data-[active=true]:font-medium',
			// The tick sits on the list's guide line, beside the active item.
			"before:bg-foreground before:absolute before:top-1/2 before:-start-[7px] before:h-4 before:w-px before:-translate-y-1/2 before:opacity-0 before:content-[''] data-[active=true]:before:opacity-100",
			size === 'sm' && 'h-7 text-xs',
			size === 'md' && 'h-[1.875rem] text-[0.8125rem]',
			'group-data-[collapsible=icon]:hidden',
			className
		),
		'data-slot': 'sidebar-menu-sub-button',
		'data-sidebar': 'menu-sub-button',
		'data-size': size,
		'data-active': isActive,
		...restProps
	});
</script>

{#if child}
	{@render child({ props: mergedProps })}
{:else if mergedProps.href}
	<a bind:this={ref} {...mergedProps}>
		{@render children?.()}
	</a>
{:else}
	<!-- Without a destination it is an action, so it stays reachable by keyboard. -->
	<button
		bind:this={ref as HTMLButtonElement | null}
		type="button"
		{...mergedProps as HTMLButtonAttributes}
	>
		{@render children?.()}
	</button>
{/if}
