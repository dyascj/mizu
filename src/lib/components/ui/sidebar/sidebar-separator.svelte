<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = HTMLAttributes<HTMLDivElement> & {
		class?: string;
		ref?: HTMLDivElement | null;
	};

	let { class: className, ref = $bindable(null), ...rest }: Props = $props();
</script>

<div
	bind:this={ref}
	role="none"
	data-slot="sidebar-separator"
	class={cn('mx-2 h-px shrink-0 bg-border', className)}
	{...rest}
></div>
