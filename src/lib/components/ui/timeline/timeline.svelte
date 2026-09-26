<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import type { HTMLOlAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';
	import { setTimelineState } from './context.js';

	let {
		ref = $bindable(null),
		class: className,
		animated = true,
		children,
		...rest
	}: HTMLOlAttributes & {
		class?: string;
		ref?: HTMLOListElement | null;
		/**
		 * Items added after the timeline first renders open their own height
		 * and come into focus, so the line grows down to meet them. Items
		 * present on first render never animate.
		 */
		animated?: boolean;
		children?: Snippet;
	} = $props();

	let mounted = $state(false);
	onMount(() => {
		mounted = true;
	});

	setTimelineState({
		get animateNewItems() {
			return mounted && animated;
		}
	});
</script>

<ol bind:this={ref} class={cn('relative flex flex-col', className)} {...rest}>
	{@render children?.()}
</ol>
