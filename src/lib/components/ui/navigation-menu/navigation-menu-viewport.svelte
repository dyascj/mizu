<script lang="ts">
	import { NavigationMenu as NavigationMenuPrimitive, type WithoutChild } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChild<NavigationMenuPrimitive.ViewportProps> & { class?: string } = $props();
</script>

<div class="absolute left-0 top-full isolate z-50 flex justify-center">
	<NavigationMenuPrimitive.Viewport
		bind:ref
		class={cn(
			'glass-strong relative mt-2 h-[var(--bits-navigation-menu-viewport-height)] w-full origin-top overflow-hidden rounded-xl border border-[color:var(--glass-border)] text-popover-foreground shadow-glass transition-[width,height] duration-200 ease-out md:w-[var(--bits-navigation-menu-viewport-width)]',
			'data-[state=closed]:scale-95 data-[state=closed]:opacity-0 data-[state=open]:scale-100 data-[state=open]:opacity-100',
			className
		)}
		{...restProps}
	/>
</div>
