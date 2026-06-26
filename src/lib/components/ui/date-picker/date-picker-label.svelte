<script lang="ts">
	import { DatePicker as DatePickerPrimitive, type WithoutChild } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChild<DatePickerPrimitive.LabelProps> & { class?: string } = $props();
</script>

<DatePickerPrimitive.Label
	bind:ref
	class={cn('text-sm font-medium leading-none text-foreground', className)}
	{...restProps}
/>
