<script lang="ts">
	import { Command as CommandPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		value = $bindable(''),
		class: className,
		children,
		...restProps
	}: WithoutChildrenOrChild<CommandPrimitive.RootProps> & {
		class?: string;
		children: Snippet;
	} = $props();
</script>

<CommandPrimitive.Root
	bind:ref
	bind:value
	class={cn(
		'gloss flex h-full w-full flex-col overflow-hidden rounded-xl glass-strong text-popover-foreground shadow-[inset_0_1px_0_color-mix(in_srgb,white_55%,transparent)]',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</CommandPrimitive.Root>
