<script lang="ts">
	import { Command as CommandPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';
	import { highlightGlide } from './highlight-glide.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithoutChildrenOrChild<CommandPrimitive.ListProps> & {
		class?: string;
		children: Snippet;
	} = $props();
</script>

<!-- The list eases to the height of whatever the search leaves, and one pill
     glides between results as the keys or the pointer move. -->
<CommandPrimitive.List
	bind:ref
	class={cn(
		'[height:calc(var(--bits-command-list-height)_+_0.5rem)] max-h-80 scroll-py-1 overflow-y-auto overscroll-contain p-1 transition-[height] duration-(--duration-fast) ease-out motion-reduce:transition-none',
		className
	)}
	{...restProps}
>
	<CommandPrimitive.Viewport
		class="relative"
		{@attach highlightGlide('[data-command-item][data-selected]')}
	>
		<div
			aria-hidden="true"
			data-highlight-pill
			class="bg-accent pointer-events-none absolute top-0 left-0 rounded-lg opacity-0 transition-[translate,height,opacity] duration-(--duration-spring-snappy) ease-(--ease-spring-snappy)"
		></div>
		{@render children?.()}
	</CommandPrimitive.Viewport>
</CommandPrimitive.List>
