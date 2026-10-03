<script lang="ts" module>
	export type HeatmapDay = {
		/** The day as `YYYY-MM-DD`. */
		date: string;
		count: number;
		/** A level from 0 to 4 that overrides the thresholds, for data that arrives already bucketed. */
		level?: number;
	};
</script>

<script lang="ts">
	import { flushSync } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { prefersReducedMotion } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/**
		 * One entry per day, oldest to newest, starting on a Sunday, so each
		 * column is one week.
		 */
		data: HeatmapDay[];
		/** Names the grid for assistive technology. Defaults to "Activity over the last N weeks". */
		label?: string;
		/** Lower bounds for levels 1 to 4. */
		thresholds?: number[];
		/** What one count is, such as "run". Used in each day's description. */
		unit?: string;
		/** The plural of `unit`. Defaults to `unit` with an "s". */
		units?: string;
		/** Show the "Less to More" key under the grid. */
		legend?: boolean;
		/** BCP 47 locale for dates and numbers. */
		locale?: string;
		/** The root element. */
		ref?: HTMLDivElement | null;
		/** Classes for the root element. */
		class?: string;
	};

	let {
		data,
		label,
		thresholds = [1, 4, 7, 10],
		unit = 'contribution',
		units,
		legend = true,
		locale,
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	// 10px squares on a 13px pitch.
	const CELL = 10;
	const PITCH = 13;
	// One ink, light to dark. Level 0 stays faintly visible so empty days still
	// read as part of the grid.
	const LEVELS = ['bg-primary/8', 'bg-primary/25', 'bg-primary/45', 'bg-primary/70', 'bg-primary'];

	const weeks = $derived(Math.ceil(data.length / 7));
	const plural = $derived(units ?? `${unit}s`);
	const formats = $derived({
		short: new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', timeZone: 'UTC' }),
		long: new Intl.DateTimeFormat(locale, {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric',
			timeZone: 'UTC'
		}),
		month: new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' }),
		weekday: new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }),
		number: new Intl.NumberFormat(locale)
	});
	// Rows are Sunday to Saturday; only Monday, Wednesday, and Friday are named.
	// 2023-01-01 was a Sunday.
	const dayNames = $derived(
		Array.from({ length: 7 }, (_, day) =>
			day % 2 ? formats.weekday.format(Date.UTC(2023, 0, 1 + day)) : ''
		)
	);

	function phrase(count: number) {
		if (count === 0) return `No ${plural}`;
		return `${formats.number.format(count)} ${count === 1 ? unit : plural}`;
	}

	const cells = $derived(
		data.map((d) => {
			const date = new Date(`${d.date}T00:00:00Z`);
			let level = 0;
			for (const t of thresholds) if (d.count >= t) level++;
			return {
				level: Math.min(Math.max(d.level ?? level, 0), 4),
				tip: `${phrase(d.count)} on ${formats.short.format(date)}`,
				label: `${phrase(d.count)} on ${formats.long.format(date)}`,
				date
			};
		})
	);

	// A month is labelled at the column holding its first day. Labels closer
	// than three columns would collide, so the earlier one gives way.
	const months = $derived.by(() => {
		const out: { col: number; name: string }[] = [];
		cells.forEach((cell, i) => {
			if (cell.date.getUTCDate() !== 1) return;
			const col = Math.floor(i / 7);
			if (out.length && col - out[out.length - 1].col < 3) out.pop();
			out.push({ col, name: formats.month.format(cell.date) });
		});
		return out;
	});

	let wrap = $state<HTMLDivElement | null>(null);
	let scroller = $state<HTMLDivElement | null>(null);
	let grid = $state<HTMLDivElement | null>(null);
	let tip = $state<HTMLDivElement | null>(null);
	let tipLabel = $state('');
	let tipShown = $state(false);
	let shown = $state(false);
	// Roving tabindex: the grid is one tab stop, and arrows move within it.
	let focused = $state<number | null>(null);
	const focusIndex = $derived(Math.min(focused ?? data.length - 1, data.length - 1));

	// On a narrow screen, open on the most recent weeks, the part people look at.
	// Right to left, the weeks run the other way and scrollLeft counts down from 0.
	$effect(() => {
		if (!scroller) return;
		const rtl = getComputedStyle(scroller).direction === 'rtl';
		scroller.scrollLeft = rtl ? -scroller.scrollWidth : scroller.scrollWidth;
	});

	/** Sweeps the grid in the first time it scrolls into view. */
	function reveal(node: HTMLElement) {
		if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
			shown = true;
			return;
		}
		const observer = new IntersectionObserver(
			(entries) => {
				if (!entries.some((entry) => entry.isIntersecting)) return;
				shown = true;
				observer.disconnect();
			},
			{ threshold: 0.4 }
		);
		observer.observe(node);
		return () => observer.disconnect();
	}

	// The tooltip is one shared element moved directly, so sweeping across
	// hundreds of cells never re-renders them. It jumps with no transition: a tooltip that
	// glides between cells lags behind the pointer.
	function show(el: HTMLElement) {
		const cell = cells[Number(el.dataset.i)];
		if (!wrap || !tip || !cell) return;
		tipLabel = cell.tip;
		// Lays out the new text now, so the measurements below see it.
		flushSync();
		const box = wrap.getBoundingClientRect();
		const rect = el.getBoundingClientRect();
		// Undo any scale an ancestor applies.
		const scale = wrap.offsetWidth / box.width || 1;
		const width = tip.offsetWidth;
		const centre = (rect.left - box.left + rect.width / 2) * scale;
		// Clamped inside the chart so it never widens the page at the edges.
		const x = Math.min(Math.max(centre - width / 2, 0), wrap.offsetWidth - width);
		const y = (rect.top - box.top) * scale - tip.offsetHeight - 6;
		tip.style.transform = `translate(${x}px, ${y}px)`;
		tipShown = true;
	}

	function hide() {
		tipShown = false;
	}

	const cellFrom = (target: EventTarget | null) =>
		(target as HTMLElement | null)?.closest<HTMLElement>('[data-i]') ?? null;

	function move(next: number) {
		const i = Math.min(Math.max(next, 0), data.length - 1);
		focused = i;
		grid?.querySelector<HTMLElement>(`[data-i="${i}"]`)?.focus();
	}

	function onkeydown(event: KeyboardEvent) {
		const el = cellFrom(event.target);
		if (!el) return;
		if (event.key === 'Escape') return hide();
		const i = Number(el.dataset.i);
		const day = i % 7;
		// Weeks mirror right to left, so each arrow still moves the way it points.
		const week = getComputedStyle(el).direction === 'rtl' ? -7 : 7;
		const next = {
			ArrowUp: day > 0 ? i - 1 : i,
			ArrowDown: day < 6 ? i + 1 : i,
			ArrowLeft: i - week,
			ArrowRight: i + week,
			Home: day,
			End: (weeks - 1) * 7 + day
		}[event.key];
		if (next === undefined) return;
		event.preventDefault();
		// Past either end, including the gaps in a partial last week, stays put.
		move(next < 0 || next >= data.length ? i : next);
	}
