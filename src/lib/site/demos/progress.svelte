<script lang="ts">
	import { Progress } from '$lib/components/ui/progress';

	let value = $state(66);
</script>

<div class="flex w-full max-w-xs flex-col gap-2">
	<div class="flex items-center justify-between text-sm">
		<span class="text-muted-foreground">Reservoir</span>
		<span class="tabular-nums text-foreground">{value}%</span>
	</div>
	<Progress {value} />
</div>
