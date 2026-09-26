<script lang="ts">
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import type { HTMLAttributes } from 'svelte/elements';
	import { prefersReducedMotion } from '$lib/components/ui/motion';
	import { NumberTicker } from '$lib/components/ui/number-ticker';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDListElement>, 'children'> & {
		/** What is measured, such as "Tokens used". */
		label: string;
		/** The current figure. Counts up from zero the first time it scrolls into view. */
		value: number;
		/** Intl.NumberFormat options for the figure, such as currency, percent, or compact notation. */
		format?: Intl.NumberFormatOptions;
		/** BCP 47 locale for the figure and the trend. */
		locale?: string;
		/** Change against the previous period as a fraction: 0.12 is +12%. */
		trend?: number;
		/** Which direction is good news. Latency going up is not, so it reads as destructive. */
		goodWhen?: 'up' | 'down';
		/**
		 * Recent history from oldest to newest, drawn as a line you can scrub to
		 * read past figures. The newest entry should equal `value`.
		 */
		series?: number[];
		/** Names each point in `series` while scrubbing. Defaults to days ago: "Today", "Yesterday", "3 days ago". */
		labels?: string[];
		/** Position among sibling stats. Each step delays the line's entrance by one stagger step. */
		index?: number;
		/** The root element. */
		ref?: HTMLDListElement | null;
		/** Classes for the card. */
		class?: string;
	};

	let {
		label,
		value,
		format,
		locale,
		trend,
		goodWhen = 'up',
		series = [],
		labels,
		index = 0,
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	const W = 120;
	const H = 32;

	let started = $state(false);
	// The point being inspected, or null for now.
	let scrub = $state<number | null>(null);

	const last = $derived(Math.max(series.length - 1, 0));
	const inspected = $derived(scrub === null ? null : Math.min(scrub, last));
	const shown = $derived(inspected === null ? value : series[inspected]);
	const numberFormat = $derived(new Intl.NumberFormat(locale, format));
	const trendFormat = $derived(
		new Intl.NumberFormat(locale, {
			style: 'percent',
			maximumFractionDigits: 1,
			signDisplay: 'exceptZero'
		})
	);
	const up = $derived((trend ?? 0) >= 0);
	const good = $derived(up === (goodWhen === 'up'));
	const trendText = $derived(trend === undefined ? '' : trendFormat.format(trend));

	const ago = (steps: number) =>
		steps === 0 ? 'Today' : steps === 1 ? 'Yesterday' : `${steps} days ago`;
	const nameOf = (i: number) => labels?.[i] ?? ago(last - i);
	const when = $derived(inspected === null ? null : nameOf(inspected));

	const points = $derived.by(() => {
		const min = Math.min(...series);
		const span = Math.max(...series) - min || 1;
		// 2px inset so the line is never clipped at the extremes.
		return series.map((v, i) => ({
			x: series.length > 1 ? (i / (series.length - 1)) * W : W / 2,
			y: 2 + (1 - (v - min) / span) * (H - 4)
		}));
	});
	const path = $derived(
		points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
	);
	const at = $derived(inspected === null ? null : points[inspected]);
	// Past the inspected point the line is the future, so it steps back.
	const cut = $derived(inspected === null || last === 0 ? 0 : (1 - inspected / last) * 100);

	/** Counts up and wipes the line in the first time the card scrolls into view. */
	function reveal(node: HTMLElement) {
		if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
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

	function pick(event: PointerEvent & { currentTarget: HTMLElement }) {
		const box = event.currentTarget.getBoundingClientRect();
		if (!box.width) return;
		const t = Math.min(Math.max((event.clientX - box.left) / box.width, 0), 1);
		scrub = Math.round(t * last);
	}

	function onkeydown(event: KeyboardEvent) {
		const current = inspected ?? last;
		const next = {
			ArrowLeft: current - 1,
			ArrowDown: current - 1,
			ArrowRight: current + 1,
			ArrowUp: current + 1,
			Home: 0,
			End: last,
			Escape: last
		}[event.key];
		if (next === undefined) return;
		event.preventDefault();
		const clamped = Math.min(Math.max(next, 0), last);
		scrub = clamped === last ? null : clamped;
	}

	const chip =
		'col-start-1 row-start-1 inline-flex items-center gap-1 self-start rounded-full bg-secondary px-2 text-xs leading-6 font-medium tabular-nums transition-[opacity,filter]';
</script>

<dl
	bind:this={ref}
	{@attach reveal}
	class={cn('bg-card flex min-w-0 flex-col gap-1 rounded-2xl p-4 shadow-sm', className)}
	{...restProps}
>
	<dt class="text-muted-foreground truncate text-sm">{label}</dt>
	<dd class="flex min-w-0 flex-col gap-3">
		<span class="sr-only">
			{numberFormat.format(value)}{trendText ? `, ${trendText}` : ''}
		</span>
		<!-- Muted while it shows the past, so a glance never mistakes an old figure for today's. -->
		<span
			aria-hidden="true"
			class={cn(
				'truncate text-2xl font-semibold tracking-tight transition-colors duration-(--duration-fast) ease-out',
				inspected === null || inspected === last ? 'text-foreground' : 'text-muted-foreground'
			)}
		>
			<NumberTicker value={started ? shown : 0} {locale} {format} />
		</span>

		{#if trendText || series.length > 1}
			<!-- Trend and date share one cell and swap through a blur, so the chip
			     never jumps in width mid-scrub. -->
			<span aria-hidden="true" class="grid h-6 self-start">
				<span
					class={cn(
						chip,
						good ? 'text-foreground' : 'text-destructive',
						when || !trendText
							? 'opacity-0 blur-[4px] duration-(--duration-instant) ease-in'
							: 'duration-(--duration-base) ease-out'
					)}
				>
					<ArrowUp
						class={cn(
							'size-3 transition-[rotate] duration-(--duration-base) ease-out motion-reduce:transition-none',
							!up && 'rotate-180'
						)}
					/>
					<!-- Remounts when the figure changes, so it resolves from a soft blur. -->
					{#key trendText}
						<span
							class="transition-[opacity,filter] duration-(--duration-base) ease-out starting:opacity-0 starting:blur-[4px]"
						>
							{trendText}
						</span>
					{/key}
				</span>
				<span
					class={cn(
						chip,
						'text-muted-foreground',
						when
							? 'duration-(--duration-base) ease-out'
							: 'opacity-0 blur-[4px] duration-(--duration-instant) ease-in'
					)}
				>
					{when ?? nameOf(last)}
				</span>
			</span>
		{/if}

		{#if series.length > 1}
			<!-- A few px of padding widens the target without moving the line. -->
			<div
				role="slider"
				tabindex="0"
				aria-label="{label} history"
				aria-valuemin={0}
				aria-valuemax={last}
				aria-valuenow={inspected ?? last}
				aria-valuetext="{numberFormat.format(shown)}, {nameOf(inspected ?? last)}"
				class="focus-visible:ring-ring -m-1 cursor-ew-resize touch-pan-y rounded-lg p-1 outline-none focus-visible:ring-2"
				onpointermove={(event) => {
					if (event.pointerType === 'mouse' || event.buttons) pick(event);
				}}
				onpointerdown={(event) => {
					// Touch scrubs by dragging along the line.
					event.currentTarget.setPointerCapture?.(event.pointerId);
					pick(event);
				}}
				onpointerleave={(event) => {
					if (!event.currentTarget.hasPointerCapture?.(event.pointerId)) scrub = null;
				}}
				onpointerup={(event) => {
					if (event.pointerType !== 'mouse') scrub = null;
				}}
				onpointercancel={() => (scrub = null)}
				onblur={() => (scrub = null)}
				{onkeydown}
			>
				<!-- Wipes in left to right, the direction time runs along the line. -->
				<div
					aria-hidden="true"
					class={cn(
						'relative h-8 w-full transition-[clip-path] duration-(--duration-deliberate) ease-out motion-reduce:transition-none',
						started ? '[clip-path:inset(-4px)]' : '[clip-path:inset(-4px_100%_-4px_-4px)]'
					)}
					style:transition-delay="calc({index} * var(--stagger))"
				>
					{#each [false, true] as past (past)}
						<!-- The same line twice. The second is clipped at the inspected point,
						     so everything up to it stays at full strength while the future
						     steps back. Clipping keeps the two from ever disagreeing. -->
						<svg
							viewBox="0 0 {W} {H}"
							preserveAspectRatio="none"
							class={cn(
								'text-primary/60 absolute inset-0 size-full overflow-visible transition-[opacity,clip-path] duration-(--duration-fast) ease-out',
								past ? inspected === null && 'opacity-0' : inspected !== null && 'opacity-30'
							)}
							style:clip-path={past ? `inset(-4px ${cut}% -4px -4px)` : undefined}
						>
							<!-- `d` as a style too, so browsers that can transition it morph
							     the line when the series moves on. -->
							<path
								d={path}
								style:d="path('{path}')"
								class="transition-[d] duration-(--duration-slow) ease-out motion-reduce:transition-none"
								fill="none"
								stroke="currentColor"
								stroke-width="1.5"
								stroke-linecap="round"
								stroke-linejoin="round"
								vector-effect="non-scaling-stroke"
							/>
						</svg>
					{/each}
					<span
						class={cn(
							'bg-foreground/20 pointer-events-none absolute inset-y-0 w-px transition-[left,opacity] duration-(--duration-fast) ease-out',
							at ? 'opacity-100' : 'opacity-0'
						)}
						style:left="{((at?.x ?? W) / W) * 100}%"
					></span>
					<span
						class={cn(
							'bg-primary ring-card pointer-events-none absolute -mt-[3.5px] -ml-[3.5px] size-[7px] rounded-full ring-2 transition-[left,top,opacity,scale] duration-(--duration-fast) ease-out',
							at ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
						)}
						style:left="{((at?.x ?? W) / W) * 100}%"
						style:top="{((at?.y ?? H / 2) / H) * 100}%"
					></span>
				</div>
			</div>
		{/if}
	</dd>
</dl>
