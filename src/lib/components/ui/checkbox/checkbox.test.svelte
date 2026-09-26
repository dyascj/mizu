<script lang="ts">
	import { Checkbox, CheckboxGroup } from './index.js';

	let {
		value = $bindable(['comments']),
		onValueChange,
		rangeSelect,
		disabled = []
	}: {
		value?: string[];
		onValueChange?: (value: string[]) => void;
		rangeSelect?: boolean;
		disabled?: string[];
	} = $props();

	const items = ['comments', 'mentions', 'followers', 'updates', 'digest'];
</script>

<CheckboxGroup bind:value {onValueChange} {rangeSelect} aria-label="Notifications">
	{#each items as item (item)}
		<label>
			<Checkbox value={item} disabled={disabled.includes(item)} />
			<span>{item}</span>
		</label>
	{/each}
</CheckboxGroup>
<output data-testid="value">{value.join(',')}</output>