</script>

<div bind:this={ref} class={cn('flex w-fit max-w-full flex-col gap-3', className)} {...restProps}>
	<!-- Observed rather than the grid: on a narrow screen most of the grid sits
	     outside its scroller and would never count as visible. -->
	<div
		bind:this={wrap}
		{@attach reveal}
		class="text-muted-foreground relative flex max-w-full text-xs"
	>
		<!-- Stays put while the weeks scroll, so rows keep their names. -->
		<div aria-hidden="true" class="me-[5px] mt-[23px] flex shrink-0 flex-col">
			{#each dayNames as day, i (i)}
				<span style:height="{PITCH}px" style:line-height="{CELL}px">{day}</span>
			{/each}
		</div>

		<!-- 3px of room on every side, so focus and hover rings are not clipped. -->
		<div
			bind:this={scroller}
			class="min-w-0 flex-1 overflow-x-auto overscroll-x-contain p-[3px]"
			onscroll={hide}
		>
			<div style:width="{weeks * PITCH - (PITCH - CELL)}px">
				<div aria-hidden="true" class="relative h-5">
					{#each months as m (m.col)}
						<span class="absolute top-0 leading-none" style:inset-inline-start="{m.col * PITCH}px"
							>{m.name}</span
						>
					{/each}
				</div>

				<!-- Focus lives on the cells (roving tabindex), not the grid itself. -->
				<!-- svelte-ignore a11y_interactive_supports_focus -->
				<div
					bind:this={grid}
					role="grid"
					aria-label={label ?? `Activity over the last ${weeks} weeks`}
					aria-readonly="true"
					data-shown={shown}
					class="group flex flex-col"
					style:gap="{PITCH - CELL}px"
					onpointerover={(event) => {
						if (event.pointerType === 'touch') return;
						const el = cellFrom(event.target);
						if (el) show(el);
					}}
					onpointerdown={(event) => {
						if (event.pointerType !== 'touch') return;
						const el = cellFrom(event.target);
						if (el) show(el);
					}}
					onpointerleave={(event) => {
						if (event.pointerType !== 'touch') hide();
					}}
					onfocusin={(event) => {
						const el = cellFrom(event.target);
						if (!el) return;
						focused = Number(el.dataset.i);
						show(el);
					}}
					onfocusout={(event) => {
						if (!grid?.contains(event.relatedTarget as Node | null)) hide();
					}}
					{onkeydown}
				>
					{#each { length: 7 }, day (day)}
						<div role="row" class="flex" style:gap="{PITCH - CELL}px">
							{#each { length: weeks }, week (week)}
								{@const i = week * 7 + day}
								{@const cell = cells[i]}
								{#if cell}
									<!-- Settles from 0.6, not 0: a square growing from nothing reads as
									     a pop, one settling from slightly small reads as arriving. The
									     whole year sweeps in over one deliberate duration. -->
									<div
										role="gridcell"
										data-i={i}
										tabindex={i === focusIndex ? 0 : -1}
										aria-label={cell.label}
										class={cn(
											'focus-visible:outline-ring hover:outline-foreground/50 shrink-0 scale-[0.6] rounded-[2px] opacity-0 transition-[opacity,scale] duration-(--duration-base) ease-out group-data-[shown=true]:scale-100 group-data-[shown=true]:opacity-100 hover:outline-1 hover:outline-offset-1 focus-visible:outline-2 focus-visible:outline-offset-1 motion-reduce:scale-100 motion-reduce:transition-none',
											LEVELS[cell.level]
										)}
										style:width="{CELL}px"
										style:height="{CELL}px"
										style:transition-delay="calc(var(--duration-deliberate) * {(
											week / weeks
										).toFixed(3)})"
									></div>
								{:else}
									<div role="presentation" style:width="{CELL}px"></div>
								{/if}
							{/each}
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Appears quickly and leaves faster, so it never lingers. -->
		<div
			bind:this={tip}
			aria-hidden="true"
			data-show={tipShown}
			class="pointer-events-none absolute top-0 left-0 z-10 opacity-0 transition-opacity duration-(--duration-instant) ease-in data-[show=true]:opacity-100 data-[show=true]:ease-out"
		>
			<span
				class="bg-popover text-popover-foreground block rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap shadow-lg"
				>{tipLabel}</span
			>
		</div>
	</div>

	{#if legend}
		<!-- Hidden from assistive technology: every cell already names its count. -->
		<div aria-hidden="true" class="text-muted-foreground flex items-center gap-1 self-end text-xs">
			<span class="me-1">Less</span>
			{#each LEVELS as level (level)}
				<span class={cn('rounded-[2px]', level)} style:width="{CELL}px" style:height="{CELL}px"
				></span>
			{/each}
			<span class="ms-1">More</span>
		</div>
	{/if}
</div>
