import { prefersReducedMotion } from '$lib/components/ui/motion';

/** How one burst of confetti leaves its origin. */
export type ConfettiBurst = {
	/** Pieces in the burst. */
	count?: number;
	/** Half the angle of the cone around straight up, in degrees. 180 throws in every direction. */
	spread?: number;
	/** Slowest and fastest launch speed, in pixels per second. */
	speed?: [number, number];
	/** Shortest and longest life of a piece, in seconds. */
	life?: [number, number];
	/** How far across the origin's width pieces start, as a share of that width. */
	width?: number;
	/** Scale for the size of each piece. */
	size?: number;
	/** Add long streamers among the squares and slips. */
	streamers?: boolean;
	/**
	 * Colors as custom properties (`--primary`) or any CSS color, read in the
	 * current theme when the burst fires. Defaults to the neutral ink tones.
	 */
	colors?: string[];
};

/** Where a burst starts: an element, a box, or a point in viewport pixels. */
export type ConfettiOrigin = Element | DOMRect | { x: number; y: number; width?: number };

/** Two ready-made bursts: a small upward pop and a full-screen blast. */
export const confettiBursts = {
	/** Enough to read as a pop, few enough that a frame stays well under a millisecond. */
	pop: {
		count: 60,
		spread: 34,
		speed: [520, 1000],
		life: [1.5, 2.3],
		width: 1 / 3,
		size: 1
	},
	/** Every direction, twice as fast, lingering longer, with some bigger pieces and streamers. */
	blast: {
		count: 360,
		spread: 180,
		speed: [700, 2100],
		life: [2, 3.4],
		width: 1 / 2,
		size: 1.35,
		streamers: true
	}
} satisfies Record<string, ConfettiBurst>;

/** Mostly primary ink with quieter grays, so it celebrates without shouting and follows the theme. */
const neutral = ['--primary', '--primary', '--muted-foreground', '--input'];

// Pixels per second squared. Heavy drag makes paper float down instead of
// dropping like a stone.
const GRAVITY = 650;
const DRAG = 5;
/** Share of a piece's life spent fading out, so nothing blinks away. */
const FADE = 0.3;
/** A frame after a hitch is capped, so a stalled tab never teleports pieces. */
const MAX_STEP = 1 / 30;

type Piece = {
	x: number;
	y: number;
	vx: number;
	vy: number;
	w: number;
	h: number;
	rotation: number;
	spin: number;
	// The flip reads as paper turning over, the sway as it drifting on the way down.
	flipSpeed: number;
	swaySpeed: number;
	sway: number;
	phase: number;
	age: number;
	life: number;
	color: string;
	alpha: number;
};

let canvas: HTMLCanvasElement | null = null;
let pieces: Piece[] = [];
let frame = 0;
let last = 0;

const between = (a: number, b: number) => a + Math.random() * (b - a);

function fit() {
	if (!canvas) return;
	// Device pixels, so pieces stay crisp.
	const ratio = window.devicePixelRatio || 1;
	canvas.width = Math.round(window.innerWidth * ratio);
	canvas.height = Math.round(window.innerHeight * ratio);
}

/** One canvas over the viewport, created on the first burst and removed once the air is clear. */
function layer() {
	if (canvas?.isConnected) return canvas;
	canvas = document.createElement('canvas');
	canvas.setAttribute('aria-hidden', 'true');
	canvas.dataset.slot = 'confetti';
	Object.assign(canvas.style, {
		position: 'fixed',
		inset: '0',
		width: '100%',
		height: '100%',
		pointerEvents: 'none',
		zIndex: '100'
	});
	document.body.append(canvas);
	fit();
	window.addEventListener('resize', fit);
	return canvas;
}

function clear() {
	window.removeEventListener('resize', fit);
	canvas?.remove();
	canvas = null;
	frame = 0;
}

