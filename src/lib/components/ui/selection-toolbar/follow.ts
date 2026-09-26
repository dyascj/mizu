import { springPresets } from '$lib/components/ui/motion';

/**
 * Glides a point toward its target on the critically damped `snappy` spring,
 * so the toolbar follows a growing selection without ever swinging past it.
 * Steps the way Svelte's `Spring` does (so the presets read the same) without
 * importing `svelte/motion`, keeps its velocity when retargeted, writes
 * through `apply` every frame, and sleeps at rest.
 */
export function follower(apply: (x: number, y: number) => void) {
	const { stiffness, damping } = springPresets.snappy;
	const axes = [
		{ value: 0, target: 0, velocity: 0 },
		{ value: 0, target: 0, velocity: 0 }
	];
	let frame = 0;
	let last = 0;

	const tick = (now: number) => {
		// Time in 60 fps frames, capped so a background tab never flings it.
		const frames = Math.min(((now - last) * 60) / 1000 || 1, 4);
		last = now;
		let rested = true;
		for (const axis of axes) {
			const delta = axis.target - axis.value;
			axis.velocity += stiffness * delta - damping * axis.velocity;
			const move = axis.velocity * frames;
			if (Math.abs(move) < 0.01 && Math.abs(delta) < 0.01) {
				axis.value = axis.target;
				axis.velocity = 0;
			} else {
				axis.value += move;
				rested = false;
			}
		}
		apply(axes[0].value, axes[1].value);
		frame = rested ? 0 : requestAnimationFrame(tick);
	};

	return {
		/** Moves there at once. */
		jump(x: number, y: number) {
			cancelAnimationFrame(frame);
			frame = 0;
			for (const [i, value] of [x, y].entries()) {
				axes[i].value = axes[i].target = value;
				axes[i].velocity = 0;
			}
			apply(x, y);
		},
		/** Glides there. */
		set(x: number, y: number) {
			axes[0].target = x;
			axes[1].target = y;
			if (frame) return;
			last = performance.now();
			frame = requestAnimationFrame(tick);
		},
		stop() {
			cancelAnimationFrame(frame);
			frame = 0;
		}
	};
}
