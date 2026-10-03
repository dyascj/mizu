<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { TransitionConfig } from 'svelte/transition';
	import {
		duration as durations,
		easeIn,
		easeOut,
		prefersReducedMotion
	} from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';
	import { getHoverCardGroup, type HoverCardPlace } from './hover-card-group.svelte';

	type Props = Omit<HTMLButtonAttributes, 'children'> & {
		/** Accessible name for the card, such as the person's name and handle. */
		label: string;
		/** The card's content. */
		card: Snippet;
		/** The trigger text, such as a handle. */
		children: Snippet;
		/** Classes for the card. */
		cardClass?: string;
		/** The trigger button. */
		ref?: HTMLButtonElement | null;
		/** Classes for the trigger button. */
		class?: string;
	};

	let {
		label,
		card,
		children,
		cardClass,
		ref = $bindable(null),
		class: className,
		onclick,
		onpointerdown,
		...restProps
	}: Props = $props();

	/** Close to a card's rendered height; only used to choose above or below. */
	const CARD_HEIGHT = 200;
	const GAP = 8;
	/** Keeps the card this far from the viewport edges. */
	const EDGE = 12;

	const group = getHoverCardGroup();
	const id = $props.id();
	const cardId = `${id}-card`;

	let root = $state<HTMLSpanElement | null>(null);
	let cardEl = $state<HTMLSpanElement | null>(null);
	let contentEl = $state<HTMLSpanElement | null>(null);
	let lastPointer = 'mouse';
	let returning = false;

	const shown = $derived(group.open?.id === id ? group.open : null);
	const isOpen = $derived(shown !== null);
	// Held so the card stays placed while it animates out.
	let lastPlace = $state<HoverCardPlace | null>(null);
	$effect.pre(() => {
		if (shown) lastPlace = shown.place;
	});
	const place = $derived(shown?.place ?? lastPlace);

	function measure(): HoverCardPlace {
		const rect = ref!.getBoundingClientRect();
		const below = window.innerHeight - rect.bottom;
		const side = below >= CARD_HEIGHT + GAP + EDGE || below >= rect.top ? 'bottom' : 'top';
		const width = Math.min(group.width, window.innerWidth - EDGE * 2);
		const centred = rect.left + rect.width / 2 - width / 2;
		const clamped = Math.min(Math.max(centred, EDGE), window.innerWidth - EDGE - width);
		// Scales out of the trigger itself, even when the card is pushed sideways.
		return { side, left: clamped - rect.left, originX: rect.left + rect.width / 2 - clamped };
	}

	// Plays the trip from where the previous card sat, on the independent
	// translate property so it never fights the entrance's scale. The contents
	// develop on arrival instead of swapping in place.
	$effect(() => {
		const from = shown?.from;
		const el = cardEl;
		const content = contentEl;
		if (!from || !el || !content) return;
		const to = el.getBoundingClientRect();
		const dx = from.left - to.left;
		const dy = from.top - to.top;
		const reduce = prefersReducedMotion();
		el.style.transition = 'none';
		el.style.translate = reduce ? '' : `${dx}px ${dy}px`;
		content.style.transition = 'none';
		content.style.opacity = '0';
		content.style.filter = reduce ? '' : 'blur(4px)';
		// Commits the starting frame, so the transitions run from it.
		void el.offsetWidth;
		el.style.transition = 'translate var(--duration-slow) var(--ease-out)';
		el.style.translate = '';
		content.style.transition =
			'opacity var(--duration-base) var(--ease-out), filter var(--duration-base) var(--ease-out)';
		content.style.opacity = '';
		content.style.filter = '';
	});

	// Taps have no hover, so a tap opens the card and a tap anywhere else closes it.
	$effect(() => {
		if (!isOpen) return;
		const onDown = (event: PointerEvent) => {
			if (!root?.contains(event.target as Node)) group.closeNow();
		};
		document.addEventListener('pointerdown', onDown);
		return () => document.removeEventListener('pointerdown', onDown);
	});

	// A card that follows another skips its entrance; the trip is the entrance.
	function cardIn(_node: Element): TransitionConfig {
		if (shown?.instant) return { duration: 0 };
		if (prefersReducedMotion()) return { duration: durations.fast, css: (t) => `opacity: ${t}` };
		return {
			duration: durations.fast,
			easing: easeOut,
			css: (t) => `opacity: ${t}; scale: ${0.96 + 0.04 * t}`
		};
	}
	// Faster than the entrance, and gone at once when another card takes over.
	function cardOut(_node: Element): TransitionConfig {
		if (group.open !== null) return { duration: 0 };
		const reduce = prefersReducedMotion();
		return {
			duration: durations.instant,
			easing: easeIn,
			css: (t) => (reduce ? `opacity: ${t}` : `opacity: ${t}; scale: ${0.96 + 0.04 * t}`)
		};
	}

	function focusVisible(el: Element) {
		try {
			return el.matches(':focus-visible');
		} catch {
			return true;
		}
	}