function tick(now: number) {
	const context = canvas?.getContext('2d');
	if (!canvas || !context) return clear();
	const dt = Math.min(Math.max(now - last, 0) / 1000, MAX_STEP);
	last = now;
	const ratio = window.devicePixelRatio || 1;
	const decay = Math.exp(-DRAG * dt);

	context.setTransform(1, 0, 0, 1, 0, 0);
	context.clearRect(0, 0, canvas.width, canvas.height);

	const alive: Piece[] = [];
	for (const p of pieces) {
		p.age += dt;
		if (p.age >= p.life) continue;
		p.vx *= decay;
		p.vy = p.vy * decay + GRAVITY * dt;
		p.x += (p.vx + Math.sin(p.age * p.swaySpeed + p.phase) * p.sway) * dt;
		p.y += p.vy * dt;
		p.rotation += p.spin * dt;

		const flip = Math.cos(p.age * p.flipSpeed + p.phase);
		const cos = Math.cos(p.rotation);
		const sin = Math.sin(p.rotation);
		context.globalAlpha = p.alpha * Math.min((p.life - p.age) / p.life / FADE, 1);
		context.fillStyle = p.color;
		// Rotate, then squash one axis: a cheap stand-in for a tumble in 3D.
		context.setTransform(
			ratio * cos,
			ratio * sin,
			-ratio * sin * flip,
			ratio * cos * flip,
			ratio * p.x,
			ratio * p.y
		);
		context.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
		alive.push(p);
	}
	pieces = alive;
	context.globalAlpha = 1;
	// The loop lives only while something is in the air.
	if (alive.length > 0) frame = requestAnimationFrame(tick);
	else clear();
}

/**
 * Resolves each color where the burst comes from, so a themed section or a
 * dark island colors its own confetti; canvas cannot read custom properties
 * itself. A hidden probe does the reading, so nothing on the page transitions.
 */
function palette(scope: Element, colors: string[]) {
	const probe = document.createElement('span');
	probe.setAttribute('aria-hidden', 'true');
	probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;transition:none';
	scope.append(probe);
	const resolved = colors.map((color) => {
		probe.style.color = color.startsWith('--') ? `var(${color})` : color;
		return getComputedStyle(probe).color;
	});
	probe.remove();
	return resolved;
}

function locate(origin: ConfettiOrigin) {
	if (origin instanceof Element) {
		const box = origin.getBoundingClientRect();
		return { x: box.left + box.width / 2, y: box.top + box.height / 2, width: box.width };
	}
	if ('left' in origin) {
		return {
			x: origin.left + origin.width / 2,
			y: origin.top + origin.height / 2,
			width: origin.width
		};
	}
	return { x: origin.x, y: origin.y, width: origin.width ?? 0 };
}

/** Extra options for a burst. */
export type ConfettiOptions = {
	/**
	 * The element whose theme the colors resolve in. Defaults to `origin` when
	 * it is an element, otherwise the page.
	 */
	theme?: Element;
};

/**
 * Throws a burst of confetti from `origin` over the whole viewport. Returns
 * false, and throws nothing, when the reader prefers reduced motion or there
 * is no browser.
 *
 * ```ts
 * confetti(button, confettiBursts.pop);
 * ```
 */
export function confetti(
	origin: ConfettiOrigin,
	burst: ConfettiBurst = confettiBursts.pop,
	{ theme }: ConfettiOptions = {}
) {
	if (typeof window === 'undefined' || prefersReducedMotion()) return false;
	const {
		count = 60,
		spread = 34,
		speed = [520, 1000],
		life = [1.5, 2.3],
		width = 1 / 3,
		size = 1,
		streamers = false,
		colors = neutral
	} = burst;
	layer();
	const inks = palette(theme ?? (origin instanceof Element ? origin : document.body), colors);
	const { x, y, width: across } = locate(origin);
	const cone = (Math.min(Math.max(spread, 0), 180) * Math.PI) / 180;

	for (let i = 0; i < count; i++) {
		const angle = -Math.PI / 2 + between(-cone, cone);
		const velocity = between(speed[0], speed[1]);
		const shape = Math.random();
		const w = between(5, 9) * size;
		pieces.push({
			x: x + between(-across * width, across * width),
			y,
			vx: Math.cos(angle) * velocity,
			vy: Math.sin(angle) * velocity,
			w,
			// Squares, slips, and now and then a long streamer.
			h:
				shape < 0.25
					? w
					: streamers && shape > 0.9
						? w * between(1.6, 2.4)
						: w * between(0.4, 0.55),
			rotation: between(0, Math.PI * 2),
			spin: between(-6, 6),
			flipSpeed: between(6, 14),
			swaySpeed: between(3, 6),
			sway: between(15, 40),
			phase: between(0, Math.PI * 2),
			age: 0,
			life: between(life[0], life[1]),
			color: inks[Math.floor(Math.random() * inks.length)],
			alpha: between(0.75, 1)
		});
	}
	if (!frame) {
		last = performance.now();
		frame = requestAnimationFrame(tick);
	}
	return true;
}
