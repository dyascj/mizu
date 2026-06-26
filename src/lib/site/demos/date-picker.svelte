<script lang="ts">
	import * as DatePicker from '$lib/components/ui/date-picker';
	import { type DateValue, getLocalTimeZone, today } from '@internationalized/date';

	let value = $state<DateValue>(today(getLocalTimeZone()));
</script>

<div class="flex justify-center">
	<DatePicker.Root bind:value>
		<div class="flex w-64 flex-col gap-2">
			<DatePicker.Label>Trip date</DatePicker.Label>
			<DatePicker.Input />
			<DatePicker.Content />
		</div>
	</DatePicker.Root>
</div>
