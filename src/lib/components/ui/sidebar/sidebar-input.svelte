<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import SearchIcon from '@lucide/svelte/icons/search';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		value = $bindable(''),
		class: className,
		children,
		...restProps
	}: Omit<HTMLInputAttributes, 'children'> & {
		ref?: HTMLInputElement | null;
		value?: string | null;
		/** Trailing content inside the field, such as a `Kbd` shortcut hint. */
		children?: Snippet;
	} = $props();
</script>

<!-- The search field from the docs: the whole well takes the click, and focus
     lifts its edge and icon instead of drawing a ring. -->
<label
	data-slot="sidebar-input"
	data-sidebar="input"
	class={cn(
		'border-border bg-secondary/50 text-muted-foreground focus-within:border-border-strong focus-within:text-foreground flex h-9 w-full min-w-0 items-center gap-2 rounded-xl border px-3 transition-colors duration-(--duration-fast)',
		'group-data-[collapsible=icon]:hidden',
		className
	)}
>
	<SearchIcon class="size-4 shrink-0" aria-hidden="true" />
	<input
		bind:this={ref}
		bind:value
		type="search"
		class="text-foreground placeholder:text-muted-foreground h-full min-w-0 flex-1 bg-transparent text-sm outline-none [&::-webkit-search-cancel-button]:hidden"
		{...restProps}
	/>
	{@render children?.()}
</label>
