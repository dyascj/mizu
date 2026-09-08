<script lang="ts">
	import { NavigationMenu as NavigationMenuPrimitive, type WithoutChild } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChild<NavigationMenuPrimitive.ViewportProps> & { class?: string } = $props();
</script>

<div class="absolute top-full left-1/2 isolate z-50 flex -translate-x-1/2 justify-center">
	<NavigationMenuPrimitive.Viewport
		bind:ref
		class={cn(
			'bg-popover text-popover-foreground relative mt-2 h-[var(--bits-navigation-menu-viewport-height)] w-[var(--bits-navigation-menu-viewport-width)] max-w-[calc(100vw-2rem)] origin-top overflow-hidden rounded-xl shadow-lg transition-[width,height] duration-200 ease-out',
			'data-[state=closed]:scale-95 data-[state=closed]:opacity-0 data-[state=open]:scale-100 data-[state=open]:opacity-100',
			className
		)}
		{...restProps}
	/>
</div>
