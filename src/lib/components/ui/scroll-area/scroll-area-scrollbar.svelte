<script lang="ts">
	import { ScrollArea as ScrollAreaPrimitive, type WithoutChild } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		orientation = 'vertical',
		...restProps
	}: WithoutChild<ScrollAreaPrimitive.ScrollbarProps> & { class?: string } = $props();
</script>

<ScrollAreaPrimitive.Scrollbar
	bind:ref
	{orientation}
	class={cn(
		'flex touch-none select-none transition-colors duration-150',
		orientation === 'vertical' && 'h-full w-2.5 border-l border-l-transparent p-px',
		orientation === 'horizontal' && 'h-2.5 flex-col border-t border-t-transparent p-px',
		className
	)}
	{...restProps}
>
	<ScrollAreaPrimitive.Thumb class="relative flex-1 rounded-full bg-border" />
</ScrollAreaPrimitive.Scrollbar>
