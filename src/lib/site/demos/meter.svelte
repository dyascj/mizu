<script lang="ts">
	import { Meter } from '$lib/components/ui/meter';
</script>

<div class="mx-auto flex w-full max-w-sm flex-col gap-5">
	<Meter
		label="Water quality"
		value={88}
		low={40}
		high={75}
		optimum={100}
		showValue
		format={(v) => `${v}%`}
	/>
	<Meter
		label="Tank level"
		value={48}
		low={30}
		high={80}
		optimum={100}
		showValue
		format={(v) => `${v}%`}
	/>
	<Meter
		label="Turbidity"
		value={6.2}
		min={0}
		max={10}
		low={2}
		high={5}
		optimum={0}
		showValue
		format={(v) => `${v} NTU`}
	/>
</div>
