/**
 * `use:ripple` — a water ripple that blooms from the pointer on press.
 *
 * Drop it on any surface; it composes without markup changes:
 *   <button use:ripple>Tap me</button>
 *   <div class="rounded-2xl" use:ripple={{ color: 'rgba(120,224,255,0.5)' }}>…</div>
 *
 * The host is made `position: relative` (if static) and `overflow: hidden`, and
 * the ripple inherits its border-radius so it clips to the surface.
 */
import type { Action } from 'svelte/action';

export type RippleOptions = {
	/** Ripple color. Defaults to a watery white that reads on aqua and glass alike. */
	color?: string;
	/** Bloom duration in ms. */
	duration?: number;
	/** Turn the effect off without removing the action. */
	disabled?: boolean;
};

const REDUCE = () =>
	typeof window !== 'undefined' &&
	window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

export const ripple: Action<HTMLElement, RippleOptions | undefined> = (node, options) => {
	let opts: RippleOptions = { color: 'rgba(255,255,255,0.45)', duration: 620, ...options };

	const cs = getComputedStyle(node);
	if (cs.position === 'static') node.style.position = 'relative';
	if (cs.overflow === 'visible') node.style.overflow = 'hidden';

	function spawn(event: PointerEvent) {
		if (opts.disabled) return;
		const rect = node.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;
		// Diameter that always reaches the farthest corner from the press point.
		const size =
			2 *
			Math.max(
				Math.hypot(x, y),
				Math.hypot(rect.width - x, y),
				Math.hypot(x, rect.height - y),
				Math.hypot(rect.width - x, rect.height - y)
			);

		const dot = document.createElement('span');
		dot.setAttribute('aria-hidden', 'true');
		dot.style.cssText = `position:absolute; left:${x}px; top:${y}px; width:${size}px; height:${size}px; border-radius:9999px; pointer-events:none; z-index:0; will-change:transform,opacity; background:radial-gradient(circle, ${opts.color} 0%, ${opts.color} 36%, transparent 70%);`;
		node.appendChild(dot);

		const reduce = REDUCE();
		const anim = dot.animate(
			reduce
				? [
						{ transform: 'translate(-50%,-50%) scale(1)', opacity: 0.4 },
						{ transform: 'translate(-50%,-50%) scale(1)', opacity: 0 }
					]
				: [
						{ transform: 'translate(-50%,-50%) scale(0)', opacity: 0.5 },
						{ transform: 'translate(-50%,-50%) scale(1)', opacity: 0 }
					],
			{ duration: reduce ? 220 : opts.duration, easing: 'cubic-bezier(0.2, 0, 0, 1)' }
		);
		anim.onfinish = () => dot.remove();
		anim.oncancel = () => dot.remove();
	}

	node.addEventListener('pointerdown', spawn);

	return {
		update(next) {
			opts = { color: 'rgba(255,255,255,0.45)', duration: 620, ...next };
		},
		destroy() {
			node.removeEventListener('pointerdown', spawn);
		}
	};
};
