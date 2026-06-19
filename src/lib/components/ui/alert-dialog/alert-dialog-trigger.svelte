<script lang="ts">
	import { AlertDialog as AlertDialogPrimitive, type WithoutChild } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChild<AlertDialogPrimitive.TriggerProps> & { class?: string } = $props();
</script>

<AlertDialogPrimitive.Trigger bind:ref class={cn(className)} {...restProps} />
