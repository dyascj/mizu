<script lang="ts">
	import { Menubar as MenubarPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: MenubarPrimitive.TriggerProps = $props();
</script>

<MenubarPrimitive.Trigger
	bind:ref
	class={cn(
		'flex cursor-pointer select-none items-center rounded-lg px-3 py-1.5 text-sm font-medium outline-none transition-colors duration-100 focus-visible:bg-accent data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
		className
	)}
	{...restProps}
/>
