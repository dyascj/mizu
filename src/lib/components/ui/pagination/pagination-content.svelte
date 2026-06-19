<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: HTMLAttributes<HTMLUListElement> & {
		ref?: HTMLUListElement | null;
		class?: string;
		children: Snippet;
	} = $props();
</script>

<ul bind:this={ref} class={cn('flex flex-row items-center gap-1', className)} {...restProps}>
	{@render children?.()}
</ul>
