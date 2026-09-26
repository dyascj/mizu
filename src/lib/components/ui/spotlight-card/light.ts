import { prefersReducedMotion } from '$lib/components/ui/motion';

/** Longest icon shadow in pixels, when the light sits right beside the icon. */
const SHADOW_MAX = 6;
/** Distance in pixels at which the shadow has shrunk to nothing. */
const SHADOW_FALLOFF = 420;

/**
 * Points every card's light at the cursor, each in its own coordinates, so a
 * card still glows along the edge nearest a cursor that is over its
 * neighbour. The cursor is the lamp: each card's icon casts a shadow away
 * from it that shortens as the lamp moves off, so every card agrees on where
 * the light is. Reads every box first and writes after, so one move costs a
 * single layout.
 */
export function illuminate(cards: Iterable<HTMLElement>, clientX: number, clientY: number) {
	const measured = [...cards].map((card) => {
		const box = card.getBoundingClientRect();
		const icon = card.querySelector('[data-spotlight-icon]')?.getBoundingClientRect();
		return {
			card,
			x: clientX - box.left,
			y: clientY - box.top,
			// Shadows are cast from the middle of the icon.
			originX: icon ? icon.left + icon.width / 2 - box.left : 0,
			originY: icon ? icon.top + icon.height / 2 - box.top : 0
		};
	});
	for (const { card, x, y, originX, originY } of measured) {
		card.style.setProperty('--spotlight-x', `${x}px`);
		card.style.setProperty('--spotlight-y', `${y}px`);
		const dx = originX - x;
		const dy = originY - y;
		const distance = Math.hypot(dx, dy) || 1;
		const reach = Math.max(0, 1 - distance / SHADOW_FALLOFF);
		card.style.setProperty(
			'--spotlight-shadow-x',
			`${((dx / distance) * SHADOW_MAX * reach).toFixed(2)}px`
		);
		card.style.setProperty(
			'--spotlight-shadow-y',
			`${((dy / distance) * SHADOW_MAX * reach).toFixed(2)}px`
		);
	}
}

/** Turns the lamp off: shadows ease back under their icons. */
export function darken(cards: Iterable<HTMLElement>) {
	for (const card of cards) {
		card.style.setProperty('--spotlight-shadow-x', '0px');
		card.style.setProperty('--spotlight-shadow-y', '0px');
	}
}

/**
 * A lamp that lights `cards` from the latest pointer position, at most once
 * per frame. The light is a pointer effect, so touch, which has no hover,
 * and reduced motion leave it off.
 */
export function createLamp(
	cards: () => Iterable<HTMLElement>,
	root: () => HTMLElement | null | undefined
) {
	let frame = 0;
	let x = 0;
	let y = 0;
	const paint = () => {
		frame = 0;
		illuminate(cards(), x, y);
	};
	return {
		move(event: PointerEvent) {
			if (event.pointerType !== 'mouse' || prefersReducedMotion()) return;
			x = event.clientX;
			y = event.clientY;
			root()?.setAttribute('data-lit', '');
			if (typeof requestAnimationFrame === 'undefined') paint();
			else frame ||= requestAnimationFrame(paint);
		},
		leave() {
			this.stop();
			root()?.removeAttribute('data-lit');
			darken(cards());
		},
		stop() {
			if (frame) cancelAnimationFrame(frame);
			frame = 0;
		}
	};
}
