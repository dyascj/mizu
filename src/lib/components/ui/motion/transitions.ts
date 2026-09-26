import type { TransitionConfig } from 'svelte/transition';
import { duration as durations, easeOut, springs, type Easing } from './easing.js';
import { prefersReducedMotion } from './media.js';

type BaseParams = {
	delay?: number;
	duration?: number;
	easing?: Easing;
};

/** Reduced motion keeps the change legible with a short opacity crossfade. */
function crossfade(delay: number): TransitionConfig {
	return { delay, duration: durations.fast, css: (t) => `opacity: ${t}` };
}

/** Rises into place while fading in. The default entrance for content. */
export function rise(
	_node: Element,
	{
		delay = 0,
		duration = durations.deliberate,
		easing = easeOut,
		y = 12
	}: BaseParams & {
		/** Starting offset in pixels. Negative values drop in from above. */
		y?: number;
	} = {}
): TransitionConfig {
	if (prefersReducedMotion()) return crossfade(delay);
	return {
		delay,
		duration,
		easing,
		css: (t, u) => `opacity: ${t}; translate: 0 ${u * y}px`
	};
}

/** Resolves from a soft blur. For headlines, generated text, and AI output. */
export function blurIn(
	_node: Element,
	{
		delay = 0,
		duration = durations.deliberate,
		easing = easeOut,
		blur = 8,
		y = 4
	}: BaseParams & {
		/** Starting blur radius in pixels. */
		blur?: number;
		/** Starting offset in pixels. */
		y?: number;
	} = {}
): TransitionConfig {
	if (prefersReducedMotion()) return crossfade(delay);
	return {
		delay,
		duration,
		easing,
		css: (t, u) => `opacity: ${t}; filter: blur(${u * blur}px); translate: 0 ${u * y}px`
	};
}

/**
 * Springs up from slightly smaller. For popovers, badges, and anything that
 * appears in response to a direct action. Opacity follows a plain curve so the
 * spring's overshoot never pushes it past fully opaque.
 */
export function pop(
	_node: Element,
	{
		delay = 0,
		scale = 0.94,
		spring = springs.smooth
	}: {
		delay?: number;
		/** Starting scale. */
		scale?: number;
		/** Any spring from `springs`, or your own from `spring()`. */
		spring?: { duration: number; easing: Easing };
	} = {}
): TransitionConfig {
	if (prefersReducedMotion()) return crossfade(delay);
	return {
		delay,
		duration: spring.duration,
		css: (t) => {
			const s = spring.easing(t);
			return `opacity: ${Math.min(1, easeOut(t) * 1.6)}; scale: ${scale + (1 - scale) * s}`;
		}
	};
}
