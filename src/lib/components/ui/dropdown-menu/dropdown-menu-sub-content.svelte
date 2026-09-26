<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
	import { MediaQuery } from 'svelte/reactivity';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: DropdownMenuPrimitive.SubContentProps = $props();
	const narrow = new MediaQuery('(max-width: 479px)');
</script>

<DropdownMenuPrimitive.Portal>
	<DropdownMenuPrimitive.SubContent
		bind:ref
		side={narrow.current ? 'bottom' : 'right'}
		collisionPadding={8}
		class={cn(
			'bg-popover text-popover-foreground z-50 max-h-(--bits-menu-content-available-height) max-w-[calc(100vw-2rem)] min-w-[8rem] origin-(--bits-menu-content-transform-origin) overflow-y-auto rounded-xl p-1 shadow-lg transition-[opacity,scale] duration-(--duration-fast) ease-out outline-none data-[starting-style]:opacity-0 data-[state=closed]:pointer-events-none data-[state=closed]:opacity-0 data-[state=closed]:duration-(--duration-instant) data-[state=closed]:ease-in motion-safe:data-[starting-style]:scale-95 motion-safe:data-[state=closed]:scale-[0.97]',
			className
		)}
		{...restProps}
	/>
</DropdownMenuPrimitive.Portal>
