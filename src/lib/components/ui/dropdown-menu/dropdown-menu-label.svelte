<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		inset,
		children,
		...restProps
	}: HTMLAttributes<HTMLDivElement> & {
		ref?: HTMLDivElement | null;
		inset?: boolean;
		children?: Snippet;
	} = $props();
</script>

<div
	bind:this={ref}
	data-slot="dropdown-menu-label"
	data-inset={inset ? '' : undefined}
	class={cn('px-2 py-1.5 text-xs font-semibold text-muted-foreground data-[inset]:pl-8', className)}
	{...restProps}
>
	{@render children?.()}
</div>
