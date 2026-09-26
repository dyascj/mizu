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
			// Open rests at full opacity and scale by default. Open-state rules here
			// would outrank a starting style passed through `class` and skip its fade.
			// It grows in from its trigger on ease-out and leaves faster on ease-in;
			// reduced motion keeps only the fade.
			'bg-popover text-popover-foreground z-50 w-72 max-w-[calc(100vw-2rem)] origin-(--bits-popover-content-transform-origin) rounded-xl p-4 [overflow-wrap:anywhere] shadow-lg transition-[opacity,scale] duration-(--duration-base) ease-out outline-none data-[starting-style]:opacity-0 data-[state=closed]:opacity-0 data-[state=closed]:duration-(--duration-fast) data-[state=closed]:ease-in motion-safe:data-[starting-style]:scale-95 motion-safe:data-[state=closed]:scale-95',
			className
		)}
		{...restProps}
	>
		{@render children?.()}
	</PopoverPrimitive.Content>
</PopoverPrimitive.Portal>
