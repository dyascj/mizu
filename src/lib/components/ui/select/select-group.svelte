<script lang="ts">
	import { Select as SelectPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: SelectPrimitive.GroupProps & { class?: string } = $props();
</script>

<SelectPrimitive.Group bind:ref class={cn(className)} {...restProps} />
