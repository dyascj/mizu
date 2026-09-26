import type { Attachment } from 'svelte/attachments';
import { duration as durations, stagger as staggerStep } from './easing.js';
import { prefersReducedMotion } from './media.js';

export type RevealEffect = 'rise' | 'blur' | 'fade' | 'scale';

export type RevealOptions = {
	/** How the content arrives. */
	effect?: RevealEffect;
	/** Animate each child in sequence instead of the element as a whole. */
	children?: boolean;
	/** Milliseconds between children when `children` is set. */
	stagger?: number;
	/** Milliseconds before the first element starts. */
	delay?: number;
	/** Milliseconds for each element's entrance. */
	duration?: number;
	/** Fraction of the element that must be visible before it reveals. */
	threshold?: number;
	/** Grow or shrink the viewport used to detect visibility. */
	rootMargin?: string;
};

/** The Web Animations API cannot read custom properties, so mirror --ease-out. */
const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';

const keyframes: Record<RevealEffect, Keyframe[]> = {
	rise: [
		{ opacity: 0, translate: '0 0.75rem' },
		{ opacity: 1, translate: '0 0' }
	],
	blur: [
		{ opacity: 0, filter: 'blur(8px)', translate: '0 0.25rem' },
		{ opacity: 1, filter: 'blur(0)', translate: '0 0' }
	],
	fade: [{ opacity: 0 }, { opacity: 1 }],
	scale: [
		{ opacity: 0, scale: '0.96' },
		{ opacity: 1, scale: '1' }
	]
};

/**
 * Reveal content the first time it scrolls into view.
 *
 * ```svelte
 * <ul {@attach reveal({ children: true })}>...</ul>
 * ```
 *
 * Content is never hidden for readers who prefer reduced motion, in browsers
 * without IntersectionObserver, or before JavaScript runs.
 */
export function reveal(options: RevealOptions = {}): Attachment<HTMLElement> {
	const {
		effect = 'rise',
		children = false,
		stagger = staggerStep,
		delay = 0,
		duration = durations.deliberate,
		threshold = 0.15,
		rootMargin = '0px 0px -8% 0px'
	} = options;

	return (node) => {
		if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') return;

		const targets = children ? (Array.from(node.children) as HTMLElement[]) : [node];
		const animations: Animation[] = [];
		for (const target of targets) target.style.opacity = '0';

		const observer = new IntersectionObserver(
			(entries) => {
				if (!entries.some((entry) => entry.isIntersecting)) return;
				observer.disconnect();
				targets.forEach((target, index) => {
					target.style.removeProperty('opacity');
					if (typeof target.animate !== 'function') return;
					animations.push(
						target.animate(keyframes[effect], {
							duration,
							delay: delay + index * stagger,
							easing: EASE_OUT,
							fill: 'backwards'
						})
					);
				});
			},
			{ threshold, rootMargin }
		);
		observer.observe(node);

		return () => {
			observer.disconnect();
			for (const animation of animations) animation.cancel();
			for (const target of targets) target.style.removeProperty('opacity');
		};
	};
}
