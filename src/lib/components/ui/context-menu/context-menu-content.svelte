<script lang="ts">
	import { ContextMenu as ContextMenuPrimitive, type WithoutChild } from 'bits-ui';
	import { cn } from '$lib/utils.js';
	import { pinOriginToPoint } from './origin.js';

	let {
		ref = $bindable(null),
		class: className,
		portalProps,
		...restProps
	}: WithoutChild<ContextMenuPrimitive.ContentProps> & {
		portalProps?: ContextMenuPrimitive.PortalProps;
	} = $props();

	// Opens in a blink from the pointer and leaves on opacity alone, so the
	// exit never holds the eye.
	$effect(() => {
		if (ref) return pinOriginToPoint(ref);
	});
</script>

<ContextMenuPrimitive.Portal {...portalProps}>
	<ContextMenuPrimitive.Content
		bind:ref
		side="bottom"
		align="start"
		collisionPadding={8}
		class={cn(
			'bg-popover text-popover-foreground z-50 max-h-(--bits-context-menu-content-available-height) max-w-[calc(100vw-2rem)] min-w-[8rem] origin-(--bits-context-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-xl p-1 shadow-lg transition-[opacity,scale] duration-(--duration-fast) ease-out outline-none data-[starting-style]:opacity-0 data-[state=closed]:pointer-events-none data-[state=closed]:opacity-0 data-[state=closed]:duration-(--duration-instant) data-[state=closed]:ease-in motion-safe:data-[starting-style]:scale-95',
			className
		)}
		{...restProps}
	/>
</ContextMenuPrimitive.Portal>
