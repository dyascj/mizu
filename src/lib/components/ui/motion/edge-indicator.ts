import type { Attachment } from 'svelte/attachments';
import { springPresets } from './easing.js';
import { prefersReducedMotion } from './media.js';
import { SpringValue } from './spring-value.js';

/** What moved the selection: a pointer or the keyboard. */
export type EdgeCause = 'pointer' | 'key';

/**
 * Draws an indicator from two edges that travel on their own springs. On a
 * pointer move the edge facing the new item leaves first on a snappy spring
 * and the trailing edge follows on a softer one, so the indicator stretches
 * toward its target and then gathers itself, like an inchworm. Both springs
 * keep their velocity, so a second click mid-move bends the indicator toward
 * the new target instead of restarting it. Arrow keys fire in quick runs, so
 * when the host reports `key`, both edges move together on the snappy spring.
 *
 * The edges are written to the container as `--edge-left`, `--edge-right`,
 * `--edge-top`, and `--edge-height` in pixels, and every item receives its own
 * offset as `--edge-x`, so labels can clip a highlighted copy of themselves to
 * the indicator and recolor exactly as an edge crosses them. The container gets
 * `data-indicator` while the indicator is in place, so items can drop the
 * fallback they show before hydration. First placement, resizes, moves to
 * another row, and reduced motion jump without animating.
 *
 * ```svelte
 * <script>
 *   const thumb = edgeIndicator({ item: '[data-item]', active: '[data-state="on"]' });
 * </script>
 * <div onpointerdown={() => (thumb.cause = 'pointer')}>
 *   <span hidden {@attach thumb.attach}></span>
 * </div>
 * ```
 */
export function edgeIndicator({ item, active }: { item: string; active: string }) {
	const control = {
		/** Set by the host just before a selection changes, then consumed. */
		cause: null as EdgeCause | null,
		attach: ((indicator) => {
			const container = indicator.parentElement;
			if (!container) return;

			const write = () => {
				container.style.setProperty('--edge-left', `${left.current}px`);
				container.style.setProperty('--edge-right', `${right.current}px`);
			};
			const left = new SpringValue(0, { preset: springPresets.snappy, onUpdate: write });
			const right = new SpringValue(0, { preset: springPresets.snappy, onUpdate: write });
			let current: HTMLElement | null = null;
			let row = 0;

			// Offsets ignore transforms, so a pressed item's scale never leaks in.
			const offset = (el: HTMLElement) => {
				let x = 0;
				let y = 0;
				for (let node: HTMLElement | null = el; node && node !== container;) {
					x += node.offsetLeft;
					y += node.offsetTop;
					node = node.offsetParent as HTMLElement | null;
				}
				return { x, y };
			};

			const place = (resize: boolean) => {
				const cause = control.cause;
				control.cause = null;

				for (const el of container.querySelectorAll<HTMLElement>(item)) {
					el.style.setProperty('--edge-x', `${offset(el).x}px`);
				}

				const target = container.querySelector<HTMLElement>(`${item}${active}`);
				if (!target) {
					current = null;
					indicator.hidden = true;
					container.removeAttribute('data-indicator');
					return;
				}

				const { x, y } = offset(target);
				const nextLeft = x;
				const nextRight = x + target.offsetWidth;
				container.style.setProperty('--edge-top', `${y}px`);
				container.style.setProperty('--edge-height', `${target.offsetHeight}px`);

				// A move onto another row of a wrapped list jumps: sliding sideways
				// on the wrong row would point at the wrong item on the way.
				const instant =
					resize || current === null || current === target || y !== row || prefersReducedMotion();
				current = target;
				row = y;

				if (instant) {
					left.jump(nextLeft);
					right.jump(nextRight);
				} else {
					// Moving right, the right edge leads; moving left, the left one does.
					const rightward = nextLeft > left.current;
					const { snappy, smooth } = springPresets;
					left.set(nextLeft, { preset: cause === 'key' || !rightward ? snappy : smooth });
					right.set(nextRight, { preset: cause === 'key' || rightward ? snappy : smooth });
				}
				indicator.hidden = false;
				container.setAttribute('data-indicator', '');
			};

			const resizes =
				typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => place(true));
			// Only the container and the items: a sibling such as a hover pill
			// resizes as the pointer moves, and must not snap a glide in flight.
			const observeSizes = () => {
				if (!resizes) return;
				resizes.disconnect();
				resizes.observe(container);
				for (const el of container.querySelectorAll(item)) resizes.observe(el);
			};

			const mutations = new MutationObserver((records) => {
				if (records.some((record) => record.type === 'childList')) observeSizes();
				place(false);
			});
			mutations.observe(container, {
				subtree: true,
				childList: true,
				attributes: true,
				attributeFilter: ['data-state']
			});

			observeSizes();
			place(true);

			return () => {
				left.stop();
				right.stop();
				mutations.disconnect();
				resizes?.disconnect();
				container.removeAttribute('data-indicator');
			};
		}) as Attachment<HTMLElement>
	};
	return control;
}
