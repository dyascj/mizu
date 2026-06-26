<script lang="ts">
	import { DatePicker as DatePickerPrimitive } from 'bits-ui';

	let {
		value = $bindable(),
		placeholder = $bindable(),
		open = $bindable(false),
		weekdayFormat = 'short',
		...restProps
	}: DatePickerPrimitive.RootProps = $props();
</script>

<DatePickerPrimitive.Root bind:value bind:placeholder bind:open {weekdayFormat} {...restProps} />
