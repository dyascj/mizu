<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import { Checkbox } from '$lib/components/ui/checkbox';

	let checked = $state(true);
</script>

<div class="flex items-center gap-2.5">
	<Checkbox id="filtered" bind:checked />
	<Label for="filtered">Filtered and ready to pour</Label>
</div>
