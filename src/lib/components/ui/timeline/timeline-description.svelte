<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...rest
	}: HTMLAttributes<HTMLParagraphElement> & {
		class?: string;
		ref?: HTMLParagraphElement | null;
		children?: Snippet;
	} = $props();
</script>

<p bind:this={ref} class={cn('text-sm text-muted-foreground', className)} {...rest}>
	{@render children?.()}
</p>
