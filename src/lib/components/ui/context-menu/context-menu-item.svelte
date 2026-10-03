<script lang="ts">
	import { ContextMenu as ContextMenuPrimitive, type WithoutChild } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		inset,
		variant = 'default',
		...restProps
	}: WithoutChild<ContextMenuPrimitive.ItemProps> & {
		/** Indents the label to line up with checkbox and radio items. */
		inset?: boolean;
		/** `destructive` tints the item for actions that delete or cannot be undone. */
		variant?: 'default' | 'destructive';
	} = $props();
</script>

<!-- No transition on the highlight: it follows every pointer move, so any
     easing would read as lag. -->
<ContextMenuPrimitive.Item
	bind:ref
	data-inset={inset ? '' : undefined}
	data-variant={variant}
	class={cn(
		'data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground [&_svg:not([class*=text-])]:text-muted-foreground relative flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:ps-8 [&_svg]:size-4 [&_svg]:shrink-0 data-[highlighted]:[&_svg:not([class*=text-])]:text-current',
		'data-[variant=destructive]:text-destructive data-[variant=destructive]:data-[highlighted]:bg-destructive/10 data-[variant=destructive]:data-[highlighted]:text-destructive data-[variant=destructive]:[&_svg:not([class*=text-])]:text-current',
		className
	)}
	{...restProps}
/>
