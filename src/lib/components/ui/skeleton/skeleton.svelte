<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...rest
	}: HTMLAttributes<HTMLDivElement> & { ref?: HTMLDivElement | null; class?: string } = $props();
</script>

<div bind:this={ref} class={cn('bg-muted/70 animate-pulse rounded-md', className)} {...rest}></div>
