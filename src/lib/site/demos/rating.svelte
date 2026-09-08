<script lang="ts">
	import { Rating } from '$lib/components/ui/rating';

	let value = $state(3);
</script>

<div class="flex flex-col items-center gap-5">
	<div class="flex flex-col items-center gap-2">
		<span class="text-muted-foreground text-sm">Rate this response</span>
		<Rating bind:value max={5} />
		<span class="text-sm font-semibold tabular-nums">{value} / 5</span>
	</div>
	<div class="flex items-center gap-2">
		<span class="text-muted-foreground text-xs">Helpfulness</span>
		<Rating value={4} readonly size={16} />
	</div>
</div>
