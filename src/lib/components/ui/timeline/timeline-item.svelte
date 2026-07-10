<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLLiAttributes } from 'svelte/elements';
	import type { Component } from 'svelte';
	import type { LucideProps } from '@lucide/svelte';
	import { cn } from '$lib/utils.js';
	import Marker from './timeline-marker.svelte';

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
</script>

<li bind:this={ref} class={cn('relative pl-9 pb-6 last:pb-0', className)} {...rest}>
	<!-- The vertical rail this item's marker sits on. -->
	{#if !last}
		<span
			aria-hidden="true"
			class="pointer-events-none absolute top-3 bottom-0 left-[0.4375rem] w-px -translate-x-1/2 bg-border"
		></span>
	{/if}
	<Marker {icon} />
	<div class="flex flex-col gap-0.5">
		{@render children?.()}
	</div>
</li>
