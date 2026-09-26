export type Side = 'left' | 'right' | 'top' | 'bottom';
export type Rect = { x: number; y: number; w: number; h: number };
export type Point = { x: number; y: number };

/** Distance between a hotspot and the near edge of its card. */
export const GAP = 48;
/** Breathing room kept between the card and the subject. */
export const SUBJECT_GAP = 12;
/** Nothing gets closer than this to the stage edge. */
export const MARGIN = 12;

function overlap(a: Rect, b: Rect) {
	const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
	const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
	return w > 0 && h > 0 ? w * h : 0;
}

/**
 * Where a `w` by `h` card should sit to describe the point `(px, py)` on a
 * `W` by `H` stage. It tries each side three ways (tucked in next to the
 * point, pushed just clear of the subject, and pushed to the stage edge) and
 * keeps the cheapest: hiding any hotspot costs the most, covering the subject
 * comes next, and then the shortest leader line wins.
 */
export function place(
	px: number,
	py: number,
	W: number,
	H: number,
	w: number,
	h: number,
	others: Point[],
	subject: Rect | null
) {
	const clampX = (x: number) => Math.min(Math.max(x, MARGIN), W - w - MARGIN);
	const clampY = (y: number) => Math.min(Math.max(y, MARGIN), H - h - MARGIN);
	const s = subject;
	const options: { side: Side; x: number; y: number }[] = [
		{ side: 'right', x: px + GAP, y: py - h / 2 },
		{ side: 'right', x: s ? Math.max(px + GAP, s.x + s.w + SUBJECT_GAP) : W, y: py - h / 2 },
		{ side: 'right', x: W, y: py - h / 2 },
		{ side: 'left', x: px - GAP - w, y: py - h / 2 },
		{ side: 'left', x: s ? Math.min(px - GAP - w, s.x - SUBJECT_GAP - w) : 0, y: py - h / 2 },
		{ side: 'left', x: 0, y: py - h / 2 },
		{ side: 'bottom', x: px - w / 2, y: py + GAP },
		{ side: 'bottom', x: px - w / 2, y: s ? Math.max(py + GAP, s.y + s.h + SUBJECT_GAP) : H },
		{ side: 'bottom', x: px - w / 2, y: H },
		{ side: 'top', x: px - w / 2, y: py - GAP - h },
		{ side: 'top', x: px - w / 2, y: s ? Math.min(py - GAP - h, s.y - SUBJECT_GAP - h) : 0 },
		{ side: 'top', x: px - w / 2, y: 0 }
	];
	const scored = options.map((option) => {
		const x = clampX(option.x);
		const y = clampY(option.y);
		const card = { x, y, w, h };
		const hidden = [{ x: px, y: py }, ...others].filter(
			(p) => p.x > x - 8 && p.x < x + w + 8 && p.y > y - 8 && p.y < y + h + 8
		).length;
		const covered = s ? overlap(card, s) : 0;
		const ex = Math.min(Math.max(px, x), x + w);
		const ey = Math.min(Math.max(py, y), y + h);
		const cost = hidden * 1e7 + covered * 4 + Math.hypot(ex - px, ey - py);
		return { side: option.side, x, y, cost };
	});
	return scored.reduce((best, next) => (next.cost < best.cost ? next : best));
}
