<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: HTMLAttributes<HTMLDivElement> & { ref?: HTMLDivElement | null } = $props();
</script>

<div
	bind:this={ref}
	role="none"
	data-slot="sidebar-separator"
	data-sidebar="separator"
	class={cn('bg-sidebar-border mx-2 h-px w-auto shrink-0', className)}
	{...restProps}
></div>
