<script lang="ts">
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLUListElement>> = $props();
</script>

<!-- A guide line under the parent's icon; the active item marks its spot on it. -->
<ul
	bind:this={ref}
	data-slot="sidebar-menu-sub"
	data-sidebar="menu-sub"
	class={cn(
		'border-border ms-4 flex min-w-0 flex-col border-s py-0.5 ps-1.5',
		'group-data-[collapsible=icon]:hidden',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</ul>
