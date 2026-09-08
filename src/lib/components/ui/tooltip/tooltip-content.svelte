<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Tooltip as TooltipPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		sideOffset = 6,
		portalProps,
		children,
		...restProps
	}: WithoutChildrenOrChild<TooltipPrimitive.ContentProps> & {
		class?: string;
		portalProps?: TooltipPrimitive.PortalProps;
		children: Snippet;
	} = $props();
</script>

<TooltipPrimitive.Portal {...portalProps}>
	<TooltipPrimitive.Content
		bind:ref
		{sideOffset}
		class={cn(
			'bg-popover text-popover-foreground z-50 max-w-[calc(100vw-2rem)] rounded-xl px-3 py-1.5 text-xs font-medium [overflow-wrap:anywhere] shadow-lg transition-[opacity,transform] duration-200 outline-none data-[state=closed]:scale-95 data-[state=closed]:opacity-0 data-[state=delayed-open]:scale-100 data-[state=delayed-open]:opacity-100 data-[state=instant-open]:scale-100 data-[state=instant-open]:opacity-100',
			className
		)}
		{...restProps}
	>
		{@render children?.()}
	</TooltipPrimitive.Content>
</TooltipPrimitive.Portal>
