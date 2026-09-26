<script lang="ts">
	import { Rating } from '$lib/components/ui/rating';

	let value = $state(3.5);

	const words = ['Not rated', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];
	const word = $derived(words[Math.ceil(value)]);
</script>

<div class="flex flex-col items-center gap-5">
	<div class="flex flex-col items-center gap-2">
		<span class="text-muted-foreground text-sm">How helpful was this answer?</span>
		<Rating bind:value max={5} allowHalf aria-label="Answer rating" />
		<span class="text-sm tabular-nums">
			<span class="font-semibold">{value.toFixed(1)}</span>
			<span class="text-muted-foreground">· {word}</span>
		</span>
	</div>
	<div class="flex items-center gap-2">
		<span class="text-muted-foreground text-xs">Average rating</span>
		<Rating value={4} readonly size={16} aria-label="Average rating, 4 of 5" />
	</div>
</div>
