/** A shape the pixel spinner steps through. */
export type PixelPattern = 'spiral' | 'snake' | 'pulse' | 'checker';

/**
 * Frames for one pattern on an n by n grid. A frame lists the cells that turn
 * on; everything else fades out slowly, so a moving pattern leaves a short
 * trail without drawing one.
 */
export function buildPattern(pattern: PixelPattern, n: number): number[][] {
	const cells = Array.from({ length: n * n }, (_, i) => i);
	const at = (row: number, column: number) => row * n + column;

	if (pattern === 'spiral') {
		const order: number[] = [];
		let top = 0;
		let left = 0;
		let bottom = n - 1;
		let right = n - 1;
		while (top <= bottom && left <= right) {
			for (let c = left; c <= right; c++) order.push(at(top, c));
			for (let r = top + 1; r <= bottom; r++) order.push(at(r, right));
			if (top < bottom) for (let c = right - 1; c >= left; c--) order.push(at(bottom, c));
			if (left < right) for (let r = bottom - 1; r > top; r--) order.push(at(r, left));
			top++;
			left++;
			bottom--;
			right--;
		}
		// Winds in, then back out, so the loop never jumps.
		const inward = order.map((cell) => [cell]);
		return [...inward, ...inward.slice(1, -1).reverse()];
	}

	if (pattern === 'snake') {
		const order = cells.map((i) => {
			const row = Math.floor(i / n);
			const column = i % n;
			return at(row, row % 2 ? n - 1 - column : column);
		});
		// A two-cell body; the fade draws the tail.
		return order.map((cell, i) => (i ? [order[i - 1], cell] : [cell]));
	}

	if (pattern === 'pulse') {
		const middle = (n - 1) / 2;
		const ring = (i: number) =>
			Math.floor(Math.max(Math.abs(Math.floor(i / n) - middle), Math.abs((i % n) - middle)));
		const rings = Math.floor(middle) + 1;
		const frames: number[][] = [];
		for (let k = 0; k < rings; k++) frames.push(cells.filter((i) => ring(i) === k));
		// One dark beat, so each ripple reads as its own breath.
		return [...frames, []];
	}

	// Checker: the two halves trade places twice.
	const even = cells.filter((i) => (Math.floor(i / n) + (i % n)) % 2 === 0);
	const odd = cells.filter((i) => (Math.floor(i / n) + (i % n)) % 2 === 1);
	return [even, odd, even, odd];
}

/**
 * A check in pixels, in stroke order: the short arm down, then the long arm
 * up. On three by three the long arm turns up in the last column, which still
 * reads as a tick at this size.
 */
export const pixelChecks: Record<3 | 4, number[]> = {
	3: [3, 7, 5, 2],
	4: [8, 13, 10, 7]
};
