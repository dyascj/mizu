<script lang="ts">
	import { Slider } from '$lib/components/ui/slider';

	let value = $state(40);
</script>

<div class="w-full max-w-xs">
	<div class="mb-3 flex items-center justify-between text-sm">
		<span class="text-muted-foreground">Water level</span>
		<span class="font-semibold tabular-nums">{value}%</span>
	</div>
	<Slider type="single" bind:value max={100} />
</div>
