<script lang="ts">
	import { Waveform } from '$lib/components/ui/waveform';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';

	let active = $state(true);
</script>

<div class="flex flex-col items-center gap-6">
	<Waveform {active} bars={7} class="h-10" />
	<div class="flex items-center gap-2.5">
		<Switch id="wave-live" bind:checked={active} />
		<Label for="wave-live">Live</Label>
	</div>
</div>
