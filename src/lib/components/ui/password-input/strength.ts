/**
 * How strong a password looks, from 0 (empty) through 1 (weak) to 4
 * (strong). Length matters most, so anything under eight characters stays
 * weak however varied it is; past that, length and a mix of lowercase,
 * uppercase, digits, and symbols raise it. A quick hint for people, not a
 * security check.
 */
export function passwordStrength(password: string): 0 | 1 | 2 | 3 | 4 {
	if (password === '') return 0;
	if (password.length < 8) return 1;
	const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((kind) =>
		kind.test(password)
	).length;
	let score = 1;
	if (password.length >= 12) score++;
	if (variety >= 2) score++;
	if (variety >= 3) score++;
	return Math.min(score, 4) as 1 | 2 | 3 | 4;
}

let canvas: HTMLCanvasElement | null = null;

/**
 * Measures text the way `input` draws it. Returns null where there is no
 * canvas, such as on the server or in tests.
 */
export function textMeasurer(input: HTMLInputElement) {
	canvas ??= typeof document === 'undefined' ? null : document.createElement('canvas');
	let context: CanvasRenderingContext2D | null = null;
	try {
		context = canvas?.getContext('2d') ?? null;
	} catch {
		// jsdom has canvas elements without a 2D context.
	}
	if (!context) return null;
	const style = getComputedStyle(input);
	context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
	const ctx = context;
	return (text: string) => ctx.measureText(text).width;
}
