<script lang="ts">
	import { Popover as PopoverPrimitive, type WithoutChild } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChild<PopoverPrimitive.TriggerProps> & { class?: string } = $props();
</script>

<PopoverPrimitive.Trigger bind:ref class={cn(className)} {...restProps} />
