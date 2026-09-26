import type { Attachment } from 'svelte/attachments';
import { springPresets } from './easing.js';
import { SpringValue, type SpringPreset } from './spring-value.js';
import { hasFinePointer, prefersReducedMotion } from './media.js';

/**
 * Track the pointer inside an element as CSS custom properties:
 * `--pointer-x` and `--pointer-y` in pixels from the top left, and
 * `--pointer-active` as 1 while hovered and 0 otherwise. Style anything from
 * those values, such as a radial glow that follows the cursor. Touch screens
 * and reduced motion keep `--pointer-active` at 0.
 *
 * ```svelte
 * <div {@attach pointerPosition()} class="bg-[radial-gradient(...at_var(--pointer-x)_var(--pointer-y)...)]">
 * ```
 */
export function pointerPosition(): Attachment<HTMLElement> {
	return (node) => {
		// Effects built on the position are decoration: skip them for touch and
		// for readers who asked for less motion.
		if (!hasFinePointer() || prefersReducedMotion()) {
			node.style.setProperty('--pointer-active', '0');
			return () => node.style.removeProperty('--pointer-active');
		}

		let frame = 0;
		let x = 0;
		let y = 0;

		const write = () => {
			frame = 0;
			node.style.setProperty('--pointer-x', `${x}px`);
			node.style.setProperty('--pointer-y', `${y}px`);
		};
		const move = (event: PointerEvent) => {
			const rect = node.getBoundingClientRect();
			x = Math.round(event.clientX - rect.left);
			y = Math.round(event.clientY - rect.top);
			node.style.setProperty('--pointer-active', '1');
			frame ||= requestAnimationFrame(write);
		};
		const leave = () => node.style.setProperty('--pointer-active', '0');

		node.style.setProperty('--pointer-active', '0');
		node.addEventListener('pointermove', move);
		node.addEventListener('pointerleave', leave);
		return () => {
			cancelAnimationFrame(frame);
			node.removeEventListener('pointermove', move);
			node.removeEventListener('pointerleave', leave);
			for (const name of ['--pointer-x', '--pointer-y', '--pointer-active']) {
				node.style.removeProperty(name);
			}
		};
	};
}

export type MagneticOptions = {
	/**
	 * Share of the pointer's offset from center that the element follows at
	 * full pull. The pull weakens with distance like a real magnet and fades to
	 * nothing at the edge of the field, so crossing it never jolts the element.
	 */
	strength?: number;
	/** Largest distance in pixels the element may travel. */
	limit?: number;
	/** How far past its edges, in pixels, the element starts to feel the pointer. */
	field?: number;
	/**
	 * Largest stretch toward the pointer, as a share of the element's length.
	 * The element thins across by half as much, which roughly keeps its area,
	 * and wobbles through a squash or two when the pointer lets go. `0` keeps
	 * it rigid.
	 */
	stretch?: number;
	/**
	 * Selector for an inner layer, such as the label, that keeps its shape while
	 * the body stretches and drifts further toward the pointer, so it reads as
	 * a layer above. The layer needs a box display, such as `inline-flex`.
	 */
	content?: string;
};

/** Stretch gained per pixel of pull: 1% per 1.2px. */
const STRETCH_PER_PX = 1 / 120;
/** Share of the body's travel the content layer adds on top, for parallax. */
const CONTENT_DEPTH = 0.5;
/**
 * Much looser than the follow (a damping ratio near 0.4), so when the pointer
 * lets go the body jiggles through a squash or two before it settles.
 */
const WOBBLE: SpringPreset = { stiffness: 0.18, damping: 0.33 };

/**
 * Let an element stretch toward a nearby pointer like something soft on a
 * magnet, then wobble home when the pointer moves away. The pull starts
 * `field` pixels past the element's edges. Mark a label inside with
 * `data-magnetic-content` to keep it undistorted and floating above the body.
 * Only fine pointers get the effect, and reduced motion disables it.
 *
 * ```svelte
 * <span {@attach magnetic()} class="inline-flex">
 *   <Button><span data-magnetic-content class="inline-flex items-center gap-2">Generate</span></Button>
 * </span>
 * ```
 */
