<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { blurIn, duration, stagger } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** True while the data is on its way. False swaps the skeleton for the content. */
		loading: boolean;
		/**
		 * Place in a sequence of swaps. Each waits one stagger step longer, so a
		 * card resolves top to bottom, the order it is read in.
		 */
		index?: number;
		/**
		 * The placeholder, built from `Skeleton` blocks sized to the exact box
		 * the content will fill. Both share one grid cell, so if they ever
		 * disagreed the layout would jump when the data arrives.
		 */
		skeleton: Snippet;
		/** The loaded content. */
		children: Snippet;
		/** The wrapper element. */
		ref?: HTMLDivElement | null;
		class?: string;
	};

	let {
		loading,
		index = 0,
		skeleton,
		children,
		ref = $bindable(null),
		class: className,
		...rest
	}: Props = $props();

	const delay = $derived(Math.max(0, index) * stagger);

	/** The skeleton fades out under the arriving content. */
	function leave(_node: Element, { delay }: { delay: number }) {
		return { delay, duration: duration.fast, css: (t: number) => `opacity: ${t}` };
	}
</script>

<div bind:this={ref} aria-busy={loading} class={cn('grid', className)} {...rest}>
	<!-- Coming back on reload, the skeleton appears at once: the old content
	     is already gone, and a slow fade would leave a blank card for a beat. -->
	{#if loading}
		<div aria-hidden="true" class="col-start-1 row-start-1" out:leave={{ delay }}>
			{@render skeleton()}
		</div>
	{:else}
		<div
			class="col-start-1 row-start-1"
			in:blurIn={{ delay, duration: duration.base, blur: 4, y: 2 }}
		>
			{@render children()}
		</div>
	{/if}
</div>
