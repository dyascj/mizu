<script lang="ts">
	import { NavigationMenu as NavigationMenuPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: NavigationMenuPrimitive.LinkProps & { class?: string } = $props();
</script>

<NavigationMenuPrimitive.Link
	bind:ref
	class={cn(
		'block select-none space-y-1 rounded-lg p-3 text-sm leading-none no-underline outline-none transition-[background-color] duration-150 hover:bg-secondary focus-visible:bg-secondary data-[active]:bg-accent',
		className
	)}
	{...restProps}
/>
