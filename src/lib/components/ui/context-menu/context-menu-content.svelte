<script lang="ts">
	import { ContextMenu as ContextMenuPrimitive, type WithoutChild } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		portalProps,
		...restProps
	}: WithoutChild<ContextMenuPrimitive.ContentProps> & {
		portalProps?: ContextMenuPrimitive.PortalProps;
	} = $props();
</script>

<ContextMenuPrimitive.Portal {...portalProps}>
	<ContextMenuPrimitive.Content
		bind:ref
		class={cn(
			'z-50 max-h-[var(--bits-context-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-xl bg-popover dark:border dark:border-border p-1 text-popover-foreground shadow-lg transition-[opacity,transform] duration-150 data-[state=closed]:scale-95 data-[state=closed]:opacity-0 data-[state=open]:scale-100 data-[state=open]:opacity-100',
			className
		)}
		{...restProps}
	/>
</ContextMenuPrimitive.Portal>
