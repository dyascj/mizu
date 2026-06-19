<script lang="ts">
	import { Dialog as DialogPrimitive, type WithoutChild } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChild<DialogPrimitive.CloseProps> & { class?: string } = $props();
</script>

<DialogPrimitive.Close bind:ref class={cn(className)} {...restProps} />
