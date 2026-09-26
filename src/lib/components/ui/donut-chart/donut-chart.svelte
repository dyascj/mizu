<script lang="ts" module>
	export type DonutSlice = {
		label: string;
		value: number;
		/**
		 * Any CSS color. Defaults to the primary color at a graded strength by
		 * position, so the first slice is the strongest.
		 */
		color?: string;
	};
</script>

<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { duration, easeOut, prefersReducedMotion } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** Slices in order, clockwise from twelve o'clock. */
		data: DonutSlice[];
		/** Names the chart for assistive technology, such as "Requests by workload". */
		label: string;
		/** Shown under the total in the center. */
		totalLabel?: string;
		/** Turns a value into display text. Defaults to a grouped number in `locale`. */
		format?: (value: number) => string;
		/** BCP 47 locale for the default number and percent formats. */
		locale?: string;
		/** The root element. */
		ref?: HTMLDivElement | null;
		/** Classes for the root element. */
		class?: string;
	};

	let {
		data,
		label,
		totalLabel = 'Total',
		format,
		locale,
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	const SIZE = 200;
	const STROKE = 28;
	// Leaves room inside the box for a lifted slice.
	const R = SIZE / 2 - STROKE / 2 - 7;
	const C = 2 * Math.PI * R;
	// The surface shows through a 2px gap between slices; nothing is stroked around them.
	const GAP = 2;
	// Far enough to read as lifted, close enough to still sit in the ring.
	const PULL = 6;
	const CENTER = SIZE / 2;
	/** Strength of the primary color for each slice by position. */
	const STRENGTHS = [100, 72, 52, 36, 22];

	const number = $derived(new Intl.NumberFormat(locale));
	const percent = $derived(new Intl.NumberFormat(locale, { style: 'percent' }));
	const show = $derived(format ?? ((value: number) => number.format(value)));

	const total = $derived(data.reduce((sum, d) => sum + d.value, 0));
	const arcs = $derived.by(() => {
		let start = 0;
		return data.map((d, i) => {
			const length = total ? (d.value / total) * C : 0;
			const arc = {
				start,
				length,
				// Mid-angle in screen space (0 is three o'clock), since the ring starts at twelve.
				mid: ((start + length / 2) / C) * Math.PI * 2 - Math.PI / 2,
				color:
					d.color ??
					`color-mix(in oklab, var(--primary) ${STRENGTHS[Math.min(i, STRENGTHS.length - 1)]}%, transparent)`
			};
			start += length;
			return arc;
		});
	});
	// Counting rounds to the finest precision in the data, so it never shows noise digits.
	const decimals = $derived(
		Math.max(0, ...data.map((d) => String(d.value).split('.')[1]?.length ?? 0))
	);

	let hovered = $state<number | null>(null);
	let pinned = $state<number | null>(null);
	const active = $derived(hovered ?? pinned);
	const reduced = $derived(prefersReducedMotion());

	let started = $state(false);
	let progress = $state(0);
	let countEl = $state<HTMLSpanElement | null>(null);

	const centreLabel = $derived(active === null ? totalLabel : (data[active]?.label ?? totalLabel));
	const target = $derived(active === null ? total : (data[active]?.value ?? total));

	/** Runs `step` with eased progress each frame for `ms`. Returns a cancel function. */
	function tween(ms: number, step: (t: number) => void) {
		let frame = 0;
		let start: number | undefined;
		const tick = (now: number) => {
			start ??= now;
			const t = Math.min((now - start) / ms, 1);
			step(easeOut(t));
			if (t < 1) frame = requestAnimationFrame(tick);
		};
		frame = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frame);
	}

	// A one-time entrance that traces the whole ring as a single stroke. It runs
	// longer than a UI state change because the sweep explains the parts adding
	// up to a whole; nothing waits on it.
	$effect(() => {
		if (!started) return;
		if (prefersReducedMotion()) {
			progress = 1;
			return;
		}
		return tween(duration.deliberate, (t) => (progress = t));
	});

	// The center counts to the new figure from wherever it is. Written straight
	// to the DOM, so counting never re-renders the chart.
	let shown = 0;
	$effect(() => {
		if (!started || !countEl) return;
		const el = countEl;
		const to = target;
		const write = (value: number) => {
			shown = value;
			el.textContent = show(Number(value.toFixed(decimals)));
		};
		if (prefersReducedMotion()) {
			write(to);
			return;
		}
		const from = shown;
		return tween(duration.slow, (t) => write(from + (to - from) * t));
	});

	/** Starts the entrance the first time the ring scrolls into view. */
	function reveal(node: Element) {
		if (typeof IntersectionObserver === 'undefined') {
			started = true;
			return;
		}
		const observer = new IntersectionObserver(
			(entries) => {
				if (!entries.some((entry) => entry.isIntersecting)) return;
				started = true;
				observer.disconnect();
			},
			{ threshold: 0.5 }
		);
		observer.observe(node);
		return () => observer.disconnect();
	}

	const toggle = (i: number) => (pinned = pinned === i ? null : i);
	/** How much of a slice's share of the sweep has drawn so far. */
	const drawn = (i: number) =>
		Math.min(Math.max(progress * C - arcs[i].start, 0), Math.max(arcs[i].length - GAP, 0));
