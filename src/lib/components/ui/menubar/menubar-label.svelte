<script lang="ts">
	import { Menubar as MenubarPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		inset,
		...restProps
	}: MenubarPrimitive.GroupHeadingProps & {
		inset?: boolean;
	} = $props();
</script>

<MenubarPrimitive.GroupHeading
	bind:ref
	data-inset={inset ? '' : undefined}
	class={cn('px-2 py-1.5 text-xs font-semibold text-muted-foreground data-[inset]:pl-8', className)}
	{...restProps}
/>
