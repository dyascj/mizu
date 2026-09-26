<script lang="ts">
	import { untrack } from 'svelte';
	import { WheelPicker, WheelPickerColumn } from './index.js';

	let {
		hour = $bindable('7'),
		disabled = false,
		onValueChange,
		days,
		day = '20',
		onDayChange
	}: {
		hour?: string;
		disabled?: boolean;
		onValueChange?: (value: string) => void;
		/** How many days the month has; leave out to hide the day column. */
		days?: number;
		day?: string;
		onDayChange?: (value: string) => void;
	} = $props();

	// Owned here rather than passed in, so changing `days` leaves it alone.
	let dayValue = $state(untrack(() => day));
</script>

<WheelPicker label="Briefing time">
	{#if days}
		<WheelPickerColumn
			label="Day"
			options={Array.from({ length: days }, (_, i) => String(i + 1))}
			bind:value={dayValue}
			onValueChange={onDayChange}
		/>
	{/if}
	<WheelPickerColumn
		label="Hour"
		options={['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']}
		bind:value={hour}
		{disabled}
		{onValueChange}
	/>
	<WheelPickerColumn label="AM or PM" options={['AM', 'PM']} value="AM" />
</WheelPicker>
