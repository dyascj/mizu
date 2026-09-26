<script lang="ts">
	import type { DateValue } from '@internationalized/date';
	import * as DatePicker from './index.js';

	let {
		value = $bindable(),
		placeholder,
		onValueChange
	}: {
		value?: DateValue;
		placeholder?: DateValue;
		onValueChange?: (value: DateValue | undefined) => void;
	} = $props();
</script>

<DatePicker.Root bind:value {placeholder} {onValueChange}>
	<DatePicker.Label>Retire the old model on</DatePicker.Label>
	<DatePicker.Input />
	<DatePicker.Content />
</DatePicker.Root>
