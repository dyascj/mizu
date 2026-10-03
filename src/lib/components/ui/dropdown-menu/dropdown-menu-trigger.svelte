<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
	import { getMenuDirection } from './dropdown-menu.svelte';

	let { ref = $bindable(null), ...restProps }: DropdownMenuPrimitive.TriggerProps = $props();

	// The menu reads its direction from here when it opens.
	const direction = getMenuDirection();
	$effect(() => {
		if (direction) direction.trigger = ref;
	});
</script>

<DropdownMenuPrimitive.Trigger bind:ref {...restProps} />
