<script lang="ts">
	import { untrack, type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { TransitionConfig } from 'svelte/transition';
	import {
		duration,
		easeOut,
		prefersReducedMotion,
		stagger as staggerStep
	} from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLSpanElement>, 'children' | 'color'> & {
		/** The color to paint the surface. Changing it pours the new color in over the old. */
		color: string;
		/**
		 * Where the new color pours in from, as a fraction of the width: 0 is
		 * the left edge and 1 the right. Pass the picked swatch's position in
		 * its row so the color arrives from the side the swatch sits on.
		 */
		origin?: number;
		/**
		 * The surface's place in reading order. Each step waits one stagger
		 * before pouring, so the color runs through a preview the way you read it.
		 */
		order?: number;
		/** The surface element. */
		ref?: HTMLSpanElement | null;
		/** Classes for the surface, such as its shape and size. */
		class?: string;
		/** Content that sits on top of the color. */
		children?: Snippet;
	};

	let {
		color,
		origin = 0.5,
		order = 0,
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: Props = $props();

	type Layer = { id: number; color: string; origin: number };

	/** The most layers stacked at once: the settled color plus the pours still spreading over it. */
	const MAX_LAYERS = 4;

	let nextId = 1;
	/**
	 * Bottom to top. The bottom layer is always settled: the first color is
	 * painted outright, and a finished pour drops everything under it. The
	 * layers above it are still pouring.
	 */
	let layers = $state<Layer[]>(untrack(() => [{ id: 0, color, origin }]));

	// Each new color spreads over the ones before as a growing circle. Rapid
	// picks stack up over the settled bottom layer, so the surface is never
	// uncovered. If the stack fills, the oldest pours in between give way.
	$effect.pre(() => {
		const next = { id: nextId, color, origin };
		untrack(() => {
			if (layers.at(-1)?.color === next.color) return;
			nextId += 1;
			const kept =
				layers.length < MAX_LAYERS ? layers : [layers[0], ...layers.slice(-(MAX_LAYERS - 2))];
			layers = [...kept, next];
		});
	});

	/** A finished pour covers the whole surface, so everything under it can go. */
	function landed(id: number) {
		const at = layers.findIndex((layer) => layer.id === id);
		if (at > 0) layers = layers.slice(at);
	}

	function pour(node: Element, layer: Layer): TransitionConfig {
		const delay = order * staggerStep;
		if (typeof (node as HTMLElement).animate !== 'function') return {};
		if (prefersReducedMotion()) {
			return { delay, duration: duration.fast, css: (t) => `opacity: ${t}` };
		}
		const at = `${layer.origin * 100}% 50%`;
		// 150% of the reference radius clears the far corner of any of these
		// shapes, even from an edge.
		return {
			delay,
			duration: duration.slow,
			easing: easeOut,
			css: (t) => `clip-path: circle(${t * 150}% at ${at})`
		};
	}
</script>

<span
	{...restProps}
	bind:this={ref}
	data-slot="color-swatches-flood"
	class={cn('relative isolate overflow-hidden', className)}
>
	{#each layers as layer (layer.id)}
		<span
			aria-hidden="true"
			class="absolute inset-0 -z-10"
			style:background-color={layer.color}
			in:pour={layer}
			onintroend={() => landed(layer.id)}
		></span>
	{/each}
	{@render children?.()}
</span>
