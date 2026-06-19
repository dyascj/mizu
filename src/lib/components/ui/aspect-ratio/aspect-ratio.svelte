<script lang="ts">
	import { AspectRatio as AspectRatioPrimitive } from 'bits-ui';

	let {
		ref = $bindable(null),
		ratio = 1,
		children,
		...restProps
	}: AspectRatioPrimitive.RootProps = $props();
</script>

<AspectRatioPrimitive.Root bind:ref {ratio} {...restProps}>
	{@render children?.()}
</AspectRatioPrimitive.Root>
