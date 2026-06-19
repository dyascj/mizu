<script lang="ts">
	import { Combobox as ComboboxPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: ComboboxPrimitive.GroupHeadingProps & { class?: string } = $props();
</script>

<ComboboxPrimitive.GroupHeading
	bind:ref
	class={cn('px-2 py-1.5 text-xs font-semibold text-muted-foreground', className)}
	{...restProps}
/>
