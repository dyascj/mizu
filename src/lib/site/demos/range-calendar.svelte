<script lang="ts">
	import { RangeCalendar } from '$lib/components/ui/range-calendar';
	import { getLocalTimeZone, today } from '@internationalized/date';

	const start = today(getLocalTimeZone());
	let value = $state({ start, end: start.add({ days: 5 }) });
</script>

<RangeCalendar bind:value class="bg-card rounded-2xl p-3 shadow-md" />
