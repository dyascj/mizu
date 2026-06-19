<script lang="ts">
	import { AlertDialog as AlertDialogPrimitive, type WithoutChild } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChild<AlertDialogPrimitive.OverlayProps> & { class?: string } = $props();
</script>

<AlertDialogPrimitive.Overlay
	bind:ref
	class={cn(
		'fixed inset-0 z-50 bg-[rgba(6,21,32,0.45)] backdrop-blur-sm transition-[opacity] duration-150 data-[state=closed]:opacity-0 data-[state=open]:opacity-100',
		className
	)}
	{...restProps}
/>
