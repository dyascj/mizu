import type { Attachment } from 'svelte/attachments';
import { duration, prefersReducedMotion } from '$lib/components/ui/motion';

/** The widest an edge fade grows, in pixels. It grows with the hidden distance up to this. */
const fade = 48;
// Mouse wheels send whole notches (around 100px); trackpads send streams of
// small deltas that are already smooth and must stay 1:1 with the fingers.
const notch = 50;
// Time constant of the wheel glide: each notch settles in about one base
// duration, and notches that land mid-glide add to the target instead of
// restarting it.
const glide = duration.base / 4;

/**
 * Runs a sideways-scrolling tab row inside the attached frame:
 *
 * - Edge fades (`--fade-start`, `--fade-end` on the scroller) that appear only
 *   where more tabs are hidden, growing with the hidden distance.
 * - `data-visible` on the page buttons while a fine pointer hovers the frame
 *   and there is more to reveal on their side.
 * - A vertical mouse wheel scrolls the row sideways, gliding between notches,
 *   and hands back to the page at either end.
 * - Keyboard focus glides the next tab into view instead of jumping.
 */
export function scrollFrame(): Attachment<HTMLElement> {
	return (frame) => {
		const scroller = frame.querySelector<HTMLElement>('[data-slot="tabs-scroller"]');
		if (!scroller) return;
		const prev = frame.querySelector<HTMLElement>('[data-slot="tabs-scroll-prev"]');
		const next = frame.querySelector<HTMLElement>('[data-slot="tabs-scroll-next"]');

		let hovering = false;
		let start = false;
		let end = false;

		const toggle = (el: HTMLElement | null, on: boolean) => {
			if (el) el.toggleAttribute('data-visible', on);
		};
		const showArrows = () => {
			toggle(prev, hovering && start);
			toggle(next, hovering && end);
		};

		// RTL rows scroll from 0 at the start down to -max, so the scroll range
		// and the vertical wheel flip. Fades and page buttons stay physical.
		const rtl = () => getComputedStyle(scroller).direction === 'rtl';

		const update = () => {
			const max = scroller.scrollWidth - scroller.clientWidth;
			// Hidden past the left edge. Clamped at both ends: overscroll on touch
			// can report past the range.
			const left = rtl() ? scroller.scrollLeft + max : scroller.scrollLeft;
			const before = Math.min(Math.max(left, 0), Math.max(max, 0));
			const after = Math.max(max - before, 0);
			scroller.style.setProperty('--fade-start', `${Math.min(before, fade)}px`);
			scroller.style.setProperty('--fade-end', `${Math.min(after, fade)}px`);
			// One pixel of slack, since zoomed layouts rarely land exactly on 0.
			start = before > 1;
			end = after > 1;
			showArrows();
		};

		// Tracked apart from scrollLeft, which some browsers round to whole pixels
		// and would stall the last frames of the glide.
		let target = 0;
		let position = 0;
		let raf = 0;
		let last = 0;

		const step = (now: number) => {
			const t = 1 - Math.exp(-(now - last) / glide);
			last = now;
			position += (target - position) * t;
			if (Math.abs(target - position) < 0.5) position = target;
			scroller.scrollLeft = position;
			raf = position === target ? 0 : requestAnimationFrame(step);
		};
		const stop = () => {
			cancelAnimationFrame(raf);
			raf = 0;
		};

		// Shift + wheel and a plain vertical wheel both scroll the row sideways. A
		// vertical wheel only does so while there is room, so the page takes over
		// again at either end.
		const onWheel = (event: WheelEvent) => {
			if (event.ctrlKey) return;
			const vertical = !event.shiftKey && Math.abs(event.deltaY) > Math.abs(event.deltaX);
			const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
			const precise = event.deltaMode === 0 && Math.abs(delta) < notch;
			// A trackpad swiping sideways is already smooth; leave it native.
			if (precise && !vertical) return;

			const max = scroller.scrollWidth - scroller.clientWidth;
			const mirrored = rtl();
			const low = mirrored ? -max : 0;
			const high = mirrored ? 0 : max;
			// Pick up from wherever the row is when nothing is gliding, so a click or
			// scrollbar drag in between is respected.
			if (!raf) target = position = scroller.scrollLeft;
			// A vertical wheel moves toward the end of the row, which is leftward in RTL.
			const px = (event.deltaMode === 1 ? delta * 16 : delta) * (vertical && mirrored ? -1 : 1);
			if ((px < 0 && target <= low) || (px > 0 && target >= high - 1)) return;
			event.preventDefault();
			target = Math.min(Math.max(target + px, low), high);

			if (precise || prefersReducedMotion()) {
				stop();
				scroller.scrollLeft = position = target;
				return;
			}
			if (!raf) {
				last = performance.now();
				raf = requestAnimationFrame(step);
			}
		};

		// Native focus scrolling jumps. Let it land, then, before the frame paints,
		// put the row back and glide to the same place.
		let focusFrame = 0;
		const onKeydown = () => {
			stop();
			const from = scroller.scrollLeft;
			cancelAnimationFrame(focusFrame);
			focusFrame = requestAnimationFrame(() => {
				const to = scroller.scrollLeft;
				if (to === from || prefersReducedMotion()) return;
				scroller.scrollLeft = from;
				scroller.scrollTo({ left: to, behavior: 'smooth' });
			});
		};

		const page = (direction: 1 | -1) => {
			stop();
			scroller.scrollBy({
				// Leaves one fade's worth of overlap, so the tab that was half hidden
				// under the fade lands fully in view.
				left: direction * (scroller.clientWidth - fade),
				behavior: prefersReducedMotion() ? 'auto' : 'smooth'
			});
		};
		const onPrev = () => page(-1);
		const onNext = () => page(1);
		// Keeps focus on the active tab, so arrow keys keep working after a click.
		const keepFocus = (event: MouseEvent) => event.preventDefault();

		const onEnter = (event: PointerEvent) => {
			if (event.pointerType === 'touch') return;
			hovering = true;
			showArrows();
		};
		const onLeave = () => {
			hovering = false;
			showArrows();
		};

		update();
		const resizes = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
		resizes?.observe(scroller);
		if (scroller.firstElementChild) resizes?.observe(scroller.firstElementChild);
		scroller.addEventListener('scroll', update, { passive: true });
		scroller.addEventListener('wheel', onWheel, { passive: false });
		scroller.addEventListener('keydown', onKeydown, true);
		frame.addEventListener('pointerenter', onEnter);
		frame.addEventListener('pointerleave', onLeave);
		prev?.addEventListener('click', onPrev);
		next?.addEventListener('click', onNext);
		prev?.addEventListener('mousedown', keepFocus);
		next?.addEventListener('mousedown', keepFocus);

		return () => {
			stop();
			cancelAnimationFrame(focusFrame);
			resizes?.disconnect();
			scroller.removeEventListener('scroll', update);
			scroller.removeEventListener('wheel', onWheel);
			scroller.removeEventListener('keydown', onKeydown, true);
			frame.removeEventListener('pointerenter', onEnter);
			frame.removeEventListener('pointerleave', onLeave);
			prev?.removeEventListener('click', onPrev);
			next?.removeEventListener('click', onNext);
			prev?.removeEventListener('mousedown', keepFocus);
			next?.removeEventListener('mousedown', keepFocus);
		};
	};
}