</script>

<div
	bind:this={ref}
	class={cn('flex flex-wrap items-center justify-center gap-x-8 gap-y-6', className)}
	{...restProps}
>
	<div class="relative shrink-0" style:width="{SIZE}px" style:height="{SIZE}px">
		<!-- Pointer only: the legend beside the ring is the keyboard path. Leaving the
		     whole ring resets, not each slice, so crossing a gap never flickers the
		     center back to the total. -->
		<svg
			{@attach reveal}
			aria-hidden="true"
			width={SIZE}
			height={SIZE}
			viewBox="0 0 {SIZE} {SIZE}"
			class="overflow-visible"
			onpointerleave={(event) => {
				if (event.pointerType !== 'touch') hovered = null;
			}}
		>
			{#each arcs as arc, i (i)}
				{@const pull = active === i && !reduced ? PULL : 0}
				<g
					class="[transition:translate_var(--duration-spring-snappy)_var(--ease-spring-snappy),opacity_var(--duration-fast)_var(--ease-out)]"
					style:translate="{Math.cos(arc.mid) * pull}px {Math.sin(arc.mid) * pull}px"
					style:opacity={active !== null && active !== i ? 0.3 : 1}
				>
					<!-- A circle's stroke starts at three o'clock; turning it starts the ring
					     at twelve, where people read a pie from. -->
					<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
					<circle
						cx={CENTER}
						cy={CENTER}
						r={R}
						fill="none"
						stroke-width={STROKE}
						transform="rotate(-90 {CENTER} {CENTER})"
						stroke-dashoffset={-arc.start}
						class="cursor-pointer"
						style:stroke={arc.color}
						style:stroke-dasharray="{drawn(i)}
						{C}"
						onpointerenter={(event) => {
							if (event.pointerType !== 'touch') hovered = i;
						}}
						onclick={() => toggle(i)}
					/>
				</g>
			{/each}
		</svg>
		<div
			aria-hidden="true"
			class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
		>
			<span
				bind:this={countEl}
				class="text-foreground text-3xl font-semibold tracking-tight tabular-nums"
			></span>
			<!-- Remounts on change, so each new name resolves from a soft blur. -->
			{#key centreLabel}
				<span
					class="text-muted-foreground max-w-[120px] truncate text-sm transition-[opacity,filter] duration-(--duration-base) ease-out starting:opacity-0 starting:blur-[4px]"
				>
					{centreLabel}
				</span>
			{/key}
		</div>
	</div>

	<ul class="flex w-[220px] max-w-full flex-col">
		{#each data as d, i (i)}
			<li>
				<button
					type="button"
					aria-pressed={pinned === i}
					onpointerenter={(event) => {
						if (event.pointerType !== 'touch') hovered = i;
					}}
					onpointerleave={(event) => {
						if (event.pointerType !== 'touch') hovered = null;
					}}
					onfocus={(event) => {
						// Keyboard focus previews like hover; a tap's focus does not, or
						// unpinning would leave the slice highlighted.
						if (event.currentTarget.matches(':focus-visible')) hovered = i;
					}}
					onblur={() => (hovered = null)}
					onclick={() => toggle(i)}
					class={cn(
						'focus-visible:ring-ring flex h-9 w-full touch-manipulation items-center gap-2.5 rounded-full px-3 text-left text-sm transition-[scale,opacity,background-color] duration-(--duration-fast) ease-out outline-none select-none focus-visible:ring-2 active:scale-[0.97] motion-reduce:transition-[opacity,background-color]',
						active !== null && active !== i ? 'opacity-50' : 'opacity-100',
						pinned === i ? 'bg-primary-muted' : 'hover:bg-secondary'
					)}
				>
					<span
						aria-hidden="true"
						class="size-2.5 shrink-0 rounded-[3px]"
						style:background={arcs[i]?.color}
					></span>
					<span class="text-foreground min-w-0 flex-1 truncate">{d.label}</span>
					<span class="text-foreground tabular-nums">{show(d.value)}</span>
					<span
						class={cn(
							'w-9 text-right tabular-nums',
							pinned === i ? 'text-foreground' : 'text-muted-foreground'
						)}
					>
						{total ? percent.format(d.value / total) : ''}
					</span>
				</button>
			</li>
		{/each}
	</ul>

	<!-- sr-only on a wrapper: a table ignores the 1px height and would stretch the page. -->
	<div class="sr-only">
		<table>
			<caption>{label}</caption>
			<thead>
				<tr>
					<th scope="col">Category</th>
					<th scope="col">Value</th>
					<th scope="col">Share</th>
				</tr>
			</thead>
			<tbody>
				{#each data as d, i (i)}
					<tr>
						<th scope="row">{d.label}</th>
						<td>{show(d.value)}</td>
						<td>{total ? percent.format(d.value / total) : ''}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
