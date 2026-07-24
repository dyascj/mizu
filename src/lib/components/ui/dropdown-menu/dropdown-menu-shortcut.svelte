<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: HTMLAttributes<HTMLSpanElement> & {
		ref?: HTMLSpanElement | null;
	} = $props();
</script>

<span
	bind:this={ref}
	class={cn('text-muted-foreground ml-auto text-xs tracking-widest', className)}
	{...restProps}
></span>
