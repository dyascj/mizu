<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLTimeAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...rest
	}: HTMLTimeAttributes & {
		class?: string;
		ref?: HTMLTimeElement | null;
		children?: Snippet;
	} = $props();
</script>

<time
	bind:this={ref}
	class={cn('text-xs font-medium tracking-wide text-muted-foreground tabular-nums', className)}
	{...rest}
>
	{@render children?.()}
</time>
