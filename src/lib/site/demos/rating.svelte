<script lang="ts">
	import { Rating } from '$lib/components/ui/rating';

	let value = $state(3);
</script>

<div class="flex flex-col items-center gap-5">
	<div class="flex flex-col items-center gap-2">
		<span class="text-sm text-muted-foreground">Rate this spring</span>
		<Rating bind:value max={5} />
		<span class="text-sm font-semibold tabular-nums">{value} / 5</span>
	</div>
	<div class="flex items-center gap-2">
		<span class="text-xs text-muted-foreground">Clarity</span>
		<Rating value={4} readonly size={16} />
	</div>
</div>
