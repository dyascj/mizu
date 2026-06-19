<script lang="ts">
	import type { Snippet } from 'svelte';
	import { AlertDialog as AlertDialogPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import { buttonVariants } from '$lib/components/ui/button';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithoutChildrenOrChild<AlertDialogPrimitive.CancelProps> & {
		class?: string;
		children?: Snippet;
	} = $props();
</script>

<AlertDialogPrimitive.Cancel
	bind:ref
	class={cn(buttonVariants({ variant: 'outline' }), className)}
	{...restProps}
>
	<span class="relative z-10 inline-flex items-center gap-2">{@render children?.()}</span>
</AlertDialogPrimitive.Cancel>
