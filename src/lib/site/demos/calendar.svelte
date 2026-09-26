<script lang="ts">
	import { Calendar } from '$lib/components/ui/calendar';
	import { type DateValue, getLocalTimeZone, today } from '@internationalized/date';

	let value = $state<DateValue | undefined>(today(getLocalTimeZone()).add({ days: 3 }));

	const label = $derived(
		value
			?.toDate(getLocalTimeZone())
			.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
	);
</script>

<div class="bg-card flex w-full max-w-xs flex-col gap-3 rounded-2xl p-4 shadow-sm">
	<div class="min-w-0">
		<p class="font-semibold tracking-tight">Schedule the eval run</p>
		<p class="text-muted-foreground text-sm">The agent reruns the regression suite overnight.</p>
	</div>
	<Calendar type="single" bind:value class="mx-auto bg-transparent p-0" />
	<p class="bg-secondary text-muted-foreground truncate rounded-full px-3 py-1.5 text-sm">
		{#if value}
			Runs on <span class="text-foreground font-medium">{label}</span>
		{:else}
			Pick a day
		{/if}
	</p>
</div>
