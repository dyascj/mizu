<script lang="ts">
	import { Combobox as ComboboxPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { getComboboxContext } from './context.js';
	import { highlightGlide } from './highlight-glide.js';
	import { scrollReach } from './scroll-reach.js';
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
	<!-- Grows from the edge touching the field. Enters in a blink, leaves faster.
	     The panel caps the height and the viewport inside it is the one scroller,
	     so the cap already counts the panel's padding. -->
	<ComboboxPrimitive.Content
		bind:ref
		{id}
		aria-label="Suggestions"
		{sideOffset}
		class={cn(
			'bg-popover text-popover-foreground z-50 max-h-80 w-[var(--bits-combobox-anchor-width)] min-w-[var(--bits-combobox-anchor-width)] origin-(--bits-combobox-content-transform-origin) overflow-hidden rounded-xl p-1 shadow-lg transition-[opacity,scale] duration-(--duration-fast) ease-out outline-none data-[starting-style]:opacity-0 data-[state=closed]:pointer-events-none data-[state=closed]:opacity-0 data-[state=closed]:duration-(--duration-instant) data-[state=closed]:ease-in motion-safe:data-[starting-style]:scale-[0.97] motion-safe:data-[state=closed]:scale-[0.97]',
			className
		)}
		{...restProps}
	>
		{#snippet child({ props, wrapperProps })}
			<div {...wrapperProps}>
				<div {...props} {id}>
					<ComboboxPrimitive.Viewport
						class="relative"
						{@attach highlightGlide('[data-combobox-item][data-highlighted]')}
						{@attach scrollReach}
					>
						<div
							aria-hidden="true"
							data-highlight-pill
							class="bg-accent pointer-events-none absolute top-0 left-0 rounded-lg opacity-0 transition-[translate,height,opacity] duration-(--duration-spring-snappy) ease-(--ease-spring-snappy)"
						></div>
						{@render children?.()}
					</ComboboxPrimitive.Viewport>
				</div>
			</div>
		{/snippet}
	</ComboboxPrimitive.Content>
</ComboboxPrimitive.Portal>
