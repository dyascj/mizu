<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Popover as PopoverPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		sideOffset = 8,
		portalProps,
		children,
		...restProps
	}: WithoutChildrenOrChild<PopoverPrimitive.ContentProps> & {
		class?: string;
		portalProps?: PopoverPrimitive.PortalProps;
		children: Snippet;
	} = $props();
</script>

<PopoverPrimitive.Portal {...portalProps}>
	<PopoverPrimitive.Content
		bind:ref
		{sideOffset}
		class={cn(
			'bg-popover z-50 w-72 rounded-xl dark:border dark:border-border p-4 text-popover-foreground shadow-lg outline-none transition-[opacity,transform] duration-150 data-[state=closed]:scale-95 data-[state=closed]:opacity-0 data-[state=open]:scale-100 data-[state=open]:opacity-100',
			className
		)}
		{...restProps}
	>
		{@render children?.()}
	</PopoverPrimitive.Content>
</PopoverPrimitive.Portal>
