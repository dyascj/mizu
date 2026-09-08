<script lang="ts">
	import { Menubar as MenubarPrimitive } from 'bits-ui';
	import { MediaQuery } from 'svelte/reactivity';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: MenubarPrimitive.SubContentProps = $props();
	const narrow = new MediaQuery('(max-width: 479px)');
</script>

<MenubarPrimitive.Portal>
	<MenubarPrimitive.SubContent
		bind:ref
		side={narrow.current ? 'bottom' : 'right'}
		collisionPadding={8}
		class={cn(
			'bg-popover text-popover-foreground z-50 max-h-[var(--bits-menu-content-available-height)] max-w-[calc(100vw-2rem)] min-w-[8rem] overflow-y-auto rounded-xl p-1 shadow-lg transition-[opacity,transform] duration-200 data-[state=closed]:scale-95 data-[state=closed]:opacity-0 data-[state=open]:scale-100 data-[state=open]:opacity-100',
			className
		)}
		{...restProps}
	/>
</MenubarPrimitive.Portal>
