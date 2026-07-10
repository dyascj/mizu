<script lang="ts">
	import { Dialog as DialogPrimitive, type WithoutChild } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChild<DialogPrimitive.TitleProps> & { class?: string } = $props();
</script>

<DialogPrimitive.Title
	bind:ref
	class={cn('font-display text-lg font-semibold text-foreground', className)}
	{...restProps}
/>
