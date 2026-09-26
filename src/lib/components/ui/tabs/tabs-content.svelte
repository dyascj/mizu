<script lang="ts">
	import { Tabs as TabsPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';
	import { getTabsRootState } from './context.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithoutChildrenOrChild<TabsPrimitive.ContentProps> & {
		class?: string;
		children: Snippet;
	} = $props();

	const root = getTabsRootState();
	// Nothing animates on first paint; after a change the panel slides a hair in
	// from the side the reader moved toward, resolving from a soft blur.
	const direction = $derived(root?.direction ?? 0);
</script>

<TabsPrimitive.Content
	bind:ref
	class={cn(
		'mt-3 outline-none',
		direction !== 0 &&
			'animate-[mizu-tab-enter_var(--duration-base)_var(--ease-out)_both] motion-reduce:[--tab-blur:0px] motion-reduce:[--tab-distance:0px]',
		// A class rather than an inline style, so a consumer's `style` stays theirs.
		direction > 0 && '[--tab-direction:1]',
		direction < 0 && '[--tab-direction:-1]',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</TabsPrimitive.Content>

<style>
	@keyframes -global-mizu-tab-enter {
		from {
			opacity: 0;
			translate: calc(var(--tab-direction, 0) * var(--tab-distance, 8px)) 0;
			filter: blur(var(--tab-blur, 4px));
		}
	}
</style>
