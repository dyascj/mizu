<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLOlAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...rest
	}: HTMLOlAttributes & {
		class?: string;
		ref?: HTMLOListElement | null;
		children?: Snippet;
	} = $props();
</script>

<ol bind:this={ref} class={cn('relative flex flex-col', className)} {...rest}>
	{@render children?.()}
</ol>
