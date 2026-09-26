<script lang="ts">
	import Dock from './dock.svelte';
	import DockItem from './dock-item.svelte';

	let {
		magnification = 1.6,
		distance = 110,
		running,
		onLaunch
	}: {
		magnification?: number;
		distance?: number;
		running?: boolean;
		onLaunch?: () => void;
	} = $props();
</script>

<Dock data-testid="dock" {magnification} {distance}>
	<DockItem label="Inbox" {running} {onLaunch}>I</DockItem>
	<DockItem label="Agents">A</DockItem>
</Dock>
