import type { Attachment } from 'svelte/attachments';
import { hasFinePointer, prefersReducedMotion } from './media.js';

/**
 * Track the pointer inside an element as CSS custom properties:
 * `--pointer-x` and `--pointer-y` in pixels from the top left, and
 * `--pointer-active` as 1 while hovered and 0 otherwise. Style anything from
 * those values, such as a radial glow that follows the cursor.
 *
 * ```svelte
 * <div {@attach pointerPosition()} class="bg-[radial-gradient(...at_var(--pointer-x)_var(--pointer-y)...)]">
 * ```
 */
export function pointerPosition(): Attachment<HTMLElement> {
	return (node) => {
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
	/** Fraction of the pointer's offset from center that the element follows. */
	strength?: number;
	/** Largest distance in pixels the element may travel. */
	limit?: number;
};

/**
 * Let an element lean toward the pointer while hovered and spring back on
 * leave. Only fine pointers get the effect, and reduced motion disables it.
 */
export function magnetic({
	strength = 0.3,
	limit = 8
}: MagneticOptions = {}): Attachment<HTMLElement> {
	return (node) => {
		if (!hasFinePointer() || prefersReducedMotion()) return;

		const clamp = (value: number) => Math.max(-limit, Math.min(limit, value));
		const previousTransition = node.style.transition;
		node.style.transition = [
			previousTransition,
			'translate var(--duration-spring, 520ms) var(--ease-spring, ease-out)'
		]
			.filter(Boolean)
			.join(', ');

		const move = (event: PointerEvent) => {
			const rect = node.getBoundingClientRect();
			const dx = event.clientX - (rect.left + rect.width / 2);
			const dy = event.clientY - (rect.top + rect.height / 2);
			node.style.translate = `${clamp(dx * strength)}px ${clamp(dy * strength)}px`;
		};
		const leave = () => node.style.removeProperty('translate');

		node.addEventListener('pointermove', move);
		node.addEventListener('pointerleave', leave);
		return () => {
			node.removeEventListener('pointermove', move);
			node.removeEventListener('pointerleave', leave);
			node.style.removeProperty('translate');
			node.style.transition = previousTransition;
		};
	};
}
