<script lang="ts">
	import * as RadioGroup from './index.js';

	let {
		value = $bindable('pro'),
		onValueChange
	}: { value?: string; onValueChange?: (value: string) => void } = $props();
</script>

<RadioGroup.Root bind:value {onValueChange} aria-label="Plan">
	<RadioGroup.Card value="hobby">Hobby</RadioGroup.Card>
	<RadioGroup.Card value="pro">Pro</RadioGroup.Card>
	<RadioGroup.Card value="team" disabled>Team</RadioGroup.Card>
</RadioGroup.Root>
<RadioGroup.Root value="calm" aria-label="Tone">
	<RadioGroup.Item value="calm" aria-label="Calm" />
	<RadioGroup.Item value="bold" aria-label="Bold" />
</RadioGroup.Root>
