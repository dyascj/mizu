<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...rest
	}: HTMLAttributes<HTMLDivElement> & { ref?: HTMLDivElement | null; class?: string } = $props();
</script>

<div bind:this={ref} class={cn('animate-pulse rounded-md bg-muted/70', className)} {...rest}></div>
