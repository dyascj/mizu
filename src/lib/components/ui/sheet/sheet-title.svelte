<script lang="ts">
	import { Dialog as SheetPrimitive, type WithoutChild } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChild<SheetPrimitive.TitleProps> & { class?: string } = $props();
</script>

<SheetPrimitive.Title
	bind:ref
	class={cn('font-display text-lg font-semibold text-foreground', className)}
	{...restProps}
/>