</script>

<span
	bind:this={root}
	class="relative inline-block"
	role="presentation"
	onpointerenter={(event) => {
		if (event.pointerType !== 'touch') group.requestOpen(id, measure);
	}}
	onpointerleave={(event) => {
		if (event.pointerType !== 'touch') group.requestClose(id);
	}}
	onfocusin={(event) => {
		// Keyboard focus only. A tap focuses the button too, and opening here
		// would let the click that follows close it again.
		if (ref && event.target === ref && !returning && focusVisible(ref))
			group.requestOpen(id, measure, true);
	}}
	onfocusout={(event) => {
		if (!event.currentTarget.contains(event.relatedTarget as Node | null)) group.requestClose(id);
	}}
	onkeydown={(event) => {
		if (event.key !== 'Escape' || !isOpen) return;
		event.stopPropagation();
		group.closeNow();
		// Focus comes home without reopening the card it just closed.
		returning = true;
		ref?.focus();
		returning = false;
	}}
>
	<button
		bind:this={ref}
		type="button"
		aria-expanded={isOpen}
		aria-controls={isOpen ? cardId : undefined}
		class={cn(
			'text-foreground decoration-foreground/25 hover:decoration-foreground aria-expanded:decoration-foreground focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm font-medium whitespace-nowrap underline decoration-1 underline-offset-4 transition-[text-decoration-color] duration-(--duration-fast) ease-out outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
			className
		)}
		onpointerdown={(event) => {
			lastPointer = event.pointerType;
			onpointerdown?.(event);
		}}
		onclick={(event) => {
			onclick?.(event);
			// A mouse has already opened it by hovering; taps and keys toggle.
			const toggles = event.detail === 0 || lastPointer === 'touch';
			if (isOpen && toggles) group.closeNow();
			else group.requestOpen(id, measure, true);
		}}
		{...restProps}
	>
		{@render children()}
	</button>

	{#if isOpen && place}
		<span
			bind:this={cardEl}
			{@attach (el) => group.setCard(el)}
			in:cardIn
			out:cardOut
			id={cardId}
			role="group"
			aria-label={label}
			class={cn(
				'bg-popover text-popover-foreground absolute z-50 block max-w-[calc(100vw-1.5rem)] rounded-2xl p-4 text-start text-sm font-normal whitespace-normal shadow-lg',
				// An invisible strip across the gap keeps the pointer inside while it
				// travels from the trigger to the card.
				"before:absolute before:inset-x-0 before:h-3 before:content-['']",
				place.side === 'bottom'
					? 'top-full mt-2 before:-top-3'
					: 'bottom-full mb-2 before:-bottom-3',
				cardClass
			)}
			style:width="{group.width}px"
			style:left="{place.left}px"
			style:transform-origin="{place.originX}px {place.side === 'bottom' ? '0%' : '100%'}"
		>
			<span bind:this={contentEl} class="block">{@render card()}</span>
		</span>
	{/if}
</span>
