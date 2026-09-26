<script lang="ts">
	import * as SegmentedControl from './index.js';

	let {
		value = $bindable('balanced'),
		onValueChange,
		disabled = false,
		thoroughDisabled = false,
		fastLabel = 'Fast'
	}: {
		value?: string;
		onValueChange?: (value: string) => void;
		disabled?: boolean;
		thoroughDisabled?: boolean;
		fastLabel?: string;
	} = $props();
</script>

<SegmentedControl.Root bind:value {onValueChange} {disabled} aria-label="Response mode">
	<SegmentedControl.Item value="fast"
		><span id="fast-label">{fastLabel}</span></SegmentedControl.Item
	>
	<SegmentedControl.Item value="balanced">Balanced</SegmentedControl.Item>
	<SegmentedControl.Item value="thorough" disabled={thoroughDisabled}
		>Thorough</SegmentedControl.Item
	>
</SegmentedControl.Root>
