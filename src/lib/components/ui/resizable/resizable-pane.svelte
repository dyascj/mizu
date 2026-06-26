<script lang="ts">
	import { Pane, type PaneProps } from 'paneforge';

	let { ref = $bindable(null), ...rest }: PaneProps = $props();
</script>

<Pane bind:ref {...rest} />
