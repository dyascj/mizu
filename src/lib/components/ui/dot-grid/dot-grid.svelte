<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { springPresets } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** Content laid over the grid, such as a heading. The grid still feels the pointer beneath it. */
		children?: Snippet;
		/** Distance between dots in pixels. */
		spacing?: number;
		/** The surface element. */
		ref?: HTMLDivElement | null;
		/** Classes for the surface. Size it here; it defaults to a 3 by 2 panel up to 480px wide. */
		class?: string;
	};

	let {
		children,
		spacing = 16,
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	const DOT = 1.5;
	/** Dots within this radius feel the pointer; the falloff is quadratic to the edge. */
	const FIELD = 88;
	/** Far enough to read as a push, small enough that neighbours never overlap. */
	const PUSH = 7;
	const GROW = 1.3;
	/**
	 * The bouncy spring in seconds instead of frames: slightly underdamped, so
	 * dots spring back with a hint of give instead of sliding home.
	 */
	const STIFFNESS = springPresets.bouncy.stiffness * 3600;
	const DAMPING = springPresets.bouncy.damping * 60;
	/** A click ring crosses a 480px grid in about 0.9s. */
	const RING_SPEED = 620;
	const RING_WIDTH = 22;
	const RING_PUSH = 9;
	const REST = 0.01;

	let canvas = $state<HTMLCanvasElement | null>(null);
	let reduce = $state(false);

	$effect(() => {
		if (typeof window.matchMedia !== 'function') return;
		const media = window.matchMedia('(prefers-reduced-motion: reduce)');
		const sync = () => (reduce = media.matches);
		sync();
		media.addEventListener('change', sync);
		return () => media.removeEventListener('change', sync);
	});

	$effect(() => {
		const wrap = ref;
		const surface = canvas;
		const gap = spacing;
		const still = reduce;
		const ctx = surface?.getContext('2d');
		if (!wrap || !surface || !ctx || gap <= 0) return;
		return field(wrap, surface, ctx, gap, still);
	});

	type Ring = { x: number; y: number; born: number };

	function field(
		wrap: HTMLDivElement,
		surface: HTMLCanvasElement,
		ctx: CanvasRenderingContext2D,
		gap: number,
		still: boolean
	) {
		let width = 0;
		let height = 0;
		let count = 0;
		// Flat typed arrays keep the per-frame loop allocation free.
		let baseX = new Float32Array(0);
		let baseY = new Float32Array(0);
		let offX = new Float32Array(0);
		let offY = new Float32Array(0);
		let velX = new Float32Array(0);
		let velY = new Float32Array(0);
		let size = new Float32Array(0);
		let velSize = new Float32Array(0);

		let pointer: { x: number; y: number } | null = null;
		let rings: Ring[] = [];
		let frame = 0;
		let last = 0;
		let visible = true;
		let dim = '';
		let lit = '';

		const readColors = () => {
			// Computed colors resolve the theme's custom properties to real colors.
			dim = getComputedStyle(surface).color;
			lit = getComputedStyle(wrap).color;
		};

		const layout = () => {
			const dpr = window.devicePixelRatio || 1;
			width = wrap.clientWidth;
			height = wrap.clientHeight;
			surface.width = Math.round(width * dpr);
			surface.height = Math.round(height * dpr);
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

			const cols = Math.max(0, Math.floor(width / gap));
			const rows = Math.max(0, Math.floor(height / gap));
			// Centered, so the margins match on every side.
			const startX = (width - (cols - 1) * gap) / 2;
			const startY = (height - (rows - 1) * gap) / 2;
			count = cols * rows;
			baseX = new Float32Array(count);
			baseY = new Float32Array(count);
			offX = new Float32Array(count);
			offY = new Float32Array(count);
			velX = new Float32Array(count);
			velY = new Float32Array(count);
			size = new Float32Array(count);
			velSize = new Float32Array(count);
			for (let r = 0, i = 0; r < rows; r++) {
				for (let c = 0; c < cols; c++, i++) {
					baseX[i] = startX + c * gap;
					baseY[i] = startY + r * gap;
				}
			}
		};

		const draw = () => {
			ctx.clearRect(0, 0, width, height);
			ctx.fillStyle = dim;
			// Resting dots sit back as texture; the lit pass supplies the contrast.
			ctx.globalAlpha = 0.5;
			ctx.beginPath();
			for (let i = 0; i < count; i++) {
				const x = baseX[i] + offX[i];
				const y = baseY[i] + offY[i];
				const r = DOT * (1 + (still ? 0 : GROW) * size[i]);
				ctx.moveTo(x + r, y);
				ctx.arc(x, y, r, 0, Math.PI * 2);
			}
			ctx.fill();
			// Only the few energised dots get a second, brighter pass.
			ctx.fillStyle = lit;
			for (let i = 0; i < count; i++) {
				const s = size[i];
				if (s < 0.02) continue;
				const x = baseX[i] + offX[i];
				const y = baseY[i] + offY[i];
				const r = DOT * (1 + (still ? 0 : GROW) * s);
				ctx.globalAlpha = Math.min(1, s);
				ctx.beginPath();
				ctx.arc(x, y, r, 0, Math.PI * 2);
				ctx.fill();
			}
			ctx.globalAlpha = 1;
		};

		/** The pull on every dot right now, written into the spring targets. */
		const step = (now: number) => {
			// Clamped so a dropped frame or a background tab cannot explode the springs.
			const dt = Math.min((now - last) / 1000, 1 / 30);
			last = now;
			const t = now / 1000;
			const diagonal = Math.hypot(width, height);
			rings = rings.filter((ring) => (t - ring.born) * RING_SPEED < diagonal + RING_WIDTH);

			let moving = rings.length > 0;
			for (let i = 0; i < count; i++) {
				let targetX = 0;
				let targetY = 0;
				let targetSize = 0;
				if (pointer) {
					const dx = baseX[i] - pointer.x;
					const dy = baseY[i] - pointer.y;
					const d = Math.hypot(dx, dy);
					if (d < FIELD) {
						const f = (1 - d / FIELD) ** 2;
						targetSize = f;
						if (!still && d > 0.001) {
							targetX = (dx / d) * PUSH * f;
							targetY = (dy / d) * PUSH * f;
						}
					}
				}
				for (const ring of rings) {
					const dx = baseX[i] - ring.x;
					const dy = baseY[i] - ring.y;
					const d = Math.hypot(dx, dy);
					const radius = (t - ring.born) * RING_SPEED;
					const band = Math.exp(-(((d - radius) / RING_WIDTH) ** 2));
					// The ring weakens as it spreads, like a real shockwave.
					const f = band * Math.max(0, 1 - radius / diagonal);
					if (f < 0.01 || d < 0.001) continue;
					targetX += (dx / d) * RING_PUSH * f;
					targetY += (dy / d) * RING_PUSH * f;
					targetSize = Math.max(targetSize, f);
				}

				if (still) {
					// No motion: the dots near the pointer simply light up.
					size[i] = targetSize;
					continue;
				}

				velX[i] += (STIFFNESS * (targetX - offX[i]) - DAMPING * velX[i]) * dt;
				velY[i] += (STIFFNESS * (targetY - offY[i]) - DAMPING * velY[i]) * dt;
				velSize[i] += (STIFFNESS * (targetSize - size[i]) - DAMPING * velSize[i]) * dt;
				offX[i] += velX[i] * dt;
				offY[i] += velY[i] * dt;
				size[i] = Math.max(0, size[i] + velSize[i] * dt);

				// Settled means at its target, not at home: a resting pointer costs nothing.
				if (
					Math.abs(targetX - offX[i]) > REST ||
					Math.abs(targetY - offY[i]) > REST ||
					Math.abs(targetSize - size[i]) > REST ||
					Math.abs(velX[i]) > REST ||
					Math.abs(velY[i]) > REST ||
					Math.abs(velSize[i]) > REST
				) {
					moving = true;
				}
			}
			draw();
			frame = moving && visible ? requestAnimationFrame(step) : 0;
		};

		/** Sleeps once everything settles; any input wakes it. */
		const wake = () => {
			if (frame || !visible) return;
			last = performance.now();
			frame = requestAnimationFrame(step);
		};

		const local = (event: PointerEvent) => {
			const box = surface.getBoundingClientRect();
			return { x: event.clientX - box.left, y: event.clientY - box.top };
		};

		const onmove = (event: PointerEvent) => {
			if (event.pointerType === 'touch') return;
			pointer = local(event);
			wake();
		};
		const onleave = () => {
			pointer = null;
			wake();
		};
		const ondown = (event: PointerEvent) => {
			if (still || event.button !== 0) return;
			// Three rings at once is already a lot; older ones make way.
			rings = [...rings.slice(-2), { ...local(event), born: performance.now() / 1000 }];
			wake();
		};

		readColors();
		layout();
		draw();

		const resize = new ResizeObserver(() => {
			layout();
			draw();
		});
		resize.observe(wrap);

		// Colors follow the theme, repainted on the next frame once it applies.
		let colorFrame = 0;
		const repaint = () => {
			cancelAnimationFrame(colorFrame);
			colorFrame = requestAnimationFrame(() => {
				readColors();
				if (!frame) draw();
			});
		};
		const theme = new MutationObserver(repaint);
		theme.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['class', 'data-theme', 'style']
		});
		const scheme = window.matchMedia?.('(prefers-color-scheme: dark)');
		scheme?.addEventListener('change', repaint);

		// Offscreen, the loop stops entirely.
		const seen = new IntersectionObserver(([entry]) => {
			visible = entry.isIntersecting;
			if (visible) wake();
			else if (frame) {
				cancelAnimationFrame(frame);
				frame = 0;
			}
		});
		seen.observe(wrap);

		wrap.addEventListener('pointermove', onmove);
		wrap.addEventListener('pointerleave', onleave);
		wrap.addEventListener('pointerdown', ondown);

		return () => {
			cancelAnimationFrame(frame);
			cancelAnimationFrame(colorFrame);
			resize.disconnect();
			theme.disconnect();
			seen.disconnect();
			scheme?.removeEventListener('change', repaint);
			wrap.removeEventListener('pointermove', onmove);
			wrap.removeEventListener('pointerleave', onleave);
			wrap.removeEventListener('pointerdown', ondown);
		};
	}
</script>

<div
	{...restProps}
	bind:this={ref}
	class={cn(
		'bg-card text-foreground relative isolate aspect-[3/2] w-[min(480px,100%)] touch-manipulation overflow-hidden rounded-3xl shadow-sm',
		className
	)}
>
	<!-- Decoration only: the grid carries no information. -->
	<canvas
		bind:this={canvas}
		aria-hidden="true"
		class="text-muted-foreground absolute inset-0 -z-10 size-full"
	></canvas>
	{@render children?.()}
</div>
