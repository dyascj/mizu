<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = HTMLAnchorAttributes & {
		/** Where the link goes. */
		href?: string;
		/**
		 * `hover` draws the line only while the link is hovered or focused, for
		 * navigation. `always` keeps a faint line at rest so the link reads as one
		 * inside prose, then draws the full line over it.
		 */
		underline?: 'hover' | 'always';
		/** The anchor element. */
		ref?: HTMLAnchorElement | null;
		/** Classes for the anchor. */
		class?: string;
		/** The link text. */
		children: Snippet;
	};

	let {
		underline = 'hover',
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: Props = $props();

	type Side = 'left' | 'right';

	// Edge insets (left, right) for each resting place of the line. Hidden "at"
	// a side means collapsed against that edge, so drawing from there grows away
	// from it and erasing toward it shrinks into it.
	const hiddenAt: Record<Side, [string, string]> = { left: ['0%', '100%'], right: ['100%', '0%'] };
	const shown: [string, string] = ['0%', '0%'];

	/** True once the line has fully gone, the only time it may jump to the other edge. */
	let gone = true;
	let hovered = false;

	function place(el: HTMLElement, [left, right]: [string, string]) {
		el.style.setProperty('--line-left', left);
		el.style.setProperty('--line-right', right);
	}

	function draw(el: HTMLElement, from: Side) {
		if (gone) {
			// Collapse against the entry edge without a transition, then commit it
			// so the line grows away from that edge instead of sweeping across.
			el.dataset.instant = '';
			place(el, hiddenAt[from]);
			void el.offsetWidth;
			delete el.dataset.instant;
		}
		// Mid-exit, the line simply reverses from wherever it is.
		gone = false;
		delete el.dataset.leaving;
		el.dataset.drawn = '';
		place(el, shown);
	}

	function erase(el: HTMLElement, toward: Side) {
		el.dataset.leaving = '';
		delete el.dataset.drawn;
		place(el, hiddenAt[toward]);
	}

	const rtl = (el: HTMLElement) => getComputedStyle(el).direction === 'rtl';

	function sideOf(el: HTMLElement, clientX: number): Side {
		const box = el.getBoundingClientRect();
		return clientX < box.left + box.width / 2 ? 'left' : 'right';
	}
</script>

<a
	{...restProps}
	bind:this={ref}
	data-underline={underline}
	onpointerenter={(event) => {
		restProps.onpointerenter?.(event);
		if (event.pointerType === 'touch') return;
		hovered = true;
		draw(event.currentTarget, sideOf(event.currentTarget, event.clientX));
	}}
	onpointerleave={(event) => {
		restProps.onpointerleave?.(event);
		if (event.pointerType === 'touch') return;
		hovered = false;
		// Keyboard focus still owns the line.
		if (event.currentTarget.matches(':focus-visible')) return;
		erase(event.currentTarget, sideOf(event.currentTarget, event.clientX));
	}}
	onfocus={(event) => {
		restProps.onfocus?.(event);
		// Reading order: a focused link underlines from the start of its text.
		if (event.currentTarget.matches(':focus-visible'))
			draw(event.currentTarget, rtl(event.currentTarget) ? 'right' : 'left');
	}}
	onblur={(event) => {
		restProps.onblur?.(event);
		if (!hovered) erase(event.currentTarget, rtl(event.currentTarget) ? 'left' : 'right');
	}}
	ontransitionend={(event) => {
		restProps.ontransitionend?.(event);
		if (event.target !== event.currentTarget || !event.propertyName.startsWith('--line')) return;
		const style = event.currentTarget.style;
		gone =
			style.getPropertyValue('--line-left') === '100%' ||
			style.getPropertyValue('--line-right') === '100%';
	}}
	class={cn(
		'mizu-link text-foreground focus-visible:ring-ring focus-visible:ring-offset-background rounded-xs outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
		// Navigation stays on one line. Prose links wrap with the sentence, and
		// the line runs across every line the link breaks onto.
		underline === 'always' ? 'inline' : 'inline-block leading-tight whitespace-nowrap',
		className
	)}
>
	{@render children()}
</a>

<style>
	/* Registered so the edges transition, and a partial line can reverse from
	   wherever it is. Browsers without @property simply jump. */
	@property --line-left {
		syntax: '<percentage>';
		inherits: false;
		initial-value: 0%;
	}
	@property --line-right {
		syntax: '<percentage>';
		inherits: false;
		initial-value: 100%;
	}

	/* The drawn line is a background clipped between two edges rather than a
	   pseudo-element, so it follows the text across line breaks. */
	.mizu-link {
		background-image: linear-gradient(
			to right,
			transparent var(--line-left),
			currentColor var(--line-left),
			currentColor calc(100% - var(--line-right)),
			transparent calc(100% - var(--line-right))
		);
		background-position: 0 100%;
		background-repeat: no-repeat;
		background-size: 100% 1px;
		transition:
			--line-left var(--duration-base) var(--ease-out),
			--line-right var(--duration-base) var(--ease-out);
	}

	/* The resting hairline, for prose where a link must look like one. */
	.mizu-link[data-underline='always'] {
		background-image:
			linear-gradient(
				to right,
				transparent var(--line-left),
				currentColor var(--line-left),
				currentColor calc(100% - var(--line-right)),
				transparent calc(100% - var(--line-right))
			),
			linear-gradient(
				color-mix(in oklab, currentColor 25%, transparent),
				color-mix(in oklab, currentColor 25%, transparent)
			);
	}

	.mizu-link[data-leaving] {
		transition-duration: var(--duration-fast);
		transition-timing-function: var(--ease-in);
	}

	.mizu-link[data-instant] {
		transition: none;
	}

	/* The current page keeps its line. */
	.mizu-link[aria-current='page'] {
		--line-left: 0% !important;
		--line-right: 0% !important;
	}
</style>
