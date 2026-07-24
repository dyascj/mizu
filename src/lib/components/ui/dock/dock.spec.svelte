<script lang="ts">
	import Dock from './dock.svelte';
	import DockItem from './dock-item.svelte';

	let { magnification = 1.6, distance = 110 }: { magnification?: number; distance?: number } =
		$props();
</script>

<Dock data-testid="dock" {magnification} {distance}>
	<DockItem label="Inbox">I</DockItem>
</Dock>
