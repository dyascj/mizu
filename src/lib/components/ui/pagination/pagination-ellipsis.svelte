<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { Ellipsis } from '@lucide/svelte';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: HTMLAttributes<HTMLSpanElement> & {
		ref?: HTMLSpanElement | null;
		class?: string;
	} = $props();
</script>

<span
	bind:this={ref}
	aria-hidden="true"
	class={cn('flex size-9 items-center justify-center text-muted-foreground', className)}
	{...restProps}
>
	<Ellipsis class="size-4" />
	<span class="sr-only">More pages</span>
</span>
