<script lang="ts">
	import { AlertDialog as AlertDialogPrimitive, type WithoutChild } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChild<AlertDialogPrimitive.TitleProps> & { class?: string } = $props();
</script>

<AlertDialogPrimitive.Title
	bind:ref
	class={cn('font-display text-foreground text-lg font-semibold', className)}
	{...restProps}
/>
