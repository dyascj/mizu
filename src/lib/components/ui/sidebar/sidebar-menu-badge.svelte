<script lang="ts">
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLElement>> = $props();
</script>

<!-- Steps aside with the labels on collapse, so it never lands on the icon
     while the rail widens again. -->
<div
	bind:this={ref}
	data-slot="sidebar-menu-badge"
	data-sidebar="menu-badge"
	class={cn(
		'text-sidebar-foreground pointer-events-none absolute end-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums select-none',
		'peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground',
		'peer-data-[size=sm]/menu-button:top-1',
		'peer-data-[size=default]/menu-button:top-1.5',
		'peer-data-[size=lg]/menu-button:top-2.5',
		'transition-[opacity,filter] delay-(--duration-instant) duration-(--duration-base) ease-out motion-reduce:blur-none',
		'group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:blur-[4px] group-data-[collapsible=icon]:delay-0 group-data-[collapsible=icon]:duration-(--duration-instant) group-data-[collapsible=icon]:ease-in',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</div>
