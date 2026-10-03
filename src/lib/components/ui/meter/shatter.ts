import type { Attachment } from 'svelte/attachments';
import { duration } from '$lib/components/ui/motion';

export type ShatterOptions = {
	/** Where the cleared slice began, as a percentage of the bar's width from its start edge. */
	start: number;
	/** The slice's width, as a percentage of the bar's width. */
	width: number;
	/** Any CSS color; the slice's own resolved fill. */
	color: string;
	/** Room above the bar, in pixels, that the canvas extends into. */
	above: number;
	/** The bar's height in pixels. */
	bar: number;
	/** Where the pieces land, in pixels below the bar. */
	shelf: number;
};

type Shard = {
	x: number;
	y: number;
	vx: number;
	vy: number;
	rot: number;
	spin: number;
	points: [number, number][];
	alpha: number;
	bounces: number;
	resting: boolean;
	life: number;
};

type Dust = { x: number; y: number; vx: number; vy: number; r: number; a: number; life: number };

/** Pixels per second squared. */
const GRAVITY = 900;

/**
 * The cleared slice breaks up: its own area splits into jagged shards that
 * spray out from the middle, arc, spin, and fall, bounce once or twice on a
 * shelf below the bar, and skid to a stop before fading, while a little dust
 * drifts down against the air. The canvas only lives for the second or so
 * this takes, and the frame loop stops when the last piece is gone.
 */
export function shatter(options: ShatterOptions): Attachment<HTMLCanvasElement> {
	return (canvas) => {
		const context = canvas.getContext?.('2d');
		if (!context || typeof requestAnimationFrame === 'undefined') return;
		const ctx = context;
		const { above, bar, shelf, color } = options;
		const W = canvas.offsetWidth;
		const H = canvas.offsetHeight;
		const dpr = window.devicePixelRatio || 1;
		canvas.width = W * dpr;
		canvas.height = H * dpr;
		ctx.scale(dpr, dpr);

		const rand = Math.random;
		// The slice squashes to under half its height before it breaks.
		const squashed = bar * 0.45;
		// The slice keeps its 2px gap at its end edge, which is the left in right-to-left text.
		const span = (options.width / 100) * W;
		const offset = (options.start / 100) * W;
		const rtl = getComputedStyle(canvas).direction === 'rtl';
		const x0 = rtl ? W - offset - span + 2 : offset;
		const w = Math.max(6, span - 2);
		const y0 = above + (bar - squashed) / 2;
		const cx = x0 + w / 2;
		const floor = above + bar + shelf;
		const crush = duration.instant / 1000;

		const cols = Math.max(3, Math.round(w / 2.6));
		const rows = 3;
		const shards: Shard[] = [];
		for (let r = 0; r < rows; r++) {
			for (let c = 0; c < cols; c++) {
				const cw = w / cols;
				const ch = squashed / rows;
				const x = x0 + (c + 0.5) * cw;
				const y = y0 + (r + 0.5) * ch;
				const size = Math.max(cw, ch * 1.8) * (0.7 + rand() * 0.6);
				const sides = 4 + Math.floor(rand() * 2);
				const points = Array.from({ length: sides }, (_, i): [number, number] => {
					const a = (i / sides) * Math.PI * 2 + rand() * 0.6;
					const d = (size / 2) * (0.6 + rand() * 0.5);
					return [Math.cos(a) * d, Math.sin(a) * d];
				});
				// -1 at the left edge, 1 at the right: pieces fly away from the middle.
				const out = (x - cx) / (w / 2);
				shards.push({
					x,
					y,
					vx: out * 70 + (rand() - 0.5) * 60,
					vy: -(30 + rand() * 110) - (rows - r) * 12,
					rot: rand() * Math.PI,
					spin: (rand() - 0.5) * 16,
					points,
					alpha: 0.75 + rand() * 0.25,
					bounces: 0,
					resting: false,
					life: 1
				});
			}
		}
		const dust: Dust[] = Array.from({ length: 34 }, () => ({
			x: cx + (rand() - 0.5) * w,
			y: y0 + rand() * squashed,
			vx: (rand() - 0.5) * 110,
			vy: -(8 + rand() * 55),
			r: 0.4 + rand() * 0.9,
			a: 0.35 + rand() * 0.4,
			life: 0.8 + rand() * 0.5
		}));

		let frame = 0;
		let start: number | undefined;
		let last = 0;
		const tick = (now: number) => {
			start ??= now;
			const t = (now - start) / 1000;
			const dt = Math.min(0.033, (now - (last || now)) / 1000);
			last = now;
			ctx.clearRect(0, 0, W, H);
			// Waits out the squash, then the shards take over from the slice.
			if (t < crush) {
				frame = requestAnimationFrame(tick);
				return;
			}
			let alive = false;
			ctx.fillStyle = color;

			for (const s of shards) {
				if (s.life <= 0) continue;
				alive = true;
				if (!s.resting) {
					s.vy += GRAVITY * dt;
					s.x += s.vx * dt;
					s.y += s.vy * dt;
					s.rot += s.spin * dt;
					if (s.y >= floor) {
						s.y = floor;
						// Lands, bounces a little lower each time, then skids.
						if (s.vy > 70 && s.bounces < 2) {
							s.vy *= -0.3;
							s.vx *= 0.55;
							s.spin *= 0.5;
							s.bounces++;
						} else {
							s.vy = 0;
							s.resting = true;
						}
					}
				} else {
					s.vx *= 1 - 8 * dt;
					s.x += s.vx * dt;
					s.spin *= 1 - 8 * dt;
					s.rot += s.spin * dt;
				}
				if (s.resting || t > 1) s.life -= dt * 2.4;

				ctx.save();
				ctx.translate(s.x, s.y);
				ctx.rotate(s.rot);
				ctx.beginPath();
				s.points.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
				ctx.closePath();
				// Faces catch the light differently as they tumble.
				const light = 0.85 + 0.15 * Math.sin(s.rot * 2);
				ctx.globalAlpha = Math.max(0, Math.min(1, s.life)) * s.alpha * light;
				ctx.fill();
				ctx.restore();
			}

			for (const d of dust) {
				if (d.life <= 0) continue;
				alive = true;
				d.vx *= 1 - 3.5 * dt;
				d.vy = (d.vy + 140 * dt) * (1 - 1.8 * dt);
				d.x += d.vx * dt;
				d.y += d.vy * dt;
				d.life -= dt;
				ctx.globalAlpha = Math.max(0, d.a * Math.min(1, d.life * 1.5));
				ctx.beginPath();
				ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
				ctx.fill();
			}

			if (alive) frame = requestAnimationFrame(tick);
			else ctx.clearRect(0, 0, W, H);
		};
		frame = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frame);
	};
}
