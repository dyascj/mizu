import { prefersReducedMotion } from './media.js';
import { springPresets } from './easing.js';

/** Physics for a `SpringValue`, in the same units as `springPresets`. */
export type SpringPreset = { stiffness: number; damping: number };

export type SpringValueOptions = {
	/** Physics preset. Defaults to `springPresets.smooth`. */
	preset?: SpringPreset;
	/** Called with the new value on every frame, and once on each jump. */
	onUpdate?: (value: number) => void;
	/** Called once each time the spring comes to rest. */
	onRest?: (value: number) => void;
	/** Distance and speed under which the spring snaps to rest. */
	precision?: number;
};

/**
 * A number that follows its target on a spring and keeps its velocity when the
 * target changes, stepped the way `svelte/motion` steps `Spring` so the
 * `springPresets` read the same. Unlike `Spring`, importing it touches no
 * browser API, so components that use it render in SSR and jsdom tests. The
 * animation frame loop sleeps at rest, and reduced motion jumps straight to
 * the target.
 */
export class SpringValue {
	#current: number;
	#last: number;
	#target: number;
	#preset: SpringPreset;
	#precision: number;
	#frame = 0;
	#then = 0;
	#onUpdate?: (value: number) => void;
	#onRest?: (value: number) => void;

	constructor(value: number, options: SpringValueOptions = {}) {
		this.#current = this.#last = this.#target = value;
		this.#preset = options.preset ?? springPresets.smooth;
		this.#precision = options.precision ?? 0.01;
		this.#onUpdate = options.onUpdate;
		this.#onRest = options.onRest;
	}

	/** The value on the current frame. */
	get current() {
		return this.#current;
	}

	/** Where the spring is heading. */
	get target() {
		return this.#target;
	}

	/** Units per 60fps frame, signed toward increasing values. */
	get velocity() {
		return this.#current - this.#last;
	}

	/** True while the spring is moving. */
	get moving() {
		return this.#frame !== 0;
	}

	/**
	 * Heads for `target`, keeping the current velocity. `velocity` adds a kick
	 * in units per frame, for flicks and pops. `instant` or reduced motion
	 * jumps instead.
	 */
	set(
		target: number,
		options: { preset?: SpringPreset; velocity?: number; instant?: boolean } = {}
	) {
		if (options.preset) this.#preset = options.preset;
		if (options.instant || typeof requestAnimationFrame === 'undefined' || prefersReducedMotion()) {
			this.jump(target);
			return;
		}
		this.#target = target;
		if (options.velocity) this.#last = this.#current - options.velocity;
		if (!this.#frame) {
			this.#then = performance.now();
			this.#frame = requestAnimationFrame(this.#tick);
		}
	}

	/** Moves straight to `value` and stops. */
	jump(value: number) {
		this.stop();
		this.#current = this.#last = this.#target = value;
		this.#onUpdate?.(value);
	}

	/** Stops where it is, dropping any velocity. */
	stop() {
		if (this.#frame) cancelAnimationFrame(this.#frame);
		this.#frame = 0;
		this.#last = this.#current;
	}

	/**
	 * Advances by `dt` frames at 60fps. Returns true once at rest. Exposed for
	 * tests and for hosts that drive several springs from one loop.
	 */
	step(dt: number) {
		const velocity = (this.#current - this.#last) / (dt || 1 / 60);
		const force = this.#preset.stiffness * (this.#target - this.#current);
		const damper = this.#preset.damping * velocity;
		const delta = (velocity + force - damper) * dt;
		this.#last = this.#current;
		if (
			Math.abs(delta) < this.#precision &&
			Math.abs(this.#target - this.#current) < this.#precision
		) {
			this.#current = this.#last = this.#target;
			return true;
		}
		this.#current += delta;
		return false;
	}

	#tick = (now: number) => {
		// Clamped so a blocked thread or a hidden tab cannot fling the value, and a
		// frame stamped before the loop started cannot step it backwards.
		const dt = (Math.min(Math.max(now - this.#then, 0), 1000 / 30) * 60) / 1000;
		this.#then = now;
		const settled = this.step(dt);
		this.#onUpdate?.(this.#current);
		if (settled) {
			this.#frame = 0;
			this.#onRest?.(this.#current);
		} else {
			this.#frame = requestAnimationFrame(this.#tick);
		}
	};
}
