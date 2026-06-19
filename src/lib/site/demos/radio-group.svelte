<script lang="ts">
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { Label } from '$lib/components/ui/label';

	let value = $state('breeze');
</script>

<RadioGroup.Root bind:value class="grid gap-3">
	<div class="flex items-center gap-3">
		<RadioGroup.Item value="calm" id="wind-calm" />
		<Label for="wind-calm">Calm</Label>
	</div>
	<div class="flex items-center gap-3">
		<RadioGroup.Item value="breeze" id="wind-breeze" />
		<Label for="wind-breeze">Breeze</Label>
	</div>
	<div class="flex items-center gap-3">
		<RadioGroup.Item value="storm" id="wind-storm" />
		<Label for="wind-storm">Storm</Label>
	</div>
</RadioGroup.Root>
