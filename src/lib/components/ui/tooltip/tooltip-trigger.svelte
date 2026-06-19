<script lang="ts">
	import { Tooltip as TooltipPrimitive, type WithoutChild } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChild<TooltipPrimitive.TriggerProps> & { class?: string } = $props();
</script>

<TooltipPrimitive.Trigger bind:ref class={cn(className)} {...restProps} />
