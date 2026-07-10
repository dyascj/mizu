<script lang="ts">
	import { Menubar as MenubarPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		value = $bindable(''),
		class: className,
		...restProps
	}: MenubarPrimitive.RootProps = $props();
</script>

<MenubarPrimitive.Root
	bind:ref
	bind:value
	class={cn(
		'flex h-10 items-center gap-1 rounded-xl glass border border-border p-1 shadow-xs',
		className
	)}
	{...restProps}
/>
