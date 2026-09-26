<script lang="ts">
	import * as SegmentedControl from './index.js';

	let {
		value = $bindable('balanced'),
		onValueChange,
		disabled = false,
		thoroughDisabled = false
	}: {
		value?: string;
		onValueChange?: (value: string) => void;
		disabled?: boolean;
		thoroughDisabled?: boolean;
	} = $props();
</script>

<SegmentedControl.Root bind:value {onValueChange} {disabled} aria-label="Response mode">
	<SegmentedControl.Item value="fast">Fast</SegmentedControl.Item>
	<SegmentedControl.Item value="balanced">Balanced</SegmentedControl.Item>
	<SegmentedControl.Item value="thorough" disabled={thoroughDisabled}
		>Thorough</SegmentedControl.Item
	>
</SegmentedControl.Root>
