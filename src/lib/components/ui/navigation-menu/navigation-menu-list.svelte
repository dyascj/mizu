<script lang="ts">
	import { NavigationMenu as NavigationMenuPrimitive, type WithoutChild } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChild<NavigationMenuPrimitive.ListProps> & { class?: string } = $props();
</script>

<NavigationMenuPrimitive.List
	bind:ref
	class={cn('group flex flex-1 list-none items-center justify-center gap-1', className)}
	{...restProps}
/>
