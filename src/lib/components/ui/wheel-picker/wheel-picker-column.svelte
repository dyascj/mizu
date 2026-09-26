<script lang="ts">
	import { untrack } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import type { HTMLAttributes } from 'svelte/elements';
	import { SpringValue, springPresets } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** The values on the drum, top to bottom. */
		options: string[];
		/** The value under the band. Falls back to the first option. */
		value?: string;
		/** Called with the value under the band each time it changes, including mid-spin. */
		onValueChange?: (value: string) => void;
		/** Accessible name for the column, such as "Hour". */
		label: string;
		/** Blocks spinning. */
		disabled?: boolean;
		/** The scrolling element. */
		ref?: HTMLDivElement | null;
		/** Classes for the column, such as its width. */
		class?: string;
	};

	let {
		options,
		value = $bindable(),
		onValueChange,
		label,
		disabled = false,
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	/** Height of a row, in pixels. */
	const ROW = 40;
	/**
	 * Five and a half rows: two full rows either side of the selection plus the
	 * foreshortened edge of a third, which is what sells the curve.
	 */
	const HEIGHT = 220;
	const PAD = (HEIGHT - ROW) / 2;
	/** Each row sits this far around the drum, so the fifth one away turns edge-on as it leaves. */
	const STEP = 18;
	/** The drum radius whose arc between neighbours is exactly one row, so rows near the band keep their spacing. */
	const RADIUS = ROW / ((STEP * Math.PI) / 180);
	/** How much speed a flick keeps each millisecond: a handful of rows, not the whole column. */
	const DECELERATION = 0.995;
	/** Past this many pixels a mouse press becomes a drag rather than a click. */
	const DRAG_SLOP = 4;
	/** A hand held still this long before letting go has stopped, so it does not fling. */
	const FLING_WINDOW = 80;

	const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);

	const last = $derived(options.length - 1);
	const index = $derived(Math.max(options.indexOf(value ?? ''), 0));

	/** The row under the band right now, written per frame without rendering. */
	let current = untrack(() => index);
	/**
	 * Where the drum is headed: the landing row of a glide in flight, so
	 * repeated key presses stack up, or the row under the band otherwise.
	 * Assistive tech hears this rather than every row a glide passes.
	 */
	let goal = $state(untrack(() => index));
	const settled = $derived(clamp(goal, 0, last));

	/** Where row `i` sits on the drum when `position` rows have scrolled past. */
	function place(i: number, position: number) {
		const offset = i - position;
		const angle = offset * STEP;
		if (Math.abs(angle) >= 90) return { transform: '', opacity: '0' };
		const rad = (angle * Math.PI) / 180;
		// From the row's flat scroll position onto the cylinder.
		const dy = RADIUS * Math.sin(rad) - offset * ROW;
		const dz = RADIUS * (Math.cos(rad) - 1);
		return {
			transform: `translate3d(0, ${dy}px, ${dz}px) rotateX(${-angle}deg)`,
			opacity: String(Math.max(1 - Math.abs(offset) * 0.2, 0))
		};
	}

	// The server renders the drum already curved around the starting value, so
	// nothing moves when the page comes to life.
	const initial = untrack(() => options.map((_, i) => place(i, index)));

	function report(row: number) {
		current = row;
		// A wheel, touch, or trackpad scroll lands wherever it stops; a glide or
		// a mouse drag already knows where it is going.
		if (!glide.moving && !press?.active) goal = row;
		const next = options[row];
		if (next !== undefined && next !== value) {
			value = next;
			onValueChange?.(next);
		}
	}

	function restoreSnap() {
		if (ref) ref.style.scrollSnapType = '';
	}

	// A critically damped glide: a wheel that overshot would flash the wrong value.
	const glide = new SpringValue(0, {
		preset: springPresets.snappy,
		precision: 0.5,
		onUpdate: (top) => {
			if (ref) ref.scrollTop = top;
		},
		onRest: restoreSnap
	});

	/**
	 * Snapping is switched off while the glide drives the scroll position,
	 * otherwise the browser would re-snap every frame of the spring.
	 */
	function glideTo(target: number, velocity = 0) {
		const el = ref;
		if (!el) return;
		const row = clamp(target, 0, last);
		goal = row;
		el.style.scrollSnapType = 'none';
		if (!glide.moving) glide.jump(el.scrollTop);
		// Velocity arrives in pixels per second; the spring counts per frame.
		glide.set(row * ROW, { velocity: velocity / 60 });
		if (!glide.moving) restoreSnap();
	}

	function interrupt() {
		if (!glide.moving) return;
		glide.stop();
		restoreSnap();
		goal = current;
	}

	// Rows are painted straight to the DOM from the scroll position, so wheel,
	// trackpad, and touch momentum stay native and nothing renders per frame.
	// Only rows near the band are touched each frame.
	const drum: Attachment<HTMLDivElement> = (el) => {
		const rows = el.children as unknown as ArrayLike<HTMLElement>;
		const count = options.length;
		// When the options change, the value asked for may sit somewhere else now.
		const wanted = untrack(() => options.indexOf(value ?? ''));
		const start = untrack(() => current);
		el.scrollTop = clamp(start, 0, count - 1) * ROW;
		let lo = 0;
		let hi = rows.length - 1;
		let frame = 0;

		const paint = () => {
			frame = 0;
			const position = el.scrollTop / ROW;
			const nextLo = Math.max(0, Math.floor(position) - 6);
			const nextHi = Math.min(rows.length - 1, Math.ceil(position) + 6);
			for (let i = Math.min(lo, nextLo); i <= Math.max(hi, nextHi); i++) {
				const { transform, opacity } = place(i, position);
				rows[i].style.transform = transform;
				rows[i].style.opacity = opacity;
			}
			lo = nextLo;
			hi = nextHi;
			const centred = clamp(Math.round(position), 0, rows.length - 1);
			if (centred !== current) untrack(() => report(centred));
		};

		paint();
		untrack(() => {
			goal = current;
			if (wanted >= 0 && wanted !== current) glideTo(wanted);
		});
		const onscroll = () => {
			if (!frame) frame = requestAnimationFrame(paint);
		};
		el.addEventListener('scroll', onscroll, { passive: true });
		return () => {
			el.removeEventListener('scroll', onscroll);
			cancelAnimationFrame(frame);
			glide.stop();
			// A glide cut short would otherwise leave snapping off for good.
			el.style.scrollSnapType = '';
		};
	};

	// A parent changing the value from outside glides there too, unless a
	// glide is already on its way there.
	$effect(() => {
		const target = index;
		untrack(() => {
			if (target !== current && !(glide.moving && target === goal)) glideTo(target);
		});
	});

	let press: {
		y: number;
		top: number;
		active: boolean;
		samples: { y: number; t: number }[];
	} | null = null;
	let suppressClick = false;

	function onpointerdown(event: PointerEvent & { currentTarget: HTMLDivElement }) {
		// Touch and pen already scroll natively; only a mouse needs help.
		if (disabled || event.pointerType !== 'mouse' || event.button !== 0) return;
		interrupt();
		suppressClick = false;
		press = {
			y: event.clientY,
			top: event.currentTarget.scrollTop,
			active: false,
			samples: [{ y: event.clientY, t: event.timeStamp }]
		};
	}

	function onpointermove(event: PointerEvent & { currentTarget: HTMLDivElement }) {
		if (!press) return;
		// The button came up somewhere this element never heard about.
		if ((event.buttons & 1) === 0) {
			onpointerup(event);
			return;
		}
		const dy = event.clientY - press.y;
		if (!press.active) {
			if (Math.abs(dy) < DRAG_SLOP) return;
			press.active = true;
			suppressClick = true;
			event.currentTarget.setPointerCapture?.(event.pointerId);
			event.currentTarget.style.scrollSnapType = 'none';
		}
		event.currentTarget.scrollTop = press.top - dy;
		press.samples.push({ y: event.clientY, t: event.timeStamp });
		// Only the last 100ms say how fast the hand is moving now.
		while (press.samples.length > 2 && event.timeStamp - press.samples[0].t > 100) {
			press.samples.shift();
		}
	}

	function onpointerup(event: PointerEvent & { currentTarget: HTMLDivElement }) {
		const drag = press;
		press = null;
		if (!drag?.active) return;
		const first = drag.samples[0];
		const end = drag.samples[drag.samples.length - 1];
		const seconds = (end.t - first.t) / 1000;
		const held = event.timeStamp - end.t > FLING_WINDOW;
		// Dragging down scrolls up, so the scroll velocity is inverted.
		const velocity = seconds > 0 && !held ? -(end.y - first.y) / seconds : 0;
		const projected =
			event.currentTarget.scrollTop + ((velocity / 1000) * DECELERATION) / (1 - DECELERATION);
		glideTo(Math.round(projected / ROW), velocity);
	}

	function onclick(event: MouseEvent) {
		if (suppressClick) {
			suppressClick = false;
			return;
		}
		if (disabled) return;
		const row = (event.target as HTMLElement).closest<HTMLElement>('[data-index]');
		if (row) glideTo(Number(row.dataset.index));
	}

	function onkeydown(event: KeyboardEvent) {
		if (disabled) return;
		const from = glide.moving ? goal : current;
		const next = (
			{
				ArrowUp: from - 1,
				ArrowDown: from + 1,
				PageUp: from - 5,
				PageDown: from + 5,
				Home: 0,
				End: last
			} as Record<string, number>
		)[event.key];
		if (next === undefined) return;
		event.preventDefault();
		glideTo(next);
	}
