<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLLiAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: HTMLLiAttributes & {
		ref?: HTMLLIElement | null;
		class?: string;
		children: Snippet;
	} = $props();
</script>

<li bind:this={ref} class={cn('', className)} {...restProps}>
	{@render children?.()}
</li>
