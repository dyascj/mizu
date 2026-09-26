import type { TransitionConfig } from 'svelte/transition';
import { duration, easeIn, easeOut, prefersReducedMotion } from '$lib/components/ui/motion';

/**
 * How far an incoming month travels, in pixels. Far enough to read as travel,
 * short enough that the fade does most of the work and the grid never looks
 * like it is leaving the card.
 */
const DISTANCE = 56;

type Phase = { direction: 'in' | 'out' | 'both' };

/**
 * Takes a leaving month out of layout and out of reach. It lies over the new
 * month while it fades, so the calendar takes the new month's height at once,
 * and its days lose the marker the calendar uses to find days to focus, so
 * keyboard navigation never lands on a grid that is about to disappear.
 */
function retire(node: HTMLElement) {
	node.style.position = 'absolute';
	node.style.inset = '0 0 auto 0';
	node.style.pointerEvents = 'none';
	for (const day of node.querySelectorAll('[data-bits-day]')) day.removeAttribute('data-bits-day');
}

/**
 * Slides a month grid in from the side you are travelling toward. The
 * outgoing grid leaves the other way, quicker and over a shorter distance, so
 * the eye goes straight to the new month. Reduced motion swaps the months with
 * a short fade.
 */
export function monthSlide(
	node: Element,
	{ direction }: { direction: number },
	{ direction: phase }: Phase
): TransitionConfig {
	const leaving = phase === 'out';
	if (leaving) retire(node as HTMLElement);
	// Environments without the Web Animations API, such as jsdom, swap instantly.
	if (typeof (node as HTMLElement).animate !== 'function') return {};
	if (prefersReducedMotion()) {
		return leaving ? {} : { duration: duration.fast, css: (t) => `opacity: ${t}` };
	}
	if (leaving) {
		return {
			duration: duration.fast,
			easing: easeIn,
			css: (t, u) =>
				`opacity: ${t}; translate: ${-direction * DISTANCE * 0.6 * u}px 0; filter: blur(${u * 2}px)`
		};
	}
	return {
		duration: duration.base,
		easing: easeOut,
		css: (t, u) =>
			`opacity: ${t}; translate: ${direction * DISTANCE * u}px 0; filter: blur(${u * 4}px)`
	};
}

/**
 * Crossfades a month title through a soft blur. Stack the old and new titles
 * in one grid cell so the header never jumps.
 */
export function titleFade(
	node: Element,
	_params: unknown,
	{ direction: phase }: Phase
): TransitionConfig {
	const leaving = phase === 'out';
	if (typeof (node as HTMLElement).animate !== 'function') return {};
	if (prefersReducedMotion()) {
		return leaving ? {} : { duration: duration.fast, css: (t) => `opacity: ${t}` };
	}
	return {
		duration: leaving ? duration.fast : duration.base,
		easing: leaving ? easeIn : easeOut,
		css: (t, u) => `opacity: ${t}; filter: blur(${u * (leaving ? 2 : 4)}px)`
	};
}

/** The day each grid showed as selected last, so the next selection knows where to glide from. */
const lastSelected = new WeakMap<Element, Element>();

/** Splits a computed transition list on its top-level commas. */
const entries = (value: string) => value.split(/,(?![^(]*\))/).map((part) => part.trim());

/**
 * Lets a day's background change land at once while its other transitions
 * run. A glide hands the selection over with the fill, so a background fade
 * would leave a fading circle on the old day and start the fill in the wrong
 * color. Dropping the property cancels a fade already under way.
 */
function snapBackground(day: HTMLElement) {
	const style = getComputedStyle(day);
	const properties = entries(style.transitionProperty);
	if (!properties.some((name) => name === 'background-color' || name === 'all')) return;
	const durations = entries(style.transitionDuration);
	const easings = entries(style.transitionTimingFunction);
	const delays = entries(style.transitionDelay);
	const kept = properties.flatMap((name, i) =>
		name === 'background-color' || name === 'all'
			? []
			: [
					`${name} ${durations[i % durations.length]} ${easings[i % easings.length]} ${delays[i % delays.length]}`
				]
	);
	day.style.transition = kept.join(', ') || 'none';
	// Two frames: the first commits the snapped background, the second hands
	// the day back its own transitions for hover and the like.
	requestAnimationFrame(() => requestAnimationFrame(() => day.style.removeProperty('transition')));
}

/**
 * Attach to the fill behind a selected day. When the selection moves to
 * another day in the same month, the fill glides over from the old day on a
 * critically damped spring, so it never overshoots onto the wrong date. A new
 * month starts fresh rather than flying in from the grid that slid away, and
 * a calendar with several days selected leaves its fills where they are.
 *
 * In flight the fill carries the day's color and the day paints none of its
 * own, so nothing of the selection shows at the new day, not even around the
 * edges of its numerals, until the fill arrives.
 */
export function glideSelection(fill: HTMLElement) {
	const day = fill.parentElement;
	const grid = fill.closest('table');
	if (!day || !grid) return;
	const previous = lastSelected.get(grid);
	lastSelected.set(grid, day);
	if (!previous || previous === day || !previous.isConnected || prefersReducedMotion()) return;
	if (grid.querySelectorAll('[data-day-fill]').length > 1) return;

	if (previous instanceof HTMLElement) snapBackground(previous);
	snapBackground(day);
	fill.style.backgroundColor = getComputedStyle(day).backgroundColor;
	day.style.backgroundColor = 'transparent';

	const land = () => {
		fill.removeEventListener('transitionend', onEnd);
		fill.removeEventListener('transitioncancel', onEnd);
		fill.style.removeProperty('background-color');
		day.style.removeProperty('background-color');
	};
	const onEnd = (event: TransitionEvent) => {
		if (event.target === fill && event.propertyName === 'translate') land();
	};
	fill.addEventListener('transitionend', onEnd);
	fill.addEventListener('transitioncancel', onEnd);

	const from = previous.getBoundingClientRect();
	const to = day.getBoundingClientRect();
	fill.style.transition = 'none';
	fill.style.translate = `${from.left - to.left}px ${from.top - to.top}px`;
	// Commit the starting offset before releasing it into the transition.
	void fill.offsetWidth;
	fill.style.transition = '';
	fill.style.translate = '';
	// A selection that moves on mid-flight unmounts this fill; the day gets its color back.
	return land;
}
