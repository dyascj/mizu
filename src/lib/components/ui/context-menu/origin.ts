/**
 * Where the last context menu was asked for, in viewport pixels. Only one
 * context menu is open at a time, so the trigger and the content can share it.
 */
export const openPoint = { x: 0, y: 0 };

/**
 * Grows the menu out of the exact point it was opened from. The floating
 * layer knows which corner sits at the pointer, but not how far a collision
 * shifted the menu off it, so this measures the placed menu and pins the
 * transform origin to the pointer itself, clamped to the menu's edges.
 */
export function pinOriginToPoint(content: HTMLElement) {
	const frame = requestAnimationFrame(() => {
		const box = (content.parentElement ?? content).getBoundingClientRect();
		if (!box.width || !box.height) return;
		const x = Math.min(Math.max(openPoint.x - box.left, 0), box.width);
		const y = Math.min(Math.max(openPoint.y - box.top, 0), box.height);
		content.style.transformOrigin = `${x}px ${y}px`;
	});
	return () => cancelAnimationFrame(frame);
}
