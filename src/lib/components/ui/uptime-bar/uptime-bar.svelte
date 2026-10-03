<script lang="ts" module>
	export type UptimeIncident = {
		/** Days before today. 0 is today. */
		daysAgo: number;
		level: 'degraded' | 'outage';
		/** What happened, such as "Elevated error rate". */
		title: string;
		/** How long it lasted. */
		minutes: number;
	};

	export type UptimeService = { name: string; incidents: UptimeIncident[] };
</script>

<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import type { TransitionConfig } from 'svelte/transition';
	import { duration, easeIn, easeOut, prefersReducedMotion } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** One row per service, each with its incidents. */
		services: UptimeService[];
		/** Days of history. Narrow layouts (under 400px) show half, so every day stays a tappable bar. */
		days?: number;
		/** The root element. */
		ref?: HTMLDivElement | null;
		/** Classes for the root element. */
		class?: string;
	};

	let {
		services,
		days: fullDays = 60,
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	const DAY_MINUTES = 1440;
	// Healthy days are a quiet tint so weeks of calm do not shout; incidents keep
	// their full strength, since they are what people come to find.
	const TONE = { ok: 'bg-success/40', degraded: 'bg-warning', outage: 'bg-destructive' };

	type Spot = { row: number; day: number };

	let narrow = $state(false);
	let spot = $state<Spot | null>(null);
	const days = $derived(narrow ? Math.max(1, Math.ceil(fullDays / 2)) : fullDays);

	const ago = (d: number) => (d === 0 ? 'Today' : d === 1 ? 'Yesterday' : `${d} days ago`);
	const short = (m: number) => (m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`);
	const incidentOn = (s: UptimeService, day: number) => s.incidents.find((i) => i.daysAgo === day);

	function uptime(service: UptimeService) {
		const down = service.incidents
			.filter((i) => i.daysAgo < days)
			// Degraded counts at a third: slow is not down, but it is not fine either.
			.reduce((t, i) => t + (i.level === 'outage' ? i.minutes : i.minutes / 3), 0);
		return (100 * (1 - down / (days * DAY_MINUTES))).toFixed(2);
	}

	const operational = $derived(services.every((s) => !incidentOn(s, 0)));
	// Spoken only for focus and the keys. A pointer sweeping across the bars
	// would otherwise queue an announcement for every day it crosses.
	let announcement = $state('');
	function speak(at: Spot | null) {
		const service = at ? services[at.row] : undefined;
		if (!at || !service) {
			announcement = '';
			return;
		}
		const inc = incidentOn(service, at.day);
		announcement = `${service.name}, ${ago(at.day)}: ${inc ? `${inc.title}, ${short(inc.minutes)}` : 'no downtime'}`;
	}

	function measure(node: HTMLElement) {
		const update = () => (narrow = node.offsetWidth > 0 && node.offsetWidth < 400);
		update();
		if (typeof ResizeObserver === 'undefined') return;
		const observer = new ResizeObserver(update);
		observer.observe(node);
		return () => observer.disconnect();
	}

	function pick(row: number, event: PointerEvent & { currentTarget: HTMLElement }) {
		const el = event.currentTarget;
		const rect = el.getBoundingClientRect();
		if (!rect.width) return;
		// The row mirrors in RTL, so the oldest day sits at the right edge.
		const x =
			getComputedStyle(el).direction === 'rtl'
				? rect.right - event.clientX
				: event.clientX - rect.left;
		const index = Math.min(days - 1, Math.max(0, Math.floor((x / rect.width) * days)));
		const day = days - 1 - index;
		if (spot?.row !== row || spot.day !== day) spot = { row, day };
	}

	function onkeydown(row: number, event: KeyboardEvent & { currentTarget: HTMLElement }) {
		const current = spot?.row === row ? spot.day : 0;
		// Each arrow moves the way it points: toward today is rightward, or leftward in RTL.
		const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
		const next = {
			ArrowLeft: rtl ? current - 1 : current + 1,
			ArrowRight: rtl ? current + 1 : current - 1,
			Home: days - 1,
			End: 0
		}[event.key];
		if (event.key === 'Escape') {
			spot = null;
			speak(null);
			return;
		}
		if (next === undefined) return;
		event.preventDefault();
		spot = { row, day: Math.min(days - 1, Math.max(0, next)) };
		speak(spot);
	}

	/** The caption swaps in place: the new story rises out of a blur, the old one leaves faster. */
	function swap(_node: Element, { exit = false } = {}): TransitionConfig {
		if (prefersReducedMotion()) return { duration: duration.fast, css: (t) => `opacity: ${t}` };
		const y = exit ? -4 : 4;
		return {
			duration: exit ? duration.fast : duration.base,
			easing: exit ? easeIn : easeOut,
			css: (t, u) => `opacity: ${t}; translate: 0 ${u * y}px; filter: blur(${u * 4}px)`
		};
	}
</script>

<div bind:this={ref} {@attach measure} class={cn('w-full max-w-[440px]', className)} {...restProps}>
	<div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
		<p class="text-foreground flex items-center gap-2 text-sm font-medium">
			<span
				aria-hidden="true"
				class={cn('size-2 rounded-full', operational ? 'bg-success' : 'bg-warning')}
			></span>
			{operational ? 'All systems operational' : 'Some systems degraded'}
		</p>
		<p class="text-muted-foreground text-xs tabular-nums">Last {days} days</p>
	</div>

	<div class="mt-6 flex flex-col gap-6">
		{#each services as service, r (service.name)}
			{@const here = spot?.row === r ? spot : null}
			{@const inc = here ? incidentOn(service, here.day) : undefined}
			{@const key = here ? (inc ? `${here.day}:${inc.title}` : 'ok') : 'uptime'}
			<div>
				<div class="mb-2.5 flex h-5 items-center justify-between gap-4 text-sm">
					<span class="text-foreground shrink-0 font-medium">{service.name}</span>
					<!-- The caption is the readout: point at a day and the uptime figure
					     becomes that day's story, in place. -->
					<span
						aria-hidden="true"
						class="text-muted-foreground flex min-w-0 items-center justify-end gap-2"
					>
						{#if here}
							<span class="shrink-0 tabular-nums">{ago(here.day)}</span>
						{/if}
						<span class="grid min-w-0 justify-items-end">
							{#key key}
								<span
									class="col-start-1 row-start-1 flex max-w-full min-w-0 items-center gap-1.5"
									in:swap
									out:swap={{ exit: true }}
								>
									{#if here}
										<span
											class={cn(
												'size-1.5 shrink-0 rounded-full',
												inc
													? inc.level === 'outage'
														? 'bg-destructive'
														: 'bg-warning'
													: 'bg-success'
											)}
										></span>
										<span class={cn('truncate', inc && 'text-foreground')}>
											{inc ? `${inc.title}, ${short(inc.minutes)}` : 'No downtime'}
										</span>
									{:else}
										<span class="truncate tabular-nums">{uptime(service)}% uptime</span>
									{/if}
								</span>
							{/key}
						</span>
					</span>
				</div>

				<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
				<div
					role="group"
					tabindex="0"
					aria-label="{service.name}: {uptime(
						service
					)}% uptime over {days} days. Arrow keys step through days."
					class="focus-visible:ring-ring focus-visible:ring-offset-background flex h-7 cursor-default gap-[3px] rounded-md outline-none focus-visible:ring-2 focus-visible:ring-offset-4"
					onpointermove={(event) => pick(r, event)}
					onpointerleave={() => (spot = null)}
					onfocus={() => {
						if (spot?.row !== r) spot = { row: r, day: 0 };
						speak(spot);
					}}
					onblur={() => {
						spot = null;
						speak(null);
					}}
					onkeydown={(event) => onkeydown(r, event)}
				>
					{#each { length: days }, i (i)}
						{@const day = days - 1 - i}
						{@const bad = incidentOn(service, day)}
						<!-- The rest of the row steps back so the day you are on is the one that reads. -->
						<span
							class={cn(
								'h-full min-w-0 flex-1 rounded-[2px] transition-[opacity,scale] duration-(--duration-fast) ease-out motion-reduce:scale-100',
								bad ? TONE[bad.level] : TONE.ok,
								here && here.day !== day && 'opacity-35',
								here?.day === day && 'scale-y-115'
							)}
						></span>
					{/each}
				</div>
			</div>
		{/each}
	</div>

	<div aria-hidden="true" class="text-muted-foreground mt-3 flex justify-between text-xs">
		<span>{days} days ago</span>
		<span>Today</span>
	</div>
	<p class="sr-only" aria-live="polite">{announcement}</p>
</div>
