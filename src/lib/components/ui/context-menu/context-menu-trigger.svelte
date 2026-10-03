<script lang="ts">
	import { ContextMenu as ContextMenuPrimitive } from 'bits-ui';
	import { getMenuDirection } from './context-menu.svelte';
	import { openPoint } from './origin.js';

	let { ref = $bindable(null), ...restProps }: ContextMenuPrimitive.TriggerProps = $props();

	// The menu reads its direction from here when it opens.
	const direction = getMenuDirection();
	$effect(() => {
		if (direction) direction.trigger = ref;
	});

	// Pointers open the menu where they click. Give the trigger `tabindex={0}`
	// and Shift F10 or the menu key opens it from the middle of the area, so
	// it still grows out of the place the reader is looking at.
	function openFromKeyboard(
		event: KeyboardEvent & { currentTarget: EventTarget & HTMLDivElement }
	) {
		restProps.onkeydown?.(event);
		if (event.defaultPrevented) return;
		if (!((event.key === 'F10' && event.shiftKey) || event.key === 'ContextMenu')) return;
		event.preventDefault();
		const box = event.currentTarget.getBoundingClientRect();
		event.currentTarget.dispatchEvent(
			new MouseEvent('contextmenu', {
				bubbles: true,
				cancelable: true,
				clientX: box.left + box.width / 2,
				clientY: box.top + box.height / 2
			})
		);
	}

	function remember(event: MouseEvent & { currentTarget: EventTarget & HTMLDivElement }) {
		restProps.oncontextmenu?.(event);
		openPoint.x = event.clientX;
		openPoint.y = event.clientY;
	}
</script>

<ContextMenuPrimitive.Trigger
	bind:ref
	{...restProps}
	onkeydown={openFromKeyboard}
	oncontextmenu={remember}
/>
