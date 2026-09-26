<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive, type WithoutChild } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		sideOffset = 6,
		portalProps,
		...restProps
	}: WithoutChild<DropdownMenuPrimitive.ContentProps> & {
		portalProps?: DropdownMenuPrimitive.PortalProps;
	} = $props();
</script>

<DropdownMenuPrimitive.Portal {...portalProps}>
	<DropdownMenuPrimitive.Content
		bind:ref
		{sideOffset}
		class={cn(
			'bg-popover text-popover-foreground z-50 max-h-(--bits-menu-content-available-height) max-w-[calc(100vw-2rem)] min-w-[8rem] origin-(--bits-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-xl p-1 shadow-lg transition-[opacity,scale] duration-(--duration-fast) ease-out outline-none data-[starting-style]:opacity-0 data-[state=closed]:pointer-events-none data-[state=closed]:opacity-0 data-[state=closed]:duration-(--duration-instant) data-[state=closed]:ease-in motion-safe:data-[starting-style]:scale-95 motion-safe:data-[state=closed]:scale-[0.97]',
			className
		)}
		{...restProps}
	/>
</DropdownMenuPrimitive.Portal>
