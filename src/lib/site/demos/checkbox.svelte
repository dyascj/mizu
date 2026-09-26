<script lang="ts">
	import { Checkbox, CheckboxGroup } from '$lib/components/ui/checkbox';
	import { Kbd } from '$lib/components/ui/kbd';

	const events = [
		{ id: 'finished', label: 'Run finished', description: 'An agent completes its task' },
		{ id: 'approval', label: 'Needs approval', description: 'An agent waits on you to act' },
		{ id: 'failed', label: 'Run failed', description: 'A step or tool call errors out' },
		{ id: 'usage', label: 'Usage alerts', description: 'Spend passes 80% of the limit' },
		{ id: 'digest', label: 'Weekly digest', description: 'A summary of every run' }
	];

	let value = $state(['finished', 'approval']);
	const all = $derived(value.length === events.length);
	const some = $derived(value.length > 0 && !all);

	const row =
		'hover:bg-secondary flex cursor-pointer gap-3 rounded-xl px-3 py-2.5 transition-[background-color] duration-(--duration-fast) ease-out select-none';
</script>

<div class="bg-card w-full max-w-sm rounded-2xl p-1.5 shadow-sm">
	<div class="flex items-center gap-3 pr-3">
		<label class="{row} min-w-0 flex-1 items-center">
			<Checkbox
				checked={all}
				indeterminate={some}
				aria-controls={events.map((event) => `notify-${event.id}`).join(' ')}
				onCheckedChange={(checked) => (value = checked ? events.map((event) => event.id) : [])}
			/>
			<span class="text-sm font-semibold">All notifications</span>
		</label>
		<span class="text-muted-foreground shrink-0 text-xs tabular-nums">
			{value.length} of {events.length}
		</span>
	</div>
	<CheckboxGroup bind:value aria-label="Notify me when" class="gap-0">
		{#each events as event (event.id)}
			<label class="{row} items-start">
				<Checkbox id="notify-{event.id}" value={event.id} class="mt-px" />
				<span class="flex min-w-0 flex-col gap-0.5">
					<span class="text-sm font-medium">{event.label}</span>
					<span class="text-muted-foreground text-sm">{event.description}</span>
				</span>
			</label>
		{/each}
	</CheckboxGroup>
	<p class="text-muted-foreground px-3 pt-1.5 pb-2 text-xs">
		<Kbd>Shift</Kbd> click to select a range
	</p>
</div>
