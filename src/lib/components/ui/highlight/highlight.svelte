<script lang="ts" module>
	/**
	 * Seeded, so the same line always gets the same ragged edge on the server
	 * and the client alike.
	 */
	function random(seed: number) {
		let s = seed >>> 0 || 1;
		return () => {
			s = (s * 1664525 + 1013904223) >>> 0;
			return s / 4294967296;
		};
	}

	/**
	 * A highlighter stroke: a chisel tip leaves slanted ends, and the edges
	 * wobble a little along the way, top and bottom independently.
	 */
	function strokePath(w: number, h: number, seed: number) {
		const next = random(seed);
		const wobble = () => (next() - 0.5) * 2.2;
		const slant = h * 0.28;
		const top: string[] = [];
		const bottom: string[] = [];
		for (let x = slant; x <= w; x += 10) top.push(`${x.toFixed(1)} ${(1.2 + wobble()).toFixed(1)}`);
		top.push(`${w.toFixed(1)} ${(1 + wobble()).toFixed(1)}`);
		for (let x = w - slant; x >= 0; x -= 10)
			bottom.push(`${x.toFixed(1)} ${(h - 1.2 + wobble()).toFixed(1)}`);
		bottom.push(`0 ${(h - 1 + wobble()).toFixed(1)}`);
		return `M${top.join(' L')} L${bottom.join(' L')} Z`;
	}
</script>

<script lang="ts">
	import { untrack, type Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import type { HTMLAttributes } from 'svelte/elements';
	import { duration, prefersReducedMotion } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
		/** The phrase to mark, inline in a sentence. It may wrap across lines. */
		children: Snippet;
		/**
		 * The ink. `primary` is the quiet neutral tint; the aurora tones are for
		 * AI moments, such as the key line of a generated answer.
		 */
		tone?: 'primary' | 'aurora' | 'aurora-cool' | 'aurora-iris' | 'aurora-mint';
		/** Swipe once the phrase is half in view, or as soon as it mounts. */
		trigger?: 'view' | 'mount';
		/** Milliseconds before the pen sets down, so the stroke lands on text that is already readable. */
		delay?: number;
		/** Called once the stroke has crossed the last line. */
		onDrawn?: () => void;
		/** The mark element. */
		ref?: HTMLElement | null;
		/** Classes for the mark. */
		class?: string;
	};

	let {
		children,
		tone = 'primary',
		trigger = 'view',
		delay = duration.slow,
		onDrawn,
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	type Line = { x: number; y: number; w: number; h: number };

	/** A marker covers about this many pixels a second: slow enough to watch, quick enough to finish a long phrase in about a second. */
	const PEN_SPEED = 620;
	/** The stroke covers the middle of the line box, the way a highlighter sits over the x-height and leaves the leading clear. */
	const COVER_TOP = 0.2;
	const COVER = 0.7;
	/** Ink runs slightly past the words at both ends, like a hand that starts a hair early and lifts a hair late. */
	const OVERSHOOT = 4;

	const uid = $props.id();
	const filterId = `${uid}-ink`;
	let lines = $state<Line[]>([]);
	let drawn = $state(false);
	let still = $state(false);

	const fills = {
		primary: 'bg-primary-muted',
		aurora: 'aurora',
		'aurora-cool': 'aurora-cool',
		'aurora-iris': 'aurora-iris',
		'aurora-mint': 'aurora-mint'
	};

	/**
	 * Each line takes the pen's speed over its own width, so a short last line
	 * is quicker than a long first one. The pen accelerates off the first word
	 * and slows onto the last; lines in between run evenly, so it reads as one
	 * stroke.
	 */
	const timing = $derived.by(() => {
		let at = Math.max(0, delay);
		return lines.map((line, i) => {
			const first = i === 0;
			const last = i === lines.length - 1;
			const ms = (line.w / PEN_SPEED) * 1000;
			const ease =
				first && last
					? 'var(--ease-in-out)'
					: first
						? 'var(--ease-in)'
						: last
							? 'var(--ease-out)'
							: 'linear';
			const entry = { delay: at, duration: ms, ease };
			at += ms;
			return entry;
		});
	});

	let notified = false;
	/** Reports the finished stroke once, however it finished. */
	function notify() {
		if (notified) return;
		notified = true;
		onDrawn?.();
	}

	const mark: Attachment<HTMLElement> = (node) => {
		const probe = node.querySelector<HTMLElement>('[data-probe]');
		if (!probe) return;
		const reduce = prefersReducedMotion();
		still = reduce;
		let frame = 0;

		// Without a transition to play, or a line to play it on, no
		// transitionend will come, so the stroke counts as drawn at once.
		const finish = () => {
			drawn = true;
			untrack(() => {
				if (reduce || lines.length === 0) notify();
			});
		};

		// One rect per line the phrase wraps onto, placed from a zero-size probe,
		// because an inline element that wraps has no single box to anchor to.
		const measure = () => {
			const origin = probe.getBoundingClientRect();
			// Rects are after transforms; a scaled ancestor would double them.
			const scale = node.offsetWidth
				? node.getBoundingClientRect().width / node.offsetWidth || 1
				: 1;
			lines = Array.from(node.getClientRects())
				.filter((rect) => rect.width > 1)
				.map((rect) => ({
					x: (rect.left - origin.left) / scale - OVERSHOOT,
					y: (rect.top - origin.top) / scale + (rect.height / scale) * COVER_TOP,
					w: rect.width / scale + OVERSHOOT * 2,
					h: (rect.height / scale) * COVER
				}));
		};

		// Lines mount undrawn; the next frame starts the swipe from there.
		const draw = () => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => {
				frame = requestAnimationFrame(finish);
			});
		};

		measure();
		const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
		const block = node.closest<HTMLElement>('p, li, blockquote, div') ?? node.parentElement;
		if (block) resize?.observe(block);
		document.fonts?.ready.then(() => node.isConnected && measure());

		let view: IntersectionObserver | undefined;
		if (reduce || typeof requestAnimationFrame === 'undefined') {
			finish();
		} else if (trigger === 'mount' || typeof IntersectionObserver === 'undefined') {
			draw();
		} else {
			view = new IntersectionObserver(
				(entries) => {
					if (!entries.some((entry) => entry.isIntersecting)) return;
					view?.disconnect();
					draw();
				},
				{ threshold: 0.5 }
			);
			view.observe(node);
		}

		return () => {
			cancelAnimationFrame(frame);
			resize?.disconnect();
			view?.disconnect();
		};
	};
