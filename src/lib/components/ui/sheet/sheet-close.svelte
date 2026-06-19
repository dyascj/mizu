<script lang="ts">
	import { Dialog as SheetPrimitive, type WithoutChild } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChild<SheetPrimitive.CloseProps> & { class?: string } = $props();
</script>

<SheetPrimitive.Close bind:ref class={cn(className)} {...restProps} />
