<script lang="ts">
	import { Portal } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes } from 'svelte/elements';
	import type { TransitionConfig } from 'svelte/transition';
	import {
		duration as durations,
		easeIn,
		easeOut,
		prefersReducedMotion
	} from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';
	import { follower } from './follow.js';

	type Props = Omit<HTMLAnchorAttributes, 'title'> & {
		/** Where the link goes. */
		href: string;
		/** The linked page's title, shown in bold on the card. */
		title: string;
		/** Where it comes from, such as a domain or a publication. */
		source?: string;
		/** A line or two from the page, such as the passage a citation relies on. */
		description?: string;
		/** A thumbnail across the top of the card. */
		image?: Snippet;
		/** The link element. */
		ref?: HTMLAnchorElement | null;
		/** Classes for the link. */
		class?: string;
		/** Classes for the preview card. */
		cardClass?: string;
		/** The link text. */
		children: Snippet;
	};

	let {
		href,
		title,
		source,
		description,
		image,
		ref = $bindable(null),
		class: className,
		cardClass,
		children,
		...restProps
	}: Props = $props();

	/** Card width in pixels; matches `w-60` below. */
	const CARD = 240;
	/** Space between the link and the card. */
	const GAP = 10;
	/** Keeps the card this far inside the viewport. */
	const GUTTER = 8;
	/** Room the card needs above the link before it flips below. */
	const ROOM = 220;

	const uid = $props.id();
	let open = $state(false);
	let below = $state(false);
	/** The link's box, in viewport pixels, so the card can sit against it. */
	let anchor = $state({ top: 0, bottom: 0 });
	let card = $state<HTMLElement | null>(null);
	let lingerTimer: ReturnType<typeof setTimeout> | undefined;

	// The spring writes straight to the card, so trailing the pointer costs no
	// renders. Its lean comes from how fast it is travelling.
	let x = 0;
	let tilt = 0;
	const motion = follower((nextX, nextTilt) => {
		x = nextX;
		tilt = nextTilt;
		if (card) {
			card.style.translate = `${nextX}px 0`;
			card.style.rotate = `${nextTilt}deg`;
		}
	});

	/** A fresh card starts wherever the spring already is. */
	function placeCard(node: HTMLElement) {
		node.style.translate = `${x}px 0`;
		node.style.rotate = `${tilt}deg`;
	}

	/** Left edge that centers the card on `centerX`, kept inside the viewport. */
	function leftFor(centerX: number) {
		const max = document.documentElement.clientWidth - GUTTER - CARD;
		return Math.round(Math.max(GUTTER, Math.min(centerX - CARD / 2, max)));
	}

	function measure() {
		if (!ref) return;
		const box = ref.getBoundingClientRect();
		anchor = { top: box.top, bottom: box.bottom };
		return box;
	}

	/** Pointers place the card where they are; keyboard and touch center it on the link. */
	function show(clientX?: number) {
		const box = measure();
		if (!box) return;
		clearTimeout(lingerTimer);
		const left = leftFor(clientX ?? box.left + box.width / 2);
		if (!open) {
			// Appears where the pointer is, rather than sliding in from the last spot.
			below = box.top < ROOM;
			motion.jump(left);
			open = true;
		} else {
			motion.set(left);
		}
	}

	function hide() {
		clearTimeout(lingerTimer);
		open = false;
	}

	function onpointermove(event: PointerEvent) {
		if (event.pointerType === 'touch' || !open || prefersReducedMotion()) return;
		motion.set(leftFor(event.clientX));
	}

	// Scrolling carries the link away; the card stays pinned to it.
	$effect(() => {
		if (!open) return;
		window.addEventListener('scroll', measure, { capture: true, passive: true });
		window.addEventListener('resize', hide);
		return () => {
			window.removeEventListener('scroll', measure, { capture: true });
			window.removeEventListener('resize', hide);
		};
	});

	$effect(() => () => {
		motion.stop();
		clearTimeout(lingerTimer);
	});

	/** Rises out of the link with a little blur; reduced motion only fades. */
	function enter(_node: Element): TransitionConfig {
		const reduce = prefersReducedMotion();
		const lift = below ? -6 : 6;
		return {
			duration: durations.fast,
			easing: easeOut,
			css: (t, u) =>
				reduce
					? `opacity: ${t}`
					: `opacity: ${t}; scale: ${0.88 + 0.12 * t}; translate: 0 ${u * lift}px; filter: blur(${u * 4}px)`
		};
	}

	/** Leaves faster than it came, so it never holds the eye. */
	function leave(_node: Element): TransitionConfig {
		const reduce = prefersReducedMotion();
		return {
			duration: durations.instant,
			easing: easeIn,
			css: (t, u) =>
				reduce ? `opacity: ${t}` : `opacity: ${t}; scale: ${1 - 0.04 * u}; filter: blur(${u * 2}px)`
		};
	}
