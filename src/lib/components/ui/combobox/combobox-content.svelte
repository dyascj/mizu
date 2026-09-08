<script lang="ts">
	import { Combobox as ComboboxPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { getComboboxContext } from './context.js';
	import { cn } from '$lib/utils.js';

	const uid = $props.id();
	let {
		id = `mizu-combobox-${uid}`,
		ref = $bindable(null),
		class: className,
		sideOffset = 6,
		portalProps,
		children,
		...restProps
	}: WithoutChildrenOrChild<ComboboxPrimitive.ContentProps> & {
		class?: string;
		portalProps?: ComboboxPrimitive.PortalProps;
		children: Snippet;
	} = $props();
	const context = getComboboxContext();
	$effect(() => {
		if (context) context.contentId = ref?.id;
	});
</script>

<ComboboxPrimitive.Portal {...portalProps}>
	<ComboboxPrimitive.Content
		bind:ref
		{id}
		aria-label="Suggestions"
		{sideOffset}
		class={cn(
			'bg-popover text-popover-foreground z-50 max-h-72 w-[var(--bits-combobox-anchor-width)] min-w-[var(--bits-combobox-anchor-width)] overflow-y-auto rounded-xl p-1 shadow-lg transition-[opacity,transform] duration-200 data-[state=closed]:scale-95 data-[state=closed]:opacity-0 data-[state=open]:scale-100 data-[state=open]:opacity-100',
			className
		)}
		{...restProps}
	>
		{#snippet child({ props, wrapperProps })}
			<div {...wrapperProps}>
				<div {...props} {id}>
					<ComboboxPrimitive.Viewport>
						{@render children?.()}
					</ComboboxPrimitive.Viewport>
				</div>
			</div>
		{/snippet}
	</ComboboxPrimitive.Content>
</ComboboxPrimitive.Portal>
