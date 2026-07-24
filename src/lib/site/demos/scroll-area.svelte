<script lang="ts">
	import { ScrollArea } from '$lib/components/ui/scroll-area';

	const lakes = [
		'Lake Baikal',
		'Crater Lake',
		'Lake Tahoe',
		'Lake Bled',
		'Lake Louise',
		'Plitvice Lakes',
		'Lake Wakatipu',
		'Lago di Braies',
		'Moraine Lake',
		'Lake Hallstatt',
		'Lake Geneva',
		'Lake Como',
		'Lake Atitlan',
		'Lake Pukaki',
		'Lake Bohinj'
	];
</script>

<ScrollArea class="bg-card h-56 w-56 rounded-xl shadow-sm">
	<div class="p-4">
		<h4 class="mb-3 text-sm font-semibold">Clear waters</h4>
		<ul class="text-muted-foreground space-y-2 text-sm">
			{#each lakes as lake (lake)}
				<li class="border-border border-b pb-2 last:border-0">{lake}</li>
			{/each}
		</ul>
	</div>
</ScrollArea>
