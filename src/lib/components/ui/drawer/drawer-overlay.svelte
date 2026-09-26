<script lang="ts">
	import { Drawer as DrawerPrimitive } from 'vaul-svelte';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: DrawerPrimitive.OverlayProps = $props();
</script>

<DrawerPrimitive.Overlay
	bind:ref
	data-slot="drawer-overlay"
	class={cn(
		'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50',
		// A nested drawer dims only the drawer it covers, with that drawer's own
		// scrim, so the page never sinks under two layers of black.
		'data-nested:bg-transparent',
		className
	)}
	{...restProps}
/>
