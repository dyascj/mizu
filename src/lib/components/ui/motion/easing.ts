/**
 * JavaScript counterparts of the motion tokens in app.css, for Svelte
 * transitions, the Web Animations API, and anything else that cannot read a
 * CSS custom property. Values must stay in sync with the theme.
 */

export type Easing = (t: number) => number;

/** Durations in milliseconds, matching the --duration-* tokens. */
export const duration = {
	instant: 100,
	fast: 160,
	base: 240,
	slow: 360,
	deliberate: 560,
	ambient: 2000
} as const;

/** Delay between siblings in a sequence, matching --stagger. */
export const stagger = 60;

/** A CSS cubic-bezier() as a function of progress, solved with Newton's method. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): Easing {
	const cx = 3 * x1;
	const bx = 3 * (x2 - x1) - cx;
	const ax = 1 - cx - bx;
	const cy = 3 * y1;
	const by = 3 * (y2 - y1) - cy;
	const ay = 1 - cy - by;

	const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
	const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
	const slopeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;

	function solveX(x: number) {
		let t = x;
		for (let i = 0; i < 8; i++) {
			const error = sampleX(t) - x;
			if (Math.abs(error) < 1e-6) return t;
			const slope = slopeX(t);
			if (Math.abs(slope) < 1e-6) break;
			t -= error / slope;
		}
		// Newton can stall on flat segments; bisection always converges.
		let lower = 0;
		let upper = 1;
		t = x;
		while (upper - lower > 1e-6) {
			if (sampleX(t) < x) lower = t;
			else upper = t;
			t = (lower + upper) / 2;
		}
		return t;
	}

	return (t) => (t <= 0 ? 0 : t >= 1 ? 1 : sampleY(solveX(t)));
}

/** The house curve: a quick start that settles softly. Use for entrances. */
export const easeOut = cubicBezier(0.22, 1, 0.36, 1);
/** Accelerates away. Use for exits. */
export const easeIn = cubicBezier(0.55, 0, 1, 0.45);
/** Symmetric. Use to move between two resting states. */
export const easeInOut = cubicBezier(0.65, 0, 0.35, 1);

export type SpringOptions = {
	/** Period of the undamped oscillation in seconds. Lower is faster. */
	duration: number;
	/** Overshoot from 0 (none) to 1 (endless). */
	bounce: number;
};

/** Position of a unit spring released from 0 toward 1 after `t` seconds. */
export function springPosition({ duration, bounce }: SpringOptions, t: number) {
	const omega = (2 * Math.PI) / duration;
	const zeta = 1 - bounce;
	if (zeta >= 1) return 1 - Math.exp(-omega * t) * (1 + omega * t);

	const damped = omega * Math.sqrt(1 - zeta * zeta);
	return (
		1 -
		Math.exp(-zeta * omega * t) *
			(Math.cos(damped * t) + ((zeta * omega) / damped) * Math.sin(damped * t))
	);
}

/**
 * A spring as a duration and easing pair. The duration is the settling time,
 * so a transition that uses both ends exactly when the spring comes to rest.
 */
export function spring(options: SpringOptions): { duration: number; easing: Easing } {
	let settled = 0;
	for (let ms = 0; ms <= 4000; ms += 1) {
		if (Math.abs(1 - springPosition(options, ms / 1000)) > 0.002) settled = ms;
	}
	const total = Math.ceil(settled / 10) * 10;
	return {
		duration: total,
		easing: (t) => (t <= 0 ? 0 : t >= 1 ? 1 : springPosition(options, (t * total) / 1000))
	};
}

/**
 * The physical parameters behind the theme springs, for code that integrates
 * a spring itself, such as a drag release that must keep its velocity.
 */
export const springOptions = {
	smooth: { duration: 0.42, bounce: 0.12 },
	snappy: { duration: 0.3, bounce: 0 },
	bouncy: { duration: 0.5, bounce: 0.3 }
} as const satisfies Record<string, SpringOptions>;

/** The three springs in the theme: --ease-spring, -snappy, and -bouncy. */
export const springs = {
	/** Default for scale and position: a whisper of overshoot. */
	smooth: spring(springOptions.smooth),
	/** Critically damped and fast. For toggles, thumbs, and indicators. */
	snappy: spring(springOptions.snappy),
	/** Visible overshoot. For playful, celebratory, or tactile moments. */
	bouncy: spring(springOptions.bouncy)
};

/** Physics presets for Svelte's `Spring` class from `svelte/motion`. */
export const springPresets = {
	smooth: { stiffness: 0.15, damping: 0.8 },
	snappy: { stiffness: 0.25, damping: 0.9 },
	bouncy: { stiffness: 0.12, damping: 0.45 }
} as const;
