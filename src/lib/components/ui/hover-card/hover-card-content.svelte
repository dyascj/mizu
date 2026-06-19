<script lang="ts">
	import type { Snippet } from 'svelte';
	import { LinkPreview as HoverCardPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		side = 'bottom',
		sideOffset = 8,
		align = 'center',
		portalProps,
		children,
		...restProps
	}: WithoutChildrenOrChild<HoverCardPrimitive.ContentProps> & {
		class?: string;
		portalProps?: HoverCardPrimitive.PortalProps;
		children: Snippet;
	} = $props();
</script>

<HoverCardPrimitive.Portal {...portalProps}>
	<HoverCardPrimitive.Content
		bind:ref
		{side}
		{sideOffset}
		{align}
		class={cn(
			'glass-strong z-50 w-64 rounded-xl border border-[color:var(--glass-border)] p-4 text-popover-foreground shadow-glass outline-none transition-[opacity,transform] duration-150 data-[state=closed]:scale-95 data-[state=closed]:opacity-0 data-[state=open]:scale-100 data-[state=open]:opacity-100',
			className
		)}
		{...restProps}
	>
		{@render children?.()}
	</HoverCardPrimitive.Content>
</HoverCardPrimitive.Portal>
