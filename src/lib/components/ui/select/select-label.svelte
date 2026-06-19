<script lang="ts">
	import { Select as SelectPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: SelectPrimitive.GroupHeadingProps & { class?: string } = $props();
</script>

<SelectPrimitive.GroupHeading
	bind:ref
	class={cn('px-2 py-1.5 text-xs font-semibold text-muted-foreground', className)}
	{...restProps}
/>