export function magnetic({
	strength = 0.5,
	limit = 16,
	field = 96,
	stretch = 0.12,
	content = '[data-magnetic-content]'
}: MagneticOptions = {}): Attachment<HTMLElement> {
	return (node) => {
		if (!hasFinePointer() || prefersReducedMotion()) return;

		const layer = content ? node.querySelector<HTMLElement>(content) : null;
		let pointer: { x: number; y: number } | null = null;
		let frame = 0;
		// The pull's direction, held once the pull fades out: a spring settling
		// around zero has no direction of its own, and the wobble should stay on
		// the axis the body was stretched along.
		let heading = 0;

		// Individual `translate` plus a `transform` for the stretch, so utilities
		// such as `active:scale-*` on the element still compose.
		const render = () => {
			const dx = x.current;
			const dy = y.current;
			if (Math.hypot(dx, dy) > 1) heading = Math.atan2(dy, dx);
			const s = amount.current;
			// At rest the element gets its own styles back, so utilities such as
			// `-translate-x-1/2` apply again between visits.
			if (dx === 0 && dy === 0 && s === 0) {
				clear();
				return;
			}
			const turn = (scale: string) =>
				s === 0 ? '' : `rotate(${heading}rad) scale(${scale}) rotate(${-heading}rad)`;
			node.style.translate = `${dx.toFixed(2)}px ${dy.toFixed(2)}px`;
			node.style.transform = turn(`${1 + s}, ${1 - s / 2}`);
			if (layer) {
				layer.style.translate = `${(dx * CONTENT_DEPTH).toFixed(2)}px ${(dy * CONTENT_DEPTH).toFixed(2)}px`;
				// The exact inverse of the stretch, so the content never distorts.
				layer.style.transform = turn(`${1 / (1 + s)}, ${1 / (1 - s / 2)}`);
			}
		};
		const clear = () => {
			for (const element of [node, layer]) {
				element?.style.removeProperty('translate');
				element?.style.removeProperty('transform');
			}
		};
		// Stretch follows the travel, on its own looser spring.
		const follow = () => {
			render();
			amount.set(Math.min(Math.hypot(x.current, y.current) * STRETCH_PER_PX, stretch));
		};
		const x = new SpringValue(0, { preset: springPresets.snappy, onUpdate: follow });
		const y = new SpringValue(0, { preset: springPresets.snappy, onUpdate: follow });
		const amount = new SpringValue(0, { preset: WOBBLE, onUpdate: render, precision: 0.0005 });

		const pull = (px: number, py: number) => {
			if (px === x.target && py === y.target) return;
			x.set(px);
			y.set(py);
		};

		const aim = () => {
			frame = 0;
			if (!pointer) return;
			const rect = node.getBoundingClientRect();
			// Measured from where the element rests, so its own travel never feeds
			// back into the pull.
			const dx = pointer.x - (rect.left + rect.width / 2 - x.current);
			const dy = pointer.y - (rect.top + rect.height / 2 - y.current);
			const size = Math.max(node.offsetWidth || rect.width, node.offsetHeight || rect.height);
			const t = Math.min(Math.hypot(dx, dy) / (size / 2 + field), 1);
			const force = strength * (1 - t) ** 2;
			const length = Math.hypot(dx, dy) * force;
			const clamp = length > limit ? limit / length : 1;
			pull(dx * force * clamp, dy * force * clamp);
		};

		const move = (event: PointerEvent) => {
			if (event.pointerType === 'touch') return;
			pointer = { x: event.clientX, y: event.clientY };
			frame ||= requestAnimationFrame(aim);
		};
		const release = () => {
			pointer = null;
			pull(0, 0);
		};

		const root = node.ownerDocument.documentElement;
		const view = node.ownerDocument.defaultView ?? window;
		view.addEventListener('pointermove', move, { passive: true });
		view.addEventListener('blur', release);
		root.addEventListener('pointerleave', release);
		return () => {
			cancelAnimationFrame(frame);
			view.removeEventListener('pointermove', move);
			view.removeEventListener('blur', release);
			root.removeEventListener('pointerleave', release);
			for (const spring of [x, y, amount]) spring.stop();
			clear();
		};
	};
}
