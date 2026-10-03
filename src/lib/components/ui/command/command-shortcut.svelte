<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	let {
		class: className,
		children,
		...restProps
	}: HTMLAttributes<HTMLSpanElement> & { class?: string; children: Snippet } = $props();
</script>

<span class={cn('text-muted-foreground ms-auto text-xs tracking-widest', className)} {...restProps}>
	{@render children?.()}
</span>
