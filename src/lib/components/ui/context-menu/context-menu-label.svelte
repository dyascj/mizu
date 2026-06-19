<script lang="ts">
	import { ContextMenu as ContextMenuPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		inset,
		...restProps
	}: ContextMenuPrimitive.GroupHeadingProps & {
		inset?: boolean;
	} = $props();
</script>

<ContextMenuPrimitive.GroupHeading
	bind:ref
	data-inset={inset ? '' : undefined}
	class={cn('px-2 py-1.5 text-xs font-semibold text-muted-foreground data-[inset]:pl-8', className)}
	{...restProps}
/>
