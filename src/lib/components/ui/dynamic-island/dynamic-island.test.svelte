<script lang="ts">
	import * as DynamicIsland from './index.js';

	let { activity = 'idle', paused = false }: { activity?: string; paused?: boolean } = $props();
</script>

<DynamicIsland.Root {activity} {paused}>
	<DynamicIsland.Activity name="idle" label="No live activity">
		<span>Idle</span>
	</DynamicIsland.Activity>
	<DynamicIsland.Activity name="agent" label="Research agent running">
		<span>Researching</span>
		<button type="button">Stop</button>
	</DynamicIsland.Activity>
	<DynamicIsland.Activity name="voice" shape="card">
		<span>Voice with Aria</span>
	</DynamicIsland.Activity>
</DynamicIsland.Root>
