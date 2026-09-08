<script lang="ts">
	import { Select as SelectPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { getSelectContext } from './context.js';
	import { cn } from '$lib/utils.js';

	const uid = $props.id();
	let {
		id = `mizu-select-${uid}`,
		ref = $bindable(null),
		class: className,
		sideOffset = 6,
		children,
		...restProps
	}: WithoutChildrenOrChild<SelectPrimitive.ContentProps> & {
		class?: string;
		children: Snippet;
	} = $props();
	const context = getSelectContext();
	$effect(() => {
		if (context) context.contentId = ref?.id;
	});
</script>

<SelectPrimitive.Portal>
	<SelectPrimitive.Content
		bind:ref
		{id}
		aria-label="Options"
		{sideOffset}
		class={cn(
			'bg-popover text-popover-foreground z-50 max-h-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl p-1 shadow-lg transition-[opacity,transform] duration-200 data-[state=closed]:scale-95 data-[state=closed]:opacity-0 data-[state=open]:scale-100 data-[state=open]:opacity-100',
			className
		)}
		{...restProps}
	>
		{#snippet child({ props, wrapperProps })}
			<div {...wrapperProps}>
				<div {...props} {id}>
					<SelectPrimitive.Viewport class="w-full min-w-[var(--bits-select-anchor-width)]">
						{@render children?.()}
					</SelectPrimitive.Viewport>
				</div>
			</div>
		{/snippet}
	</SelectPrimitive.Content>
</SelectPrimitive.Portal>
