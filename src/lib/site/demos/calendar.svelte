<script lang="ts">
	import { Calendar } from '$lib/components/ui/calendar';
	import { type DateValue, getLocalTimeZone, today } from '@internationalized/date';

	let value = $state<DateValue>(today(getLocalTimeZone()));
</script>

<div class="flex justify-center">
	<Calendar type="single" bind:value />
</div>
