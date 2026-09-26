<script lang="ts">
	import { SelectionToolbar, SelectionToolbarButton, SelectionToolbarSeparator } from './index.js';

	let { onAsk = () => {} }: { onAsk?: (text: string) => void } = $props();
</script>

<SelectionToolbar label="Draft actions">
	{#snippet actions(toolbar)}
		<SelectionToolbarButton onclick={() => onAsk(toolbar.text)}>Ask</SelectionToolbarButton>
		<SelectionToolbarButton label="Explain">E</SelectionToolbarButton>
		<SelectionToolbarSeparator />
		<SelectionToolbarButton label="Bold" pressed={false} onclick={() => toolbar.announce('Bold on')}
			>B</SelectionToolbarButton
		>
	{/snippet}
	<p data-testid="text" tabindex="-1">The retrieval step was re-embedding every document.</p>
</SelectionToolbar>
<p data-testid="outside">Somewhere else entirely.</p>
