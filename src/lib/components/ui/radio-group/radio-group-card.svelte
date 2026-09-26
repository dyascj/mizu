<script lang="ts">
	import { RadioGroup as RadioGroupPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import type { TransitionConfig } from 'svelte/transition';
	import { prefersReducedMotion, springs } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';
	import { getRadioGroupState } from './context.js';

	type Props = WithoutChildrenOrChild<RadioGroupPrimitive.ItemProps> & {
		/** The card element. */
		ref?: HTMLElement | null;
		/** Classes for the card. */
		class?: string;
		/**
		 * What the option offers, beside the dot: a title, a line of detail, a
		 * price. It also names the option for screen readers.
		 */
		children?: Snippet;
	};

	let {
		ref = $bindable(null),
		class: className,
		children: content,
		...restProps
	}: Props = $props();

	const group = getRadioGroupState();

	/**
	 * The selection ring glides over from the card that had it, resizing on the
	 * way when cards differ in height, instead of vanishing and reappearing.
	 */
	function glide(node: HTMLElement): TransitionConfig {
		const from = group?.previousRing;
		if (!from || prefersReducedMotion()) return { duration: 0 };
		const to = node.getBoundingClientRect();
		const dx = from.left - to.left;
		const dy = from.top - to.top;
		const dw = from.width - to.width;
		const dh = from.height - to.height;
		const { duration, easing } = springs.snappy;
		return {
			duration,
			easing,
			css: (_t, u) =>
				`translate: ${dx * u}px ${dy * u}px; width: calc(100% + ${dw * u}px); height: calc(100% + ${dh * u}px)`
		};
	}
</script>

<RadioGroupPrimitive.Item
	bind:ref
	class={cn(
		'group/card bg-card text-card-foreground focus-visible:ring-ring focus-visible:ring-offset-background relative flex w-full touch-manipulation items-center gap-4 rounded-2xl p-4 text-left shadow-sm outline-none select-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
		// 0.98 rather than 0.96: on a card this wide, 4% moves its edges far enough to read as a lurch.
		'hover:bg-secondary transition-[scale,background-color] duration-(--duration-fast) ease-out active:scale-[0.98] disabled:active:scale-100 motion-reduce:transition-[background-color]',
		// The ring lives in the picked card, so lifting that card keeps the ring
		// above its neighbours as it slides across them.
		'data-[state=checked]:z-10',
		className
	)}
	{...restProps}
>
	{#snippet children({ checked })}
		{#if checked}
			<span
				aria-hidden="true"
				data-slot="radio-card-ring"
				class="border-primary pointer-events-none absolute top-0 left-0 size-full rounded-[inherit] border-2"
				in:glide
			></span>
		{/if}
		<span
			aria-hidden="true"
			class={cn(
				'relative grid size-5 shrink-0 place-items-center rounded-full border transition-[border-color] duration-(--duration-fast) ease-out',
				checked ? 'border-transparent' : 'border-input bg-control'
			)}
		>
			<!-- Covers the border too, so the filled dot is exactly the dot. Starts
			     at half size, never zero: it grows out of the dot's own center. -->
			<span
				class={cn(
					'bg-primary absolute -inset-px rounded-full',
					checked
						? 'scale-100 opacity-100 [transition:scale_var(--duration-spring-bouncy)_var(--ease-spring-bouncy),opacity_var(--duration-fast)_var(--ease-out)]'
						: 'scale-50 opacity-0 transition-[scale,opacity] duration-(--duration-fast) ease-in'
				)}
			></span>
			<svg
				viewBox="0 0 16 16"
				fill="none"
				stroke="currentColor"
				stroke-width="2.25"
				stroke-linecap="round"
				stroke-linejoin="round"
				class={cn(
					'text-primary-foreground relative size-3',
					checked
						? 'scale-100 opacity-100 blur-none [transition:scale_var(--duration-spring-snappy)_var(--ease-spring-snappy),opacity_var(--duration-fast)_var(--ease-out),filter_var(--duration-fast)_var(--ease-out)]'
						: 'scale-25 opacity-0 blur-[4px] transition-[scale,opacity,filter] duration-(--duration-fast) ease-in'
				)}
			>
				<path d="m3.5 8.5 3 3 6-7" />
			</svg>
		</span>
		<span class="flex min-w-0 flex-1 items-center gap-4">
			{@render content?.()}
		</span>
	{/snippet}
</RadioGroupPrimitive.Item>
