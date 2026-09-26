/** A color as hue (0 to 360), saturation, value, and alpha (each 0 to 1). */
export type Hsva = { h: number; s: number; v: number; a: number };

export const clamp = (n: number, lo = 0, hi = 1) => Math.min(Math.max(n, lo), hi);

export function hsvToRgb(h: number, s: number, v: number) {
	const f = (n: number) => {
		const k = (n + h / 60) % 6;
		return Math.round((v - v * s * Math.max(0, Math.min(k, 4 - k, 1))) * 255);
	};
	return [f(5), f(3), f(1)] as const;
}

/**
 * Grey has no hue and black no saturation, so both keep what the color had
 * before instead of snapping to 0. That stops the hue thumb jumping home when a
 * hex like #808080 or #000 comes in.
 */
export function rgbToHsv(r: number, g: number, b: number, previous: Hsva) {
	const [R, G, B] = [r / 255, g / 255, b / 255];
	const max = Math.max(R, G, B);
	const d = max - Math.min(R, G, B);
	let h = previous.h;
	if (d !== 0) {
		const sector = max === R ? ((G - B) / d) % 6 : max === G ? (B - R) / d + 2 : (R - G) / d + 4;
		h = (sector * 60 + 360) % 360;
	}
	return { h, s: max === 0 ? previous.s : d / max, v: max };
}

/** Reads #RGB, #RGBA, #RRGGBB, or #RRGGBBAA, with or without the #. */
export function parseHex(input: string) {
	const hex = input.trim().replace(/^#/, '');
	if (!/^([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(hex)) return null;
	const full = hex.length <= 4 ? [...hex].map((c) => c + c).join('') : hex;
	const byte = (i: number) => parseInt(full.slice(i, i + 2), 16);
	return { r: byte(0), g: byte(2), b: byte(4), a: full.length === 8 ? byte(6) / 255 : 1 };
}

/** Uppercase #RRGGBB, with an alpha pair only when the color is translucent. */
export function toHex({ h, s, v, a }: Hsva) {
	const pair = (n: number) => n.toString(16).padStart(2, '0');
	const alpha = Math.round(a * 255);
	return (
		'#' +
		hsvToRgb(h, s, v).map(pair).join('') +
		(alpha < 255 ? pair(alpha) : '')
	).toUpperCase();
}

export function fromHex(hex: string, previous: Hsva): Hsva | null {
	const rgba = parseHex(hex);
	if (!rgba) return null;
	return { ...rgbToHsv(rgba.r, rgba.g, rgba.b, previous), a: rgba.a };
}

/**
 * How far a key moves a channel: arrows one step, Shift or the Page keys ten,
 * Home and End to the ends. Null for keys that do not move it.
 */
export function keyStep(event: KeyboardEvent, step: number) {
	const big = step * 10;
	const unit = event.shiftKey ? big : step;
	switch (event.key) {
		case 'ArrowRight':
		case 'ArrowUp':
			return unit;
		case 'ArrowLeft':
		case 'ArrowDown':
			return -unit;
		case 'PageUp':
			return big;
		case 'PageDown':
			return -big;
		case 'Home':
			return -Infinity;
		case 'End':
			return Infinity;
	}
	return null;
}
