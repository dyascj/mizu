<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { TransitionConfig } from 'svelte/transition';
	import {
		duration as durations,
		easeIn,
		easeOut,
		prefersReducedMotion
	} from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';
	import { getDynamicIslandState, type IslandShape } from './context.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** Shows this activity while the island's `activity` matches it. */
		name: string;
		/**
		 * `pill` keeps the corners at half the height. `card` settles on a softer
		 * corner, for expanded activities with more than one line.
		 */
		shape?: IslandShape;
		/**
		 * Announced to screen readers when this activity takes over, such as
		 * "Agent running, drafting the report". Later changes are not announced,
		 * so a ticking clock stays quiet.
		 */
		label?: string;
		/** The content element, while on show. */
		ref?: HTMLDivElement | null;
		/**
		 * Classes for the content. The island sizes itself to it, so set a width
		 * here when the content should truncate rather than grow.
		 */
		class?: string;
		/** What the activity shows. */
		children: Snippet;
	};

	let {
		name,
		shape = 'pill',
		label,
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: Props = $props();

	const island = getDynamicIslandState();

	$effect(() => island.register(name, () => label));

	const active = $derived(island.activity === name);

	// Each activity is laid out at its own final size and centered, so text
	// never reflows while the island morphs around it; the island clips it until
	// the shape catches up. The old content clears out fast and the new one waits
	// a beat, so the two never read as overlapping text.
	function enter(_node: Element): TransitionConfig {
		const reduce = prefersReducedMotion();
		return {
			delay: durations.instant,
			duration: durations.base,
			easing: easeOut,
			css: (t, u) =>
				reduce ? `opacity: ${t}` : `opacity: ${t}; filter: blur(${u * 4}px); scale: ${1 - u * 0.05}`
		};
	}

	function leave(node: HTMLElement): TransitionConfig {
		// Leaving content must never catch a click or focus meant for the new one.
		node.setAttribute('inert', '');
		node.setAttribute('aria-hidden', 'true');
		const reduce = prefersReducedMotion();
		return {
			duration: durations.instant,
			easing: easeIn,
			css: (t, u) => (reduce ? `opacity: ${t}` : `opacity: ${t}; filter: blur(${u * 4}px)`)
		};
	}
</script>

{#if active}
	<div
		{...restProps}
		bind:this={ref}
		{@attach (node) => island.track(node, shape)}
		in:enter
		out:leave
		class={cn(
			'col-start-1 row-start-1 flex h-10 w-max max-w-[100cqw] items-center gap-3 px-4 text-sm',
			className
		)}
	>
		{@render children()}
	</div>
{/if}
