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
	}: WithoutChildrenOrChild<AlertDialogPrimitive.ActionProps> & {
		class?: string;
		children?: Snippet;
	} = $props();
</script>

<AlertDialogPrimitive.Action
	bind:ref
	class={cn(buttonVariants({ variant: 'primary' }), className)}
	{...restProps}
>
	<span class="relative z-10 inline-flex items-center gap-2">{@render children?.()}</span>
</AlertDialogPrimitive.Action>
