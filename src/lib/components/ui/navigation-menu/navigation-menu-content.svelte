<script lang="ts">
	import { NavigationMenu as NavigationMenuPrimitive, type WithoutChild } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChild<NavigationMenuPrimitive.ContentProps> & { class?: string } = $props();
</script>

<NavigationMenuPrimitive.Content
	bind:ref
	class={cn(
		'bg-popover left-0 top-0 w-full rounded-xl dark:border dark:border-border p-2 text-popover-foreground shadow-lg md:absolute md:w-auto',
		'transition-[opacity,transform] duration-200 ease-out',
		'data-[motion=from-start]:-translate-x-2 data-[motion=from-end]:translate-x-2 data-[motion=from-start]:opacity-0 data-[motion=from-end]:opacity-0',
		'data-[motion=to-start]:-translate-x-2 data-[motion=to-end]:translate-x-2 data-[motion=to-start]:opacity-0 data-[motion=to-end]:opacity-0',
		className
	)}
	{...restProps}
/>
