<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLLiAttributes } from 'svelte/elements';
	import type { Component } from 'svelte';
	import type { LucideProps } from '@lucide/svelte';
	import { cn } from '$lib/utils.js';
	import { prefersReducedMotion } from '$lib/components/ui/motion';
	import Marker from './timeline-marker.svelte';
	import { getTimelineState } from './context.js';

	let {
		ref = $bindable(null),
		class: className,
		icon,
		last = false,
		children,
		...rest
	}: HTMLLiAttributes & {
		class?: string;
		ref?: HTMLLIElement | null;
		/** Optional lucide icon shown inside a card node instead of the plain dot. */
		icon?: Component<LucideProps>;
		/** Hide the connector line below this item (set on the final event). */
		last?: boolean;
		children?: Snippet;
	} = $props();

	const timeline = getTimelineState();
	/** Only items that arrive after the first render open in; read once, at mount. */
	let entering = $state(!!timeline?.animateNewItems && !prefersReducedMotion());
</script>

<!-- A single-row grid, so an arriving item can open from zero height to its
     content's and the rail inside it grows down to meet the item below. -->
<li
	bind:this={ref}
	class={cn('relative grid grid-rows-[1fr] pb-6 pl-9 last:pb-0', className)}
	class:timeline-enter={entering}
	{...rest}
	onanimationend={(event) => {
		rest.onanimationend?.(event);
		if (event.target === event.currentTarget) entering = false;
	}}
>
	<!-- The vertical rail this item's marker sits on. -->
	{#if !last}
		<span
			aria-hidden="true"
			class="bg-border pointer-events-none absolute top-3 bottom-0 left-[0.4375rem] w-px -translate-x-1/2"
		></span>
	{/if}
	<Marker {icon} />
	<div class="flex min-h-0 flex-col gap-0.5" class:timeline-reveal={entering}>
		{@render children?.()}
	</div>
</li>

<style>
	/* The row opens its own height while the words resolve just behind it, so
	   the space is there before they arrive. */
	.timeline-enter {
		overflow: clip;
		animation: timeline-open var(--duration-base) var(--ease-out) both;
	}

	.timeline-reveal {
		animation: timeline-reveal var(--duration-base) var(--ease-out) var(--stagger) both;
	}

	@keyframes timeline-open {
		from {
			grid-template-rows: 0fr;
			padding-bottom: 0;
			opacity: 0;
		}
	}

	@keyframes timeline-reveal {
		from {
			opacity: 0;
			filter: blur(4px);
			translate: 0 -6px;
		}
	}
</style>
