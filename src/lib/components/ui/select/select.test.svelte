<script lang="ts">
	import * as Select from './index.js';

	let {
		value = $bindable('sol'),
		position,
		side
	}: {
		value?: string;
		position?: 'item-aligned' | 'popper';
		side?: 'top' | 'bottom';
	} = $props();

	const voices = ['Arbor', 'Breeze', 'Sol', 'Wren'];
</script>

<Select.Root type="single" bind:value>
	<Select.Trigger aria-label="Voice">{value}</Select.Trigger>
	<Select.Content {position} {side}>
		{#each voices as voice (voice)}
			<Select.Item value={voice.toLowerCase()} label={voice} />
		{/each}
	</Select.Content>
</Select.Root>
