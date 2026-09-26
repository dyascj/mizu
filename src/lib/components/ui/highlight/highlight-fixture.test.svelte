<script lang="ts">
	import Highlight from './highlight.svelte';

	let { tone, onDrawn }: { tone?: 'primary' | 'aurora'; onDrawn?: () => void } = $props();
</script>

<p>
	The assistant found three duplicate seats and <Highlight {tone} {onDrawn}
		>cut the monthly bill by a third</Highlight
	>.
</p>
