<script lang="ts">
	import { untrack } from 'svelte';
	import type { SVGAttributes } from 'svelte/elements';
	import { prefersReducedMotion, springs } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';
	import { interpolatePath, morphShapes, type MorphShape, type MorphShapeName } from './shapes.js';

	type Props = Omit<SVGAttributes<SVGSVGElement>, 'children'> & {
		/** A built-in pair, such as `playPause`, or your own `{ off, on }` paths in a 24 by 24 box. */
		shape: MorphShapeName | MorphShape;
		/** Show the `on` drawing. Changes reshape the icon instead of swapping it. */
		morphed?: boolean;
		/** Stroke width in view-box units. Filled shapes use half of it, just enough to round their corners. */
		strokeWidth?: number;
		/** Classes for the icon. */
		class?: string;
	};

	let { shape, morphed = false, strokeWidth = 2, class: className, ...restProps }: Props = $props();

	const resolved: MorphShape = $derived(typeof shape === 'string' ? morphShapes[shape] : shape);
	const between = $derived(interpolatePath(resolved.off, resolved.on));

	const start = untrack(() => (morphed ? 1 : 0));
	const initialPath = untrack(() => (start ? resolved.on : resolved.off));
	let path = $state<SVGPathElement | null>(null);
	let progress = start;
	let frame = 0;

	function draw() {
		if (!path) return;
		path.setAttribute(
			'd',
			between ? between(progress) : progress < 0.5 ? resolved.off : resolved.on
		);
	}

	/**
	 * Every number eases from wherever the drawing is now, critically damped:
	 * an icon that overshoots its own outline looks broken. Written straight to
	 * the path, so no state churns per frame.
	 */
	function morph(to: number) {
		cancelAnimationFrame(frame);
		if (!between || prefersReducedMotion() || typeof requestAnimationFrame === 'undefined') {
			progress = to;
			draw();
			return;
		}
		const from = progress;
		const { duration, easing } = springs.snappy;
		let begin: number | undefined;
		const tick = (now: number) => {
			begin ??= now;
			const t = Math.min(1, (now - begin) / duration);
			progress = from + (to - from) * easing(t);
			draw();
			frame = t < 1 ? requestAnimationFrame(tick) : 0;
		};
		frame = requestAnimationFrame(tick);
	}

	let shown = start;
	$effect(() => {
		const next = morphed ? 1 : 0;
		if (next === shown) return;
		shown = next;
		untrack(() => morph(next));
	});

	// A new shape lands in place without animating.
	$effect(() => {
		void resolved;
		untrack(() => {
			cancelAnimationFrame(frame);
			progress = shown;
			draw();
		});
	});

	$effect(() => () => cancelAnimationFrame(frame));
</script>

<svg
	{...restProps}
	viewBox="0 0 24 24"
	fill={resolved.filled ? 'currentColor' : 'none'}
	stroke="currentColor"
	stroke-width={resolved.filled ? strokeWidth / 2 : strokeWidth}
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
	data-morphed={morphed ? '' : undefined}
	class={cn(
		// The turn gets a little give, which is what makes it feel physical.
		'size-5 shrink-0 rotate-(--morph-rotate) transition-[rotate] duration-(--duration-spring-bouncy) ease-(--ease-spring-bouncy) motion-reduce:rotate-0',
		className
	)}
	style:--morph-rotate="{morphed ? (resolved.rotate ?? 0) : 0}deg"
>
	<path bind:this={path} d={initialPath} />
</svg>
