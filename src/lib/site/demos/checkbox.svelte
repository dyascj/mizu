<script lang="ts">
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Label } from '$lib/components/ui/label';

	let checked = $state(true);
</script>

<div class="flex items-center gap-3">
	<Checkbox id="clear-skies" bind:checked />
	<Label for="clear-skies">Accept clear skies</Label>
</div>