</script>

<a
	bind:this={ref}
	{href}
	{...restProps}
	aria-describedby={[restProps['aria-describedby'], `${uid}-card`].filter(Boolean).join(' ')}
	class={cn(
		'decoration-border hover:decoration-foreground focus-visible:ring-ring focus-visible:ring-offset-background rounded-xs font-medium underline decoration-1 underline-offset-4 transition-[text-decoration-color] duration-(--duration-fast) ease-out outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
		className
	)}
	onpointerenter={(event) => {
		restProps.onpointerenter?.(event);
		if (event.pointerType !== 'touch') show(event.clientX);
	}}
	onpointermove={(event) => {
		restProps.onpointermove?.(event);
		onpointermove(event);
	}}
	onpointerleave={(event) => {
		restProps.onpointerleave?.(event);
		if (event.pointerType !== 'touch') hide();
	}}
	onpointerdown={(event) => {
		restProps.onpointerdown?.(event);
		if (event.pointerType === 'touch') show();
	}}
	onpointerup={(event) => {
		restProps.onpointerup?.(event);
		if (event.pointerType !== 'touch') return;
		// Holds the card up after the press ends, so it can actually be read.
		clearTimeout(lingerTimer);
		lingerTimer = setTimeout(hide, durations.ambient);
	}}
	onpointercancel={(event) => {
		restProps.onpointercancel?.(event);
		hide();
	}}
	onfocus={(event) => {
		restProps.onfocus?.(event);
		if (event.currentTarget.matches(':focus-visible')) show();
	}}
	onblur={(event) => {
		restProps.onblur?.(event);
		hide();
	}}
	onkeydown={(event) => {
		restProps.onkeydown?.(event);
		if (event.key === 'Escape' && open) {
			event.preventDefault();
			hide();
		}
	}}>{@render children()}</a
><span id="{uid}-card" class="sr-only">{[title, source].filter(Boolean).join(', ')}</span><Portal>
	<!-- The portal stays mounted and the card comes and goes inside it: removing
	     the portal itself would unmount its contents at once and skip the exit. -->
	{#if open}
		<!-- The frame trails the pointer and leans; the card inside does the
		     entrance, so the two never fight over one transform. It pivots at the
		     edge nearest the link, as if held there. -->
		<div
			bind:this={card}
			aria-hidden="true"
			data-link-preview
			data-side={below ? 'bottom' : 'top'}
			class="pointer-events-none fixed left-0 z-50 w-60"
			style:top={below ? `${anchor.bottom + GAP}px` : undefined}
			style:bottom={below ? undefined : `${window.innerHeight - anchor.top + GAP}px`}
			{@attach placeCard}
			style:transform-origin={below ? '50% 0%' : '50% 100%'}
		>
			<div
				in:enter
				out:leave
				style:transform-origin={below ? '50% 0%' : '50% 100%'}
				class={cn(
					'bg-popover text-popover-foreground overflow-hidden rounded-2xl p-1 shadow-lg',
					cardClass
				)}
			>
				{#if image}
					<!-- Concentric: 24px card = 20px thumbnail + 4px padding. -->
					<div class="bg-secondary h-28 overflow-hidden rounded-[1.25rem]">
						{@render image()}
					</div>
				{/if}
				<div class="px-2.5 pt-2 pb-2">
					<p class="truncate text-sm font-medium">{title}</p>
					{#if description}
						<p class="text-muted-foreground mt-0.5 line-clamp-2 text-xs">{description}</p>
					{/if}
					{#if source}
						<p class="text-muted-foreground mt-1 truncate text-xs">{source}</p>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</Portal>
