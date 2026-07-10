<script lang="ts">
	import { Select as SelectPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		sideOffset = 6,
		children,
		...restProps
	}: WithoutChildrenOrChild<SelectPrimitive.ContentProps> & {
		class?: string;
		children: Snippet;
	} = $props();
</script>

<SelectPrimitive.Portal>
	<SelectPrimitive.Content
		bind:ref
		{sideOffset}
		class={cn(
			'z-50 max-h-72 overflow-hidden rounded-xl bg-popover dark:border dark:border-border p-1 text-popover-foreground shadow-lg transition-[opacity,transform] duration-150 data-[state=closed]:opacity-0 data-[state=closed]:scale-95 data-[state=open]:opacity-100 data-[state=open]:scale-100',
			className
		)}
		{...restProps}
	>
		<SelectPrimitive.Viewport class="w-full min-w-[var(--bits-select-anchor-width)]">
			{@render children?.()}
		</SelectPrimitive.Viewport>
	</SelectPrimitive.Content>
</SelectPrimitive.Portal>
