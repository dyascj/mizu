<script lang="ts">
	import { Dialog as SheetPrimitive, type WithoutChild } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChild<SheetPrimitive.DescriptionProps> & { class?: string } = $props();
</script>

<SheetPrimitive.Description
	bind:ref
	class={cn('text-sm text-muted-foreground', className)}
	{...restProps}
/>
