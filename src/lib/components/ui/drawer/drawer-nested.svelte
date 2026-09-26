<script lang="ts">
	import { Drawer as DrawerPrimitive } from 'vaul-svelte';
	import { getDrawerLayer } from './context.js';

	let {
		shouldScaleBackground = true,
		open = $bindable(false),
		activeSnapPoint = $bindable(null),
		onDrag,
		...restProps
	}: DrawerPrimitive.RootProps = $props();

	const behind = getDrawerLayer();
	let releasing = false;

	// The drawer behind brightens as this one is dragged away, and settles back
	// wherever the release takes it.
	function drag(event: PointerEvent, progress: number) {
		onDrag?.(event, progress);
		if (!behind) return;
		behind.setNestedDrag(progress);
		if (releasing) return;
		releasing = true;
		const done = new AbortController();
		const release = () => {
			done.abort();
			releasing = false;
			behind.setNestedDrag(null);
		};
		window.addEventListener('pointerup', release, { signal: done.signal });
		window.addEventListener('pointercancel', release, { signal: done.signal });
	}
</script>

<DrawerPrimitive.NestedRoot
	{shouldScaleBackground}
	bind:open
	bind:activeSnapPoint
	onDrag={drag}
	{...restProps}
/>
