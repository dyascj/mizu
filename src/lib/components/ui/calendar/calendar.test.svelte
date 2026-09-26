<script lang="ts">
	import type { DateValue } from '@internationalized/date';
	import { Calendar } from './index.js';
	import CalendarDay from './calendar-day.svelte';

	let {
		value,
		placeholder,
		dayClass
	}: { value?: DateValue; placeholder?: DateValue; dayClass?: string } = $props();
</script>

<Calendar type="single" {value} {placeholder}>
	{#snippet day()}
		<CalendarDay class={dayClass} />
	{/snippet}
</Calendar>
