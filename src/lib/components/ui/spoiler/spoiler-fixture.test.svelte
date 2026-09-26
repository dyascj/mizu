<script lang="ts">
	import Spoiler from './spoiler.svelte';

	let {
		revealed,
		onRevealedChange
	}: { revealed?: boolean; onRevealedChange?: (revealed: boolean) => void } = $props();
</script>

<p>
	In the last chapter you learn <Spoiler {revealed} {onRevealedChange}
		>the agent was the narrator</Spoiler
	> all along.
</p>
