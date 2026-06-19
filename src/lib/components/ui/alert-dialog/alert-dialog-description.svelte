<script lang="ts">
	import { AlertDialog as AlertDialogPrimitive, type WithoutChild } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChild<AlertDialogPrimitive.DescriptionProps> & { class?: string } = $props();
</script>

<AlertDialogPrimitive.Description
	bind:ref
	class={cn('text-sm text-muted-foreground', className)}
	{...restProps}
/>
