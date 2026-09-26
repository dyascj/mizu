<script lang="ts" module>
	type Rect = { x: number; y: number; w: number; h: number };
	type Grain = { x: number; y: number; a: number; phase: number; speed: number; size: number };
	type Phase = 'hidden' | 'dissolving' | 'revealed' | 'covering';

	/** Grains per square pixel: dense enough to hide letter shapes, sparse enough to read as grain, not a gray bar. */
	const DENSITY = 0.15;
	const MAX_GRAINS = 1200;

	/**
	 * Client rects are in screen pixels, but the canvas draws inside any CSS
	 * scale an ancestor applies, so measurements are divided by that scale or
	 * it would be applied twice.
	 */
	function screenScale(el: HTMLElement) {
		const s = el.getBoundingClientRect().width / el.offsetWidth;
		return Number.isFinite(s) && s > 0 ? s : 1;
	}
</script>

<script lang="ts">
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import { tick, untrack, type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { duration, prefersReducedMotion } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
		/** The hidden text, inline in a sentence. It may wrap across lines. */
		children: Snippet;
		/**
		 * Whether the text shows. Readers reveal it by clicking it, or with
		 * Enter or Space, and cover it again from a small hide button. Setting it
		 * from outside dissolves from a point along the first line.
		 */
		revealed?: boolean;
		/** Called when a reader reveals or hides the text. */
		onRevealedChange?: (revealed: boolean) => void;
		/** What assistive technology calls the covered text, such as "Plot twist". */
		label?: string;
		/** The root element. */
		ref?: HTMLSpanElement | null;
		/** Classes for the root. */
		class?: string;
	};

	let {
		children,
		revealed = $bindable(false),
		onRevealedChange,
		label = 'Spoiler',
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	/**
	 * How long the dissolve takes to travel from the click to the far edge, then
	 * how long each grain takes to fade once reached. Long for UI on purpose:
	 * a one-off payoff that never blocks reading.
	 */
	const SPREAD = duration.slow;
	const GRAIN_FADE = duration.slow;
	const COVER = duration.base;

	let probe = $state<HTMLSpanElement>();
	let textEl = $state<HTMLSpanElement>();
	let canvas = $state<HTMLCanvasElement>();
	let chip = $state<HTMLButtonElement>();
	let chipPos = $state<{ left: number; top: number } | null>(null);
	let chipOpen = $state(false);
	/** The dissolve has finished, so the hide button can appear without covering the payoff. */
	// Text that starts revealed has nothing to dissolve, so the button is ready.
	let settled = $state(untrack(() => revealed));
	let announcement = $state('');
	let settleTimer: ReturnType<typeof setTimeout> | undefined;
	let focusAfter: 'chip' | 'text' | null = null;

	// Everything the draw loop reads lives here, outside Svelte's state, so a
	// frame never re-renders anything.
	const engine = {
		phase: (revealed ? 'revealed' : 'hidden') as Phase,
		phaseStart: 0,
		origin: { x: 0, y: 0 },
		maxDistance: 1,
		grains: [] as Grain[],
		rects: [] as Rect[],
		width: 0,
		height: 0,
		scale: 1,
		// The grain's own clock, which only runs while it shimmers, so it
		// resumes where it stopped instead of jumping.
		time: 0,
		last: 0,
		// Idle grain holds still; it shimmers only while hovered or focused.
		lively: false,
		// The value of `revealed` the grain last acted on.
		revealedTo: revealed,
		kick: () => {}
	};

	$effect(() => {
		const el = canvas;
		const text = textEl;
		const origin = probe;
		if (!el || !text || !origin) return;
		const ctx = el.getContext('2d');
		if (!ctx) return;
		const e = engine;
		const still = prefersReducedMotion();
		let frame = 0;
		let onScreen = true;
		let color = '';
		let colorAge = 0;
		const block = text.closest<HTMLElement>('p, li, blockquote, div') ?? text.parentElement;

		const draw = (now: number) => {
			// The ink comes from the theme; re-read it now and then so a theme
			// switch is picked up without a style read every frame.
			if (!color || colorAge++ > 30) {
				color = getComputedStyle(el).color;
				colorAge = 0;
			}
			ctx.clearRect(0, 0, e.width, e.height);
			if (e.phase === 'revealed') return;
			ctx.fillStyle = color;
			const t = still ? 0 : e.time / 1000;
			const elapsed = now - e.phaseStart;
			const cover = e.phase === 'covering' ? Math.min(1, elapsed / COVER) : 1;

			for (const g of e.grains) {
				// Each grain drifts in a tiny loop and twinkles on its own clock.
				let x = g.x + Math.sin(t * g.speed + g.phase) * 1.2;
				let y = g.y + Math.cos(t * g.speed * 0.8 + g.phase) * 0.9;
				let alpha = g.a * (0.55 + 0.45 * Math.sin(t * g.speed * 2.2 + g.phase)) * cover;
				if (e.phase === 'dissolving') {
					const dx = g.x - e.origin.x;
					const dy = g.y - e.origin.y;
					const d = Math.hypot(dx, dy) || 1;
					const local = elapsed - (d / e.maxDistance) * SPREAD;
					if (local > 0) {
						const p = Math.min(1, local / GRAIN_FADE);
						// Blown outward from the click, fast at first, then drifting.
						const push = (1 - (1 - p) * (1 - p)) * 7;
						x += (dx / d) * push;
						y += (dy / d) * push * 0.6;
						alpha *= 1 - p;
					}
				}
				if (alpha <= 0.02) continue;
				ctx.globalAlpha = alpha;
				ctx.fillRect(x, y, g.size, g.size);
			}
			ctx.globalAlpha = 1;
		};

		// Lines are measured from the text's own fragments and placed from a
		// zero-size probe, because wrapped inline text has no single box.
		const measure = () => {
			const s = block ? screenScale(block) : 1;
			e.scale = s;
			const base = origin.getBoundingClientRect();
			const fragments = Array.from(text.getClientRects())
				.filter((r) => r.width > 0)
				.map((r) => ({
					left: r.left / s,
					top: r.top / s,
					right: r.right / s,
					bottom: r.bottom / s
				}));
			if (!fragments.length) return;
			const ox = base.left / s;
			const oy = base.top / s;
			const left = Math.min(...fragments.map((r) => r.left));
			const top = Math.min(...fragments.map((r) => r.top));
			const right = Math.max(...fragments.map((r) => r.right));
			const bottom = Math.max(...fragments.map((r) => r.bottom));
			e.width = Math.ceil(right - left);
			e.height = Math.ceil(bottom - top);
			e.rects = fragments.map((r) => ({
				x: r.left - left,
				y: r.top - top,
				w: r.right - r.left,
				h: r.bottom - r.top
			}));

			const dpr = Math.min(2, window.devicePixelRatio || 1);
			el.width = Math.round(e.width * dpr);
			el.height = Math.round(e.height * dpr);
			el.style.width = `${e.width}px`;
			el.style.height = `${e.height}px`;
			el.style.left = `${Math.round(left - ox)}px`;
			el.style.top = `${Math.round(top - oy)}px`;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

			const grains: Grain[] = [];
			const area = e.rects.reduce((sum, r) => sum + r.w * r.h, 0);
			const perPx = Math.min(DENSITY, MAX_GRAINS / Math.max(area, 1));
			for (const r of e.rects) {
				const count = Math.round(r.w * r.h * perPx);
				for (let i = 0; i < count; i++) {
					grains.push({
						// Inset from the fragment's edge so the drift never leaves it.
						x: r.x + 1.5 + Math.random() * (r.w - 3),
						y: r.y + 2 + Math.random() * (r.h - 4),
						a: 0.35 + Math.random() * 0.65,
						phase: Math.random() * Math.PI * 2,
						speed: 0.6 + Math.random() * 1.8,
						size: Math.random() < 0.8 ? 1 : 1.5
					});
				}
			}
			e.grains = grains;

			const last = fragments[fragments.length - 1];
			chipPos = { left: Math.round(last.right - ox), top: Math.round(last.top - oy) };
			draw(performance.now());
		};

		const loop = (now: number) => {
			frame = 0;
			if (e.lively || e.phase !== 'hidden') {
				e.time += e.last ? Math.min(now - e.last, 50) : 0;
				e.last = now;
			}
			const elapsed = now - e.phaseStart;
			if (e.phase === 'dissolving' && elapsed > SPREAD + GRAIN_FADE) {
				e.phase = 'revealed';
				ctx.clearRect(0, 0, e.width, e.height);
				return;
			}
			if (e.phase === 'covering' && elapsed > COVER) e.phase = 'hidden';
			draw(now);
			// Sleeps when revealed, at rest, offscreen, or in a hidden tab.
			const idle = e.phase === 'hidden' && !e.lively;
			if (e.phase !== 'revealed' && !idle && onScreen && !document.hidden) {
				frame = requestAnimationFrame(loop);
			} else {
				e.last = 0;
			}
		};

		e.kick = () => {
			if (still) {
				if (e.phase === 'dissolving') e.phase = 'revealed';
				if (e.phase === 'covering') e.phase = 'hidden';
				draw(0);
				return;
			}
			if (!frame && !(e.phase === 'hidden' && !e.lively) && e.phase !== 'revealed') {
				frame = requestAnimationFrame(loop);
			}
		};

		const io =
			typeof IntersectionObserver === 'undefined'
				? null
				: new IntersectionObserver(([entry]) => {
						onScreen = entry.isIntersecting;
						if (onScreen) e.kick();
					});
		io?.observe(el);
		const onVisibility = () => {
			if (!document.hidden) e.kick();
		};
		document.addEventListener('visibilitychange', onVisibility);

		// Re-measure whenever the paragraph reflows, and once fonts settle.
		const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
		if (block) ro?.observe(block);
		let alive = true;
		document.fonts?.ready.then(() => {
			if (alive) measure();
		});
		measure();
		e.kick();

		return () => {
			alive = false;
			cancelAnimationFrame(frame);
			e.last = 0;
			io?.disconnect();
			ro?.disconnect();
			document.removeEventListener('visibilitychange', onVisibility);
			e.kick = () => {};
		};
	});

	$effect(() => () => clearTimeout(settleTimer));

	/** Starts the dissolve. `along` is where on the first line it starts, 0 to 1. */
	function dissolve(clientX?: number, clientY?: number, along = 0.5) {
		const e = engine;
		const first = e.rects[0];
		if (clientX === undefined || clientY === undefined || !canvas) {
			// Keyboard and outside reveals start from a point on the first line.
			e.origin = first
				? { x: first.x + first.w * along, y: first.y + first.h / 2 }
				: { x: 0, y: 0 };
		} else {
			const box = canvas.getBoundingClientRect();
			e.origin = { x: (clientX - box.left) / e.scale, y: (clientY - box.top) / e.scale };
		}
		e.maxDistance = Math.max(
			1,
			...e.grains.map((g) => Math.hypot(g.x - e.origin.x, g.y - e.origin.y))
		);
		e.phase = 'dissolving';
		e.phaseStart = performance.now();
		e.kick();
		clearTimeout(settleTimer);
		settleTimer = setTimeout(
			() => (settled = true),
			prefersReducedMotion() ? 0 : SPREAD + GRAIN_FADE
		);
		announcement = `Revealed: ${textEl?.textContent?.trim() ?? ''}`;
	}

	function cover() {
		const e = engine;
		e.phase = 'covering';
		e.phaseStart = performance.now();
		e.kick();
		clearTimeout(settleTimer);
		settled = false;
		chipOpen = false;
		announcement = '';
	}

	function show(clientX?: number, clientY?: number) {
		engine.revealedTo = true;
		revealed = true;
		onRevealedChange?.(true);
		dissolve(clientX, clientY);
	}

	async function hide() {
		engine.revealedTo = false;
		revealed = false;
		onRevealedChange?.(false);
		cover();
		focusAfter = 'text';
		await tick();
		if (focusAfter === 'text') textEl?.focus();
		focusAfter = null;
	}

	// Outside control follows the prop without moving focus, since the reader
	// did not act. It lands off-center, the way a finger finds a word.
	$effect(() => {
		const next = revealed;
		untrack(() => {
			if (next === engine.revealedTo) return;
			engine.revealedTo = next;
			if (next) dissolve(undefined, undefined, 0.3);
			else cover();
		});
	});

	// A keyboard reveal hands focus to the hide button once it can appear.
	$effect(() => {
		if (settled && chip && focusAfter === 'chip') {
			chip.focus();
			focusAfter = null;
		}
	});

	function onclick(event: MouseEvent) {
		// Once revealed, a stray click only offers the hide button; covering
		// again takes a second, deliberate press.
		if (revealed) {
			chipOpen = !chipOpen;
			return;
		}
		// A click with no detail came from the keyboard or assistive technology.
		if (event.detail === 0) {
			focusAfter = 'chip';
			show();
		} else show(event.clientX, event.clientY);
	}

	function onkeydown(event: KeyboardEvent) {
		if (revealed || (event.key !== 'Enter' && event.key !== ' ')) return;
		event.preventDefault();
		focusAfter = 'chip';
		show();
	}

	function liven(on: boolean) {
		engine.lively = on;
		engine.kick();
	}
</script>

<!-- Written without whitespace between tags: the root is inline in a
     sentence, so any gap would show up as a stray space beside the words. -->
<span
	{...restProps}
	bind:this={ref}
	class={cn('group/spoiler relative', className)}
	data-revealed={revealed || undefined}
	onpointerenter={() => liven(true)}
	onpointerleave={() => liven(false)}
	onfocusin={() => liven(true)}
	onfocusout={() => liven(false)}
	><!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_static_element_interactions --><span
		bind:this={textEl}
		role={revealed ? undefined : 'button'}
		tabindex={revealed ? -1 : 0}
		aria-label={revealed ? undefined : `${label}, press to reveal`}
		{onclick}
		{onkeydown}
		class={cn(
			// The padding is cancelled by an equal negative margin, so the pill
			// around the covered text never shifts the words once it is gone.
			'-mx-0.5 rounded-[0.25rem] [box-decoration-break:clone] px-0.5 outline-none [-webkit-box-decoration-break:clone]',
			'focus-visible:ring-ring focus-visible:ring-2',
			revealed
				? 'bg-transparent text-inherit transition-[color,background-color] delay-(--duration-instant) duration-(--duration-slow) ease-out'
				: 'bg-muted cursor-pointer text-transparent transition-[color,background-color] duration-(--duration-fast) ease-out select-none'
		)}><span aria-hidden={revealed ? undefined : 'true'}>{@render children()}</span></span
	><!-- The overlay parts hang off a zero-size probe at the text's origin. --><span
		bind:this={probe}
		class="pointer-events-none absolute top-0 left-0 size-0"
		><canvas
			bind:this={canvas}
			aria-hidden="true"
			class={cn(
				'text-foreground pointer-events-none absolute top-0 left-0',
				// Before measuring it has no size; keep it from flashing at 300 by 150.
				!chipPos && 'invisible'
			)}
		></canvas>{#if revealed && settled && chipPos}<button
				bind:this={chip}
				type="button"
				aria-label="Hide {label.toLowerCase()}"
				data-open={chipOpen || undefined}
				onclick={hide}
				style:left="{chipPos.left}px"
				style:top="{chipPos.top}px"
				class={cn(
					// Sits just above the end of the text, clear of the words.
					'bg-popover text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute z-10 grid size-6 origin-bottom -translate-x-1/2 -translate-y-[calc(100%+2px)] place-items-center rounded-full shadow-md outline-none focus-visible:ring-2 active:scale-[0.96] [&_svg]:size-3.5',
					'transition-[opacity,scale,color] duration-(--duration-fast) ease-out',
					// Hidden until the text is hovered, the button is focused, or a tap
					// opens it. Leaving waits a beat so the pointer can travel up to it.
					'pointer-events-none scale-90 opacity-0 delay-(--duration-fast) starting:scale-90 starting:opacity-0',
					'group-hover/spoiler:pointer-events-auto group-hover/spoiler:scale-100 group-hover/spoiler:opacity-100 group-hover/spoiler:delay-0',
					'focus-visible:pointer-events-auto focus-visible:scale-100 focus-visible:opacity-100 focus-visible:delay-0',
					'data-open:pointer-events-auto data-open:scale-100 data-open:opacity-100 data-open:delay-0'
				)}><EyeOff aria-hidden="true" /></button
			>{/if}<span class="sr-only" aria-live="polite">{announcement}</span></span
	></span
>
