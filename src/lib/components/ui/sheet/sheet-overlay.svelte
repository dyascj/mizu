<script lang="ts">
	import { Dialog as SheetPrimitive, type WithoutChild } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChild<SheetPrimitive.OverlayProps> & { class?: string } = $props();
</script>

<SheetPrimitive.Overlay
	bind:ref
	class={cn(
		// No open-state opacity rule: Tailwind emits it after the starting style,
		// where it would win and skip the fade in.
		'fixed inset-0 z-50 bg-black/45 backdrop-blur-sm transition-[opacity] duration-(--duration-base) ease-out data-ending-style:duration-(--duration-fast) data-ending-style:ease-in data-starting-style:opacity-0 data-[state=closed]:opacity-0',
		className
	)}
	{...restProps}
/>
