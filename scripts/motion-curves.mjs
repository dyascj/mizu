/**
 * Generate the spring easing tokens in src/app.css.
 *
 * CSS cannot run a physics simulation, so each spring is sampled into a
 * `linear()` easing whose duration equals the spring's settling time. The
 * parameters use the perceptual model popularized by SwiftUI: `duration` is the
 * period of the undamped oscillation and `bounce` (0 to 1) is the overshoot.
 *
 * Run: node scripts/motion-curves.mjs
 * The repository contract test fails if app.css drifts from this output.
 */
import { fileURLToPath } from 'node:url';

export const springs = {
	spring: { duration: 0.42, bounce: 0.12 },
	'spring-snappy': { duration: 0.3, bounce: 0 },
	'spring-bouncy': { duration: 0.5, bounce: 0.3 }
};

const SAMPLES = 36;
const SETTLE_TOLERANCE = 0.002;

/** Position of a unit spring released from 0 toward 1 at time `t` in seconds. */
export function springPosition({ duration, bounce }, t) {
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

/** Time in milliseconds after which the spring stays within tolerance of rest. */
export function settlingTime(spring) {
	let settled = 0;
	for (let ms = 0; ms <= 4000; ms += 1) {
		if (Math.abs(1 - springPosition(spring, ms / 1000)) > SETTLE_TOLERANCE) settled = ms;
	}
	return Math.ceil(settled / 10) * 10;
}

export function springToken(spring) {
	const duration = settlingTime(spring);
	const points = Array.from({ length: SAMPLES + 1 }, (_, index) =>
		index === SAMPLES
			? 1
			: Number(springPosition(spring, (duration / 1000) * (index / SAMPLES)).toFixed(4))
	);
	return { duration, easing: `linear(${points.join(', ')})` };
}

export function motionTokens() {
	return Object.entries(springs).map(([name, spring]) => ({ name, ...springToken(spring) }));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	for (const { name, duration, easing } of motionTokens()) {
		console.log(`--duration-${name}: ${duration}ms;`);
		console.log(`--ease-${name}: ${easing};`);
	}
}