</script>

<div
	{...restProps}
	bind:this={ref}
	role="spinbutton"
	tabindex={disabled ? -1 : 0}
	aria-label={label}
	aria-valuemin={0}
	aria-valuemax={last}
	aria-valuenow={settled}
	aria-valuetext={options[settled]}
	aria-disabled={disabled || undefined}
	data-slot="wheel-picker-column"
	style:height="{HEIGHT}px"
	style:padding-block="{PAD}px"
	class={cn(
		'relative w-18 shrink-0 cursor-grab snap-y snap-mandatory [scrollbar-width:none] overflow-y-auto overscroll-contain rounded-xl outline-none select-none [perspective:520px] active:cursor-grabbing [&::-webkit-scrollbar]:hidden',
		'focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2',
		disabled && 'pointer-events-none overflow-hidden opacity-50',
		className
	)}
	{@attach drum}
	onwheel={interrupt}
	ontouchstart={interrupt}
	{onpointerdown}
	{onpointermove}
	{onpointerup}
	onpointercancel={() => {
		press = null;
		restoreSnap();
	}}
	onlostpointercapture={(event) => {
		if (press?.active) onpointerup(event);
	}}
	{onclick}
	{onkeydown}
>
	{#each options as option, i (option)}
		<div
			data-index={i}
			class="text-foreground flex h-10 shrink-0 snap-center items-center justify-center text-[22px] font-medium tabular-nums backface-hidden"
			style:transform={initial[i]?.transform}
			style:opacity={initial[i]?.opacity ?? '0'}
		>
			{option}
		</div>
	{/each}
</div>