</script>

<mark
	{...restProps}
	bind:this={ref}
	{@attach mark}
	data-drawn={drawn || undefined}
	data-still={still || undefined}
	class={cn('highlight relative isolate bg-transparent text-inherit', className)}
>
	<span data-probe aria-hidden="true" class="pointer-events-none absolute top-0 left-0 size-0">
		<!-- Highlighter ink is uneven: a little streaking along the stroke and
		     edges that bleed into the paper. -->
		<svg class="absolute size-0">
			<filter id={filterId} x="-2%" y="-20%" width="104%" height="140%">
				<feTurbulence
					type="fractalNoise"
					baseFrequency="0.05 0.3"
					numOctaves="2"
					seed="3"
					result="grain"
				/>
				<feDisplacementMap in="SourceGraphic" in2="grain" scale="1.6" result="edge" />
				<feTurbulence
					type="fractalNoise"
					baseFrequency="0.006 0.5"
					numOctaves="1"
					seed="9"
					result="streak"
				/>
				<feColorMatrix
					in="streak"
					type="matrix"
					values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.45 1.15"
					result="streakMask"
				/>
				<feComposite in="edge" in2="streakMask" operator="in" />
			</filter>
		</svg>
		{#each lines as line, i (i)}
			<span
				class="highlight-stroke absolute -z-10"
				style:left="{line.x}px"
				style:top="{line.y}px"
				style:width="{line.w}px"
				style:height="{line.h}px"
				style:--highlight-delay="{timing[i]?.delay ?? 0}ms"
				style:--highlight-duration="{timing[i]?.duration ?? 0}ms"
				style:--highlight-ease={timing[i]?.ease}
				style:filter="url(#{filterId})"
				ontransitionend={i === lines.length - 1 ? notify : undefined}
			>
				<span
					class={cn('absolute inset-0', fills[tone])}
					style:clip-path="path('{strokePath(line.w, line.h, (i + 1) * 97 + lines.length)}')"
				></span>
			</span>
		{/each}
	</span>
	{@render children()}
</mark>

<style>
	/* Undrawn, the stroke is clipped to nothing at its left end. The clip
	   reaches past the box on every other side, so the ink's bleed survives. */
	.highlight-stroke {
		clip-path: inset(-50% calc(100% + 0.5rem) -50% -0.5rem);
	}

	/* Right to left, the pen sets down at the right end instead. */
	.highlight-stroke:dir(rtl) {
		clip-path: inset(-50% -0.5rem -50% calc(100% + 0.5rem));
	}

	.highlight[data-drawn] .highlight-stroke {
		clip-path: inset(-50% -0.5rem -50% -0.5rem);
		transition: clip-path var(--highlight-duration) var(--highlight-ease) var(--highlight-delay);
	}

	/* Without motion the phrase is simply marked. */
	.highlight[data-still] .highlight-stroke {
		transition: none;
	}

	@media (prefers-reduced-motion: reduce) {
		.highlight .highlight-stroke {
			transition: none;
		}
	}
</style>
