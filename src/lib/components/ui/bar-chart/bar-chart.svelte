<script lang="ts" module>
	export type BarChartDatum = {
		/** The category under the bar, such as "Mon". */
		label: string;
		value: number;
	};
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { prefersReducedMotion, springPresets, stagger } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** One bar per entry, left to right. */
		data: BarChartDatum[];
		/** Names the chart for assistive technology, such as "Tokens per day, this week". */
		label: string;
		/** The value at the top of the plot. Defaults to a round number above the largest bar. */
		max?: number;
		/** Values that get a gridline and a label. Defaults to zero, half of `max`, and `max`. */
		ticks?: number[];
		/** Turns a value into display text for the readout and the ticks, such as `(v) => \`${v}M\``. */
		format?: (value: number) => string;
		/** Spoken after each value, such as "million tokens". */
		unit?: string;
		/** Plot height in pixels. */
		height?: number;
		/** The root element. */
		ref?: HTMLDivElement | null;
		/** Classes for the root element. */
		class?: string;
	};

	let {
		data,
		label,
		max,
		ticks,
		format = (value) => String(value),
		unit,
		height = 180,
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	// The rounded cap rides on top of a square body. Scaling one rounded rect
	// would squash its corners, so only the body scales.
	const CAP = 6;

	/** The smallest 1, 2, 2.5, or 5 step at or above `value`. */
	function niceCeil(value: number) {
		if (value <= 0) return 1;
		const power = 10 ** Math.floor(Math.log10(value));
		const step = [1, 2, 2.5, 5, 10].find((s) => s * power >= value) ?? 10;
		return step * power;
	}

	/** A value the plot can draw: missing or non-finite values sit at zero. */
	const finite = (value: number) => (Number.isFinite(value) ? value : 0);
	// A zero, negative, or non-finite `max` would divide by zero, so the rounded
	// data maximum stands in for it.
	const top = $derived(
		max !== undefined && Number.isFinite(max) && max > 0
			? max
			: niceCeil(Math.max(...data.map((d) => finite(d.value)), 0))
	);
	const gridlines = $derived((ticks ?? [0, top / 2, top]).filter(Number.isFinite));
	const targets = $derived(
		data.map((d) => Math.max(0, Math.min(finite(d.value) / top, 1)) * height)
	);

	let plot = $state<HTMLDivElement | null>(null);
	let active = $state<number | null>(null);
	// Roving tabindex: one tab stop for the chart, arrows move between bars.
	let focusIndex = $state(0);
	// Clamped, so a shorter dataset still leaves a bar to tab to.
	const tabStop = $derived(Math.min(focusIndex, Math.max(data.length - 1, 0)));
	let started = $state(false);

	// Each bar rides its own spring. Retargeting keeps its velocity, so rapid
	// dataset switches stay smooth. Critically damped: an overshooting bar would
	// briefly claim a value that is not true.
	let heights = $state<number[]>([]);
	let goals: number[] = [];
	let velocity: number[] = [];
	let frame = 0;
	let lastTime = 0;
	let timers: ReturnType<typeof setTimeout>[] = [];

	/** Steps every spring one frame, the same integration as svelte/motion. Sleeps at rest. */
	function tick(now: number) {
		const dt = lastTime ? Math.min(((now - lastTime) * 60) / 1000, 2) : 1;
		lastTime = now;
		const { stiffness, damping } = springPresets.smooth;
		let settled = true;
		heights = heights.map((h, i) => {
			const goal = finite(goals[i] ?? 0);
			const v = velocity[i] ?? 0;
			const next = v + (stiffness * (goal - h) - damping * v) * dt;
			// A non-finite step can never settle, so it lands instead of looping forever.
			if (!Number.isFinite(next) || (Math.abs(next) < 0.01 && Math.abs(goal - h) < 0.01)) {
				velocity[i] = 0;
				return goal;
			}
			settled = false;
			velocity[i] = next;
			return h + next * dt;
		});
		frame = settled ? 0 : requestAnimationFrame(tick);
		if (settled) lastTime = 0;
	}

	function aim(i: number, goal: number) {
		goals[i] = goal;
		if (!frame) frame = requestAnimationFrame(tick);
	}

	$effect(() => {
		if (!started) return;
		const next = targets;
		untrack(() => {
			timers.forEach(clearTimeout);
			timers = [];
			if (prefersReducedMotion()) {
				cancelAnimationFrame(frame);
				frame = 0;
				goals = [...next];
				velocity = next.map(() => 0);
				heights = [...next];
			} else if (heights.length !== next.length) {
				// First growth cascades left to right, one stagger step per bar.
				heights = next.map(() => 0);
				goals = next.map(() => 0);
				velocity = next.map(() => 0);
				next.forEach((goal, i) => {
					timers.push(setTimeout(() => aim(i, goal), i * stagger));
				});
			} else {
				// A dataset switch moves every bar at once so the comparison lands together.
				next.forEach((goal, i) => aim(i, goal));
			}
		});
	});

	$effect(() => () => {
		timers.forEach(clearTimeout);
		cancelAnimationFrame(frame);
	});

	/** Grows the bars the first time the chart scrolls into view. */
	function reveal(node: HTMLElement) {
		if (typeof IntersectionObserver === 'undefined') {
			started = true;
			return;
		}
		const observer = new IntersectionObserver((entries) => {
			if (!entries.some((entry) => entry.isIntersecting)) return;
			started = true;
			observer.disconnect();
		});
		observer.observe(node);
		return () => observer.disconnect();
	}

	function move(next: number) {
		const i = Math.min(Math.max(next, 0), data.length - 1);
		focusIndex = i;
		plot?.querySelectorAll<HTMLElement>('[data-bar]')[i]?.focus();
	}

	const spoken = (d: BarChartDatum) => `${d.label}, ${format(d.value)}${unit ? ` ${unit}` : ''}`;
</script>

<div bind:this={ref} class={cn('flex w-full max-w-[520px] pt-10', className)} {...restProps}>
	<!-- Tick labels sit in their own gutter, sized by the widest one, so
	     gridlines can span the plot. -->
	<div
		aria-hidden="true"
		class="text-muted-foreground relative mr-3 grid shrink-0 text-xs tabular-nums"
	>
		{#each gridlines as tick (tick)}
			<span class="invisible col-start-1 row-start-1 h-0 leading-none">{format(tick)}</span>
		{/each}
		<div class="relative col-start-1 row-start-1" style:height="{height}px">
			{#each gridlines as tick (tick)}
				<span
					class="absolute right-0 -translate-y-1/2 leading-none whitespace-nowrap"
					style:top="{height - (tick / top) * height}px"
				>
					{format(tick)}
				</span>
			{/each}
		</div>
	</div>

	<div class="min-w-0 flex-1">
		<div
			bind:this={plot}
			{@attach reveal}
			role="group"
			aria-label={label}
			class="relative flex"
			style:height="{height}px"
			onpointerleave={(event) => {
				if (event.pointerType !== 'touch') active = null;
			}}
		>
			{#each gridlines as tick (tick)}
				<div
					aria-hidden="true"
					class="bg-border absolute inset-x-0 h-px"
					style:top="{height - (tick / top) * height}px"
				></div>
			{/each}
			{#each data as datum, i (i)}
				{@const h = heights[i] ?? 0}
				<!-- The whole column is the hit target, not just the bar. -->
				<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
				<div
					data-bar
					role="img"
					tabindex={i === tabStop ? 0 : -1}
					aria-label={spoken(datum)}
					class="focus-visible:ring-ring relative flex-1 rounded-lg outline-none focus-visible:ring-2"
					onpointerenter={(event) => {
						if (event.pointerType !== 'touch') active = i;
					}}
					onpointerdown={(event) => {
						if (event.pointerType === 'touch') active = i;
					}}
					onfocus={() => {
						focusIndex = i;
						active = i;
					}}
					onblur={(event) => {
						if (!plot?.contains(event.relatedTarget as Node | null)) active = null;
					}}
					onkeydown={(event) => {
						const next = {
							ArrowLeft: i - 1,
							ArrowRight: i + 1,
							Home: 0,
							End: data.length - 1
						}[event.key];
						if (next === undefined) return;
						event.preventDefault();
						move(next);
					}}
				>
					<div
						aria-hidden="true"
						class={cn(
							'absolute bottom-0 left-1/2 w-[min(2.5rem,70%)] -translate-x-1/2 transition-opacity duration-(--duration-fast)',
							active !== null && active !== i ? 'opacity-40 ease-in' : 'ease-out'
						)}
						style:height="{height}px"
					>
						<div
							class="bg-primary absolute inset-x-0 bottom-0 origin-bottom"
							style:height="{height - CAP}px"
							style:transform="scaleY({Math.max(h - CAP, 0) / Math.max(height - CAP, 1)})"
						></div>
						<!-- Overlaps the body by 1px so no seam shows at fractional heights,
						     and hides until the bar has height so an empty bar shows no stub. -->
						<div
							class="bg-primary absolute inset-x-0 bottom-0 rounded-t-[6px]"
							style:height="{CAP + 1}px"
							style:transform="translateY({-Math.max(h - CAP - 1, 0)}px)"
							style:opacity={h < 0.5 ? 0 : 1}
						></div>
					</div>
					<!-- Rides 8px above the bar, following it while it grows. -->
					<div
						aria-hidden="true"
						class="pointer-events-none absolute bottom-0 left-1/2 z-10"
						style:transform="translate(-50%, {-h - 8}px)"
					>
						<div
							class={cn(
								'bg-popover text-popover-foreground rounded-full px-3 py-1.5 text-xs whitespace-nowrap shadow-lg transition-[opacity,translate] motion-reduce:translate-y-0',
								active === i
									? 'duration-(--duration-instant) ease-out'
									: 'translate-y-1 opacity-0 duration-(--duration-instant) ease-in'
							)}
						>
							<span class="font-semibold tabular-nums">{format(datum.value)}</span>
						</div>
					</div>
				</div>
			{/each}
		</div>
		<div aria-hidden="true" class="mt-3 flex">
			{#each data as datum, i (i)}
				<span
					class={cn(
						'min-w-0 flex-1 truncate text-center text-xs transition-colors duration-(--duration-fast) ease-out sm:text-sm',
						active === i ? 'text-foreground' : 'text-muted-foreground'
					)}
				>
					{datum.label}
				</span>
			{/each}
		</div>
	</div>
</div>
