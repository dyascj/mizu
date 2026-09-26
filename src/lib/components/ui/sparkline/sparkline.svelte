<script lang="ts" module>
	export type SparklinePoint = {
		/** Names the point in the readout and the data table, such as "Sep 3". */
		label: string;
		value: number;
	};
</script>

<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { prefersReducedMotion } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** Points from oldest to newest. The newest is the headline figure. */
		data: SparklinePoint[];
		/** Names the chart for everyone, such as "Response time". Shown as the summary title. */
		label: string;
		/** Turns a value into display text, such as `(v) => \`${v} ms\``. */
		format?: (value: number) => string;
		/** Show the label, the newest value, and the change since the first point above the line. */
		summary?: boolean;
		/** The root element. */
		ref?: HTMLDivElement | null;
		/** Classes for the root element. */
		class?: string;
	};

	let {
		data,
		label,
		format = (value) => String(value),
		summary = true,
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	// The plot's coordinate space. It scales with the width, so everything laid
	// over it is positioned in percentages.
	const W = 520;
	const H = 160;
	// Room for the scrub dot and its ring at the extremes.
	const PAD_X = 8;
	const PAD_Y = 10;

	let shown = $state(false);
	let active = $state(false);
	let picked = $state<number | null>(null);
	let announcement = $state('');
	let plot = $state<HTMLDivElement | null>(null);
	let tip = $state<HTMLDivElement | null>(null);
	let tipWidth = $state(0);

	const last = $derived(Math.max(data.length - 1, 0));
	const index = $derived(Math.min(picked ?? last, last));
	const geometry = $derived.by(() => {
		const values = data.map((d) => d.value);
		const min = Math.min(...values);
		const span = Math.max(...values) - min || 1;
		const step = (W - PAD_X * 2) / Math.max(data.length - 1, 1);
		const x = (i: number) => PAD_X + i * step;
		const y = (v: number) => PAD_Y + (1 - (v - min) / span) * (H - PAD_Y * 2);
		const line = data
			.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(d.value).toFixed(1)}`)
			.join(' ');
		const area = data.length
			? `${line} L${x(data.length - 1).toFixed(1)} ${H} L${x(0).toFixed(1)} ${H} Z`
			: '';
		return { step, x, y, line, area };
	});
	const point = $derived(data[index]);
	const delta = $derived(data.length ? data[last].value - data[0].value : 0);

	const pct = (value: number, of: number) => `${(value / of) * 100}%`;
	const describe = (i: number) => (data[i] ? `${data[i].label}: ${format(data[i].value)}` : '');

	function nearest(clientX: number) {
		const box = plot?.getBoundingClientRect();
		if (!box || !box.width) return index;
		const x = ((clientX - box.left) / box.width) * W;
		return Math.min(Math.max(Math.round((x - PAD_X) / geometry.step), 0), last);
	}

	/** Draws the line the first time the chart scrolls into view. */
	function reveal(node: HTMLElement) {
		if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
			shown = true;
			return;
		}
		const observer = new IntersectionObserver((entries) => {
			if (!entries.some((entry) => entry.isIntersecting)) return;
			shown = true;
			observer.disconnect();
		});
		observer.observe(node);
		return () => observer.disconnect();
	}

	// Measured whenever the readout's text changes, to keep it inside the chart.
	$effect(() => {
		void point;
		if (tip) tipWidth = tip.offsetWidth;
	});

	function onkeydown(event: KeyboardEvent) {
		const next = {
			ArrowLeft: index - 1,
			ArrowRight: index + 1,
			Home: 0,
			End: last
		}[event.key];
		if (next === undefined) return;
		event.preventDefault();
		picked = Math.min(Math.max(next, 0), last);
		active = true;
		announcement = describe(picked);
	}
</script>

<div bind:this={ref} class={cn('w-full max-w-[520px]', className)} {...restProps}>
	{#if summary}
		<div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
			<div class="min-w-0">
				<p class="text-muted-foreground text-sm">{label}</p>
				<p class="text-foreground text-3xl font-semibold tracking-tight tabular-nums">
					{data.length ? format(data[last].value) : ''}
				</p>
			</div>
			{#if data.length > 1}
				<p class="text-muted-foreground text-sm">
					<span class="text-foreground font-medium tabular-nums"
						>{delta > 0 ? '+' : delta < 0 ? '\u2212' : ''}{format(Math.abs(delta))}</span
					>
					vs {data[0].label}
				</p>
			{/if}
		</div>
	{/if}

	<!-- A focusable group: arrow keys read the chart point by point, and the live
	     region announces each value. -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
	<div
		bind:this={plot}
		{@attach reveal}
		role="group"
		tabindex="0"
		aria-roledescription="line chart"
		aria-label="{label}, {data.length} points. Use arrow keys to read values."
		class="focus-visible:ring-ring focus-visible:ring-offset-background relative mt-12 aspect-[520/160] w-full touch-pan-y rounded-lg outline-none select-none focus-visible:ring-2 focus-visible:ring-offset-4"
		onpointerdown={(event) => {
			if (event.pointerType !== 'touch') return;
			picked = nearest(event.clientX);
			active = true;
		}}
		onpointermove={(event) => {
			if (event.pointerType === 'touch' && !active) return;
			picked = nearest(event.clientX);
			active = true;
		}}
		onpointerleave={(event) => {
			if (event.pointerType !== 'touch') active = false;
		}}
		onpointerup={(event) => {
			if (event.pointerType === 'touch') active = false;
		}}
		onpointercancel={() => (active = false)}
		onfocus={() => {
			active = true;
			announcement = describe(index);
		}}
		onblur={() => (active = false)}
		{onkeydown}
	>
		<svg
			viewBox="0 0 {W} {H}"
			preserveAspectRatio="none"
			class="absolute inset-0 size-full overflow-visible"
			aria-hidden="true"
		>
			<path
				d={geometry.area}
				class={cn(
					'fill-primary/8 transition-opacity duration-(--duration-deliberate) ease-out',
					shown ? 'opacity-100' : 'opacity-0'
				)}
			/>
			<!-- Opacity hides the round cap's dot before the draw starts. Reduced
			     motion skips the draw and keeps only the fade. -->
			<path
				d={geometry.line}
				pathLength="1"
				fill="none"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				vector-effect="non-scaling-stroke"
				stroke-dasharray="1 1"
				stroke-dashoffset={shown ? 0 : 1}
				class={cn(
					'stroke-primary [transition:stroke-dashoffset_var(--duration-deliberate)_var(--ease-out),opacity_var(--duration-instant)_var(--ease-out)] motion-reduce:[transition:opacity_var(--duration-deliberate)_var(--ease-out)]',
					shown ? 'opacity-100' : 'opacity-0'
				)}
			/>
		</svg>

		<!-- The readout moves instantly: easing would make it trail the pointer.
		     Only its appearance fades. -->
		{#if point}
			<div
				aria-hidden="true"
				class={cn(
					'pointer-events-none absolute inset-0 transition-opacity',
					active
						? 'duration-(--duration-instant) ease-out'
						: 'opacity-0 duration-(--duration-fast) ease-in'
				)}
			>
				<div
					class="bg-foreground/15 absolute top-0 h-full w-px -translate-x-1/2"
					style:left={pct(geometry.x(index), W)}
				></div>
				<div
					class="bg-primary ring-background absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2"
					style:left={pct(geometry.x(index), W)}
					style:top={pct(geometry.y(point.value), H)}
				></div>
				<!-- Clamped by its own measured width so it never leaves the chart. -->
				<div
					bind:this={tip}
					class="bg-popover text-popover-foreground absolute bottom-full mb-2.5 flex -translate-x-1/2 items-baseline gap-2 rounded-full px-3 py-1.5 text-xs whitespace-nowrap shadow-lg"
					style:left="clamp({tipWidth / 2}px, {pct(geometry.x(index), W)}, calc(100% - {tipWidth /
						2}px))"
				>
					<span class="font-semibold tabular-nums">{format(point.value)}</span>
					<span class="text-muted-foreground">{point.label}</span>
				</div>
			</div>
		{/if}
	</div>

	<span class="sr-only" aria-live="polite">{announcement}</span>
	<!-- sr-only on a wrapper: a table ignores the 1px height and would stretch the page. -->
	<div class="sr-only">
		<table>
			<caption>{label}</caption>
			<thead>
				<tr>
					<th scope="col">Point</th>
					<th scope="col">Value</th>
				</tr>
			</thead>
			<tbody>
				{#each data as d, i (i)}
					<tr>
						<th scope="row">{d.label}</th>
						<td>{format(d.value)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
