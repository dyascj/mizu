/**
 * Two drawings of one icon, written so one can reshape into the other. Both
 * paths must use the same commands in the same order with the same count of
 * numbers: each number eases toward the number in the same place in the other
 * path. Where one state lacks a piece of geometry, collapse it to a point or
 * repeat a stroke instead of leaving it out. Paths that do not pair up swap
 * without morphing.
 */
export type MorphShape = {
	/** The path at rest. */
	off: string;
	/** The path once morphed. */
	on: string;
	/** Degrees the whole glyph turns on the way to `on`. */
	rotate?: number;
	/** Fill the path instead of stroking it. */
	filled?: boolean;
};

export const morphShapes = {
	/**
	 * The play triangle is cut into two quads that each become a bar. It sits
	 * right of center, because its visual weight is at its wide end.
	 */
	playPause: {
		off: 'M7.5 5L13 8.5L13 15.5L7.5 19Z M13 8.5L18.5 12L18.5 12L13 15.5Z',
		on: 'M6.5 5L10.5 5L10.5 19L6.5 19Z M13.5 5L17.5 5L17.5 19L13.5 19Z',
		filled: true
	},
	/**
	 * The middle bar folds onto the second diagonal, so the cross keeps three
	 * strokes without a stray dot. A quarter turn lands the cross on itself, so
	 * the lines seem to swing into place.
	 */
	menuClose: {
		off: 'M4.5 7L19.5 7 M4.5 12L19.5 12 M4.5 17L19.5 17',
		on: 'M6.5 6.5L17.5 17.5 M6.5 17.5L17.5 6.5 M6.5 17.5L17.5 6.5',
		rotate: 90
	},
	/** The upright bar lies down onto the other. A half turn keeps the minus level. */
	plusMinus: {
		off: 'M5 12L19 12 M12 5L12 19',
		on: 'M5 12L19 12 M5 12L19 12',
		rotate: 180
	},
	/** The arrow's shaft shrinks into the short leg of a check that its head traces. */
	sendSent: {
		off: 'M5 12L19 12 M13 6L19 12L13 18',
		on: 'M5 12.5L9.5 17 M5 12.5L9.5 17L19 7'
	},
	/** The chevron flattens into a line and bends back the other way. */
	expandCollapse: {
		off: 'M6 9L12 15L18 9',
		on: 'M6 15L12 9L18 15'
	}
} satisfies Record<string, MorphShape>;

export type MorphShapeName = keyof typeof morphShapes;

const number = /-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/gi;

/**
 * Returns a function from progress (0 is `off`, 1 is `on`) to a path, or null
 * when the two paths do not pair up number for number.
 */
export function interpolatePath(off: string, on: string): ((t: number) => string) | null {
	const from = off.match(number)?.map(Number) ?? [];
	const to = on.match(number)?.map(Number) ?? [];
	const template = off.split(number);
	if (from.length !== to.length || on.replace(number, '#') !== off.replace(number, '#')) {
		return null;
	}
	return (t) =>
		template.reduce(
			(path, part, i) =>
				path + part + (i < from.length ? +(from[i] + (to[i] - from[i]) * t).toFixed(3) : ''),
			''
		);
}
