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
			'bg-popover text-popover-foreground z-50 max-h-[var(--bits-dropdown-menu-content-available-height)] max-w-[calc(100vw-2rem)] min-w-[8rem] overflow-x-hidden overflow-y-auto rounded-xl p-1 shadow-lg transition-[opacity,transform] duration-200 data-[state=closed]:scale-95 data-[state=closed]:opacity-0 data-[state=open]:scale-100 data-[state=open]:opacity-100',
			className
		)}
		{...restProps}
	/>
</DropdownMenuPrimitive.Portal>
