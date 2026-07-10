<script lang="ts">
	import { Switch } from '$lib/components/ui/switch';
	import { Label } from '$lib/components/ui/label';

	let checked = $state(true);
</script>

<div class="flex items-center gap-3">
	<Switch id="glow" bind:checked />
	<Label for="glow">Aura glow</Label>
</div>
