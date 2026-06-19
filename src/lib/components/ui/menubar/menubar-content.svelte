<script lang="ts">
	import { Menubar as MenubarPrimitive, type WithoutChild } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		sideOffset = 8,
		align = 'start',
		portalProps,
		...restProps
	}: WithoutChild<MenubarPrimitive.ContentProps> & {
		portalProps?: MenubarPrimitive.PortalProps;
	} = $props();
</script>

<MenubarPrimitive.Portal {...portalProps}>
	<MenubarPrimitive.Content
		bind:ref
		{sideOffset}
		{align}
		class={cn(
			'z-50 min-w-[12rem] overflow-hidden rounded-xl glass-strong border border-[color:var(--glass-border)] p-1 text-popover-foreground shadow-glass transition-[opacity,transform] duration-150 data-[state=closed]:scale-95 data-[state=closed]:opacity-0 data-[state=open]:scale-100 data-[state=open]:opacity-100',
			className
		)}
		{...restProps}
	/>
</MenubarPrimitive.Portal>
