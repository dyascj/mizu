import { springPresets } from '$lib/components/ui/motion';

type Preset = { stiffness: number; damping: number };

/**
 * A velocity-preserving spring for one number, stepped the way Svelte's
 * `Spring` steps (so the `springPresets` read the same), without importing
 * `svelte/motion`. It reports its speed in units per second, which is what
 * lets a card lean into the direction it is being pulled.
 */
class Axis {
	value = 0;
	target = 0;
	/** Change per 60 fps frame, as Svelte's spring measures it. */
	velocity = 0;
	/** Change per second over the last step. */
	speed = 0;
	constructor(private preset: Preset) {}

	jump(value: number) {
		this.value = this.target = value;
		this.velocity = this.speed = 0;
	}

	/** Advances by `frames` 60 fps frames. Returns true once at rest. */
	step(frames: number) {
		const delta = this.target - this.value;
		const acceleration = this.preset.stiffness * delta - this.preset.damping * this.velocity;
		this.velocity += acceleration;
		const move = this.velocity * frames;
		if (Math.abs(move) < 0.01 && Math.abs(delta) < 0.01) {
			this.value = this.target;
			this.velocity = this.speed = 0;
			return true;
		}
		this.value += move;
		this.speed = (move * 60) / frames;
		return false;
	}
}

/** Degrees the card leans at full speed, and the speed in px/s that earns it. */
const MAX_TILT = 7;
const TILT_AT_SPEED = 1400;

/**
 * Drives a card's horizontal position toward a target on a loose spring, and
 * its lean from how fast it is travelling on a tighter one. Writes through
 * `apply` every frame and sleeps once both have settled.
 */
export function follower(apply: (x: number, tilt: number) => void) {
	const x = new Axis(springPresets.smooth);
	const tilt = new Axis(springPresets.snappy);
	let frame = 0;
	let last = 0;

	const tick = (now: number) => {
		// Svelte counts time in 60 fps frames; cap long gaps so a background tab
		// never flings the card.
		const frames = Math.min(((now - last) * 60) / 1000 || 1, 4);
		last = now;
		const xRested = x.step(frames);
		tilt.target = Math.max(-MAX_TILT, Math.min(MAX_TILT, (-x.speed / TILT_AT_SPEED) * MAX_TILT));
		const tiltRested = tilt.step(frames);
		apply(x.value, tilt.value);
		frame = xRested && tiltRested ? 0 : requestAnimationFrame(tick);
	};

	const wake = () => {
		if (frame) return;
		last = performance.now();
		frame = requestAnimationFrame(tick);
	};

	return {
		/** Moves there at once, upright. */
		jump(value: number) {
			cancelAnimationFrame(frame);
			frame = 0;
			x.jump(value);
			tilt.jump(0);
			apply(value, 0);
		},
		/** Trails toward the value. */
		set(value: number) {
			x.target = value;
			wake();
		},
		stop() {
			cancelAnimationFrame(frame);
			frame = 0;
		}
	};
}
