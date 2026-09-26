<script lang="ts">
	import { Command as CommandPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithoutChildrenOrChild<CommandPrimitive.ItemProps> & {
		class?: string;
		children: Snippet;
	} = $props();
</script>

<!-- Inside Command.List one gliding pill draws the highlight, so the item keeps
     its own fill only for use outside a list. -->
<CommandPrimitive.Item
	bind:ref
	class={cn(
		'data-[selected]:bg-accent data-[selected]:text-accent-foreground relative flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 in-data-[highlight-glide]:data-[selected]:bg-transparent [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-4',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</CommandPrimitive.Item>
