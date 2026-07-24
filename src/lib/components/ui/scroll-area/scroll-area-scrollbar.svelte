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
		'flex touch-none transition-colors duration-150 select-none',
		orientation === 'vertical' && 'h-full w-2.5 border-l border-l-transparent p-px',
		orientation === 'horizontal' && 'h-2.5 flex-col border-t border-t-transparent p-px',
		className
	)}
	{...restProps}
>
	<ScrollAreaPrimitive.Thumb class="bg-border relative flex-1 rounded-full" />
</ScrollAreaPrimitive.Scrollbar>
