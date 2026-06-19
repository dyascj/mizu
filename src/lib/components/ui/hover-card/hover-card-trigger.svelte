<script lang="ts">
	import { LinkPreview as HoverCardPrimitive, type WithoutChild } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChild<HoverCardPrimitive.TriggerProps> & { class?: string } = $props();
</script>

<HoverCardPrimitive.Trigger bind:ref class={cn(className)} {...restProps} />
