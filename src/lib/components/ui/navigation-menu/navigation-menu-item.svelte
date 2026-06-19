<script lang="ts">
	import { NavigationMenu as NavigationMenuPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: NavigationMenuPrimitive.ItemProps & { class?: string } = $props();
</script>

<NavigationMenuPrimitive.Item bind:ref class={cn('relative', className)} {...restProps} />
