<script lang="ts">
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { TransitionConfig } from 'svelte/transition';
	import {
		duration as durations,
		easeIn,
		easeInOut,
		easeOut,
		prefersReducedMotion
	} from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLButtonAttributes, 'children' | 'onclick'> & {
		/**
		 * The element that scrolls. Leave it out to follow the page itself. Pass
		 * `null` while the element has not mounted yet, such as a `bind:this`
		 * reference, and the button waits for it.
		 */
		target?: HTMLElement | null;
		/** How far through the scroll, from 0 to 1, before the button offers itself. */
		showAfter?: number;
		/** Accessible name for the button. */
		label?: string;
		/** Called once the trip back up arrives at the top. */
		onArrive?: () => void;
		/** The button element, while it shows. */
		ref?: HTMLButtonElement | null;
		/** Classes for the button. */
		class?: string;
	};

	let {
		target,
		showAfter = 0.12,
		label = 'Back to top',
		onArrive,
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	let visible = $state(false);
	// Set once the arrow has lifted off. It stays gone while the page rises and
	// only returns if the trip is cut short or the button hides.
	let launched = $state(false);
	let ring: SVGCircleElement | null = null;
	// Kept outside the ring, which only exists while the button shows, so a
	// freshly shown button starts at the right fill instead of empty.
	let progress = 0;
	// True while heading up: the button stays to show the ring draining and
	// bows out only once the page has arrived.
	let returning = false;
	let focusedOnLaunch = false;
	let trip = 0;
	let cancelTrip: (() => void) | undefined;

	const scroller = $derived(target === undefined ? 'window' : target);

	function read(el: HTMLElement | undefined) {
		if (el) return { top: el.scrollTop, room: el.scrollHeight - el.clientHeight };
		return {
			top: window.scrollY,
			room: document.documentElement.scrollHeight - window.innerHeight
		};
	}

	function paint() {
		ring?.style.setProperty('stroke-dashoffset', String(1 - progress));
	}

	// The ring follows the scroll with at most one style write per frame, so
	// reading never re-renders anything; only crossing the threshold does.
	$effect(() => {
		const source = scroller;
		if (!source) return;
		const el = source === 'window' ? undefined : source;
		const threshold = showAfter;
		let frame = 0;

		const update = () => {
			frame = 0;
			const { top, room } = read(el);
			progress = room > 0 ? Math.min(1, Math.max(0, top / room)) : 0;
			paint();
			if (returning) {
				if (progress > 0) return;
				returning = false;
				arrive(el);
			}
			visible = progress > threshold;
			// Hidden again: the next time it shows, it brings its arrow.
			if (progress <= threshold) launched = false;
		};
		const onscroll = () => {
			frame ||= requestAnimationFrame(update);
		};

		update();
		const node = el ?? window;
		node.addEventListener('scroll', onscroll, { passive: true });
		window.addEventListener('resize', onscroll, { passive: true });
		return () => {
			cancelAnimationFrame(frame);
			node.removeEventListener('scroll', onscroll);
			window.removeEventListener('resize', onscroll);
		};
	});

	$effect(() => () => {
		cancelTrip?.();
	});

	function arrive(el: HTMLElement | undefined) {
		// The button is about to leave. Hand keyboard focus to the start of the
		// scroller, or of the page's main content, instead of letting it fall
		// back to wherever the button sat.
		if (focusedOnLaunch) {
			const start = el ?? document.querySelector<HTMLElement>('main') ?? document.body;
			if (start.tabIndex < 0 && !start.hasAttribute('tabindex')) {
				start.setAttribute('tabindex', '-1');
			}
			start.focus({ preventScroll: true });
		}
		focusedOnLaunch = false;
		onArrive?.();
	}

	/**
	 * Driven here rather than by the browser's smooth scroll, whose speed varies
	 * wildly: longer trips take a little longer, up to a cap. Any wheel or touch
	 * on the way hands control straight back.
	 */
	function go() {
		const source = scroller;
		if (!source) return;
		const el = source === 'window' ? undefined : source;
		const node = el ?? window;
		const write = (top: number) => node.scrollTo({ top, behavior: 'instant' });
		const from = read(el).top;

		cancelTrip?.();
		launched = true;
		focusedOnLaunch = !!ref && document.activeElement === ref;
		if (from <= 0) {
			arrive(el);
			return;
		}
		if (prefersReducedMotion()) {
			returning = true;
			write(0);
			return;
		}

		returning = true;
		const length = Math.min(durations.slow + durations.deliberate, durations.slow + from / 4);
		let start: number | undefined;
		const stop = () => {
			cancelTrip?.();
			returning = false;
			launched = false;
			focusedOnLaunch = false;
		};
		const step = (now: number) => {
			start ??= now;
			const t = Math.min(1, (now - start) / length);
			write(from * (1 - easeInOut(t)));
			if (t < 1) trip = requestAnimationFrame(step);
			else cleanup();
		};
		const cleanup = () => {
			cancelAnimationFrame(trip);
			node.removeEventListener('wheel', stop);
			node.removeEventListener('touchstart', stop);
			cancelTrip = undefined;
		};
		node.addEventListener('wheel', stop, { passive: true });
		node.addEventListener('touchstart', stop, { passive: true });
		cancelTrip = cleanup;
		trip = requestAnimationFrame(step);
	}

	/** Reduced motion keeps the change legible with a short crossfade. */
	function fade(): TransitionConfig {
		return { duration: durations.fast, css: (t) => `opacity: ${t}` };
	}

	function button(_node: Element, { leaving }: { leaving: boolean }): TransitionConfig {
		if (prefersReducedMotion()) return fade();
		return {
			duration: leaving ? durations.fast : durations.base,
			easing: leaving ? easeIn : easeOut,
			css: (t, u) => `opacity: ${t}; scale: ${1 - u * 0.15}; filter: blur(${u * 4}px)`
		};
	}

	// Rises into place, and on launch lifts off the way the page is about to
	// go, gathering speed as it leaves.
	function arrow(_node: Element, { leaving }: { leaving: boolean }): TransitionConfig {
		if (prefersReducedMotion()) return { duration: 0 };
		return {
			duration: leaving ? durations.slow : durations.base,
			easing: leaving ? easeIn : easeOut,
			css: (t, u) =>
				`opacity: ${t}; filter: blur(${u * 2}px); translate: 0 ${u * (leaving ? -20 : 10)}px`
		};
	}
</script>

{#if visible}
	<button
		{...restProps}
		bind:this={ref}
		type="button"
		aria-label={label}
		onclick={go}
		in:button={{ leaving: false }}
		out:button={{ leaving: true }}
		class={cn(
			'group/top bg-card text-foreground focus-visible:ring-ring focus-visible:ring-offset-background relative grid size-11 shrink-0 touch-manipulation place-items-center overflow-hidden rounded-full shadow-md transition-[scale] duration-(--duration-fast) ease-out outline-none select-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.96] motion-reduce:transition-none',
			className
		)}
	>
		<!-- How far through the scroll, drawn around the edge. -->
		<svg
			viewBox="0 0 44 44"
			fill="none"
			aria-hidden="true"
			class="pointer-events-none absolute inset-0 size-full -rotate-90"
		>
			<circle cx="22" cy="22" r="20.5" stroke-width="1.5" class="stroke-control" />
			<circle
				{@attach (node: SVGCircleElement) => {
					ring = node;
					paint();
					return () => {
						if (ring === node) ring = null;
					};
				}}
				cx="22"
				cy="22"
				r="20.5"
				stroke-width="1.5"
				stroke-linecap="round"
				pathLength="1"
				stroke-dasharray="1"
				stroke-dashoffset="1"
				class="stroke-primary"
			/>
		</svg>
		<span
			class="grid size-4 place-items-center transition-[translate] duration-(--duration-fast) ease-out group-hover/top:-translate-y-0.5 motion-reduce:transition-none motion-reduce:group-hover/top:translate-y-0"
		>
			{#if !launched}
				<span
					class="col-start-1 row-start-1 grid place-items-center"
					in:arrow={{ leaving: false }}
					out:arrow={{ leaving: true }}
				>
					<ArrowUp class="size-4" aria-hidden="true" />
				</span>
			{/if}
		</span>
	</button>
{/if}
