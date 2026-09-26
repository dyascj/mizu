<script lang="ts">
	import * as Tooltip from './index.js';

	let { copyLabel = 'Copy' }: { copyLabel?: string } = $props();
</script>

<Tooltip.Group delayDuration={200} skipDelayDuration={300}>
	<Tooltip.GroupTrigger content={copyLabel} aria-label="Copy">C</Tooltip.GroupTrigger>
	<Tooltip.GroupTrigger content="Regenerate" shortcut="⌘R" aria-label="Regenerate"
		>R</Tooltip.GroupTrigger
	>
	<Tooltip.GroupTrigger content="Share">
		{#snippet child({ props })}
			<a href="#share" {...props}>Share link</a>
		{/snippet}
	</Tooltip.GroupTrigger>
</Tooltip.Group>
