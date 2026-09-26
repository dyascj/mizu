<script lang="ts">
	import { NumberInput } from '$lib/components/ui/number-input';
	import { NumberTicker } from '$lib/components/ui/number-ticker';

	const seatPrice = 24;
	const runPrice = 6;

	let seats = $state(4);
	let runs = $state(2);
	const total = $derived(seats * (seatPrice + runs * runPrice));
</script>

<div class="bg-card flex w-full max-w-sm flex-col gap-1 rounded-3xl p-2 shadow-sm">
	<div class="flex items-center gap-3 px-3 py-2.5">
		<div class="flex min-w-0 flex-1 flex-col">
			<label for="plan-seats" class="text-sm font-medium">Seats</label>
			<span class="text-muted-foreground text-xs">People who can run agents</span>
		</div>
		<NumberInput id="plan-seats" bind:value={seats} min={1} max={50} />
	</div>
	<div class="flex items-center gap-3 px-3 py-2.5">
		<div class="flex min-w-0 flex-1 flex-col">
			<label for="plan-runs" class="text-sm font-medium">Parallel runs</label>
			<span class="text-muted-foreground text-xs">Per seat, at the same time</span>
		</div>
		<NumberInput id="plan-runs" bind:value={runs} min={1} max={8} />
	</div>
	<div class="bg-secondary flex items-center justify-between rounded-2xl px-4 py-3">
		<span class="text-muted-foreground text-sm">Monthly total</span>
		<NumberTicker
			value={total}
			locale="en-US"
			format={{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }}
			class="text-lg font-semibold tracking-tight"
		/>
	</div>
</div>
