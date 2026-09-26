<script lang="ts" module>
	// Tooltips share a warm period: after one closes, the next opens instantly.
	let lastClosedAt = 0;
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import type { HTMLTimeAttributes } from 'svelte/elements';
	import type { TransitionConfig } from 'svelte/transition';
	import { duration, easeIn, easeOut, prefersReducedMotion } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLTimeAttributes, 'children'> & {
		/** The moment to describe, past ("5 min ago") or still to come ("in 5 min"). Pass null while it is not known yet; a placeholder holds its width. */
		date: Date | number | string | null;
		/** Pins "now" to this timestamp instead of the live clock, for tests and replays. */
		now?: number;
		/** BCP 47 locale for the full date in the tooltip and for dates older than a week. */
		locale?: string;
		/** The time element. */
		ref?: HTMLElement | null;
		/** Classes for the time element. */
		class?: string;
	};

	let {
		date,
		now,
		locale,
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	const SEC = 1000;
	const MIN = 60 * SEC;
	const HOUR = 60 * MIN;
	const DAY = 24 * HOUR;
	const WEEK = 7 * DAY;
	// The first tooltip waits, so passing over text does not flash it; neighbors
	// then open instantly while the group is still warm.
	const OPEN_DELAY = 400;
	const WARM_FOR = 500;
	// setTimeout overflows past about 24.8 days and fires immediately.
	const MAX_TIMEOUT = 2 ** 31 - 1;
	// Lands just past a boundary so the floor has definitely moved.
	const SETTLE = 20;
	const VIEWPORT_GUTTER = 8;

	/** `diff` is now minus the moment, so a moment still to come is negative. */
	function describe(diff: number, time: number) {
		const span = Math.abs(diff);
		if (span < 10 * SEC) return 'just now';
		if (span >= WEEK) {
			return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(time);
		}
		if (span >= DAY && span < 2 * DAY) return diff > 0 ? 'yesterday' : 'tomorrow';
		const amount =
			span < MIN
				? `${Math.floor(span / SEC)} sec`
				: span < HOUR
					? `${Math.floor(span / MIN)} min`
					: span < DAY
						? `${Math.floor(span / HOUR)} hr`
						: `${Math.floor(span / DAY)} days`;
		return diff > 0 ? `${amount} ago` : `in ${amount}`;
	}

	/** Milliseconds until the label would read differently, so it wakes once per visible change. */
	function untilChange(diff: number) {
		// Past a week either way it shows a calendar date; an hourly check is plenty.
		if (Math.abs(diff) >= WEEK) return HOUR;
		if (diff < 0) {
			// Counting down: the label drops a step each time the time left falls
			// below a whole unit. Inside ten seconds it reads "just now" until ten
			// seconds after the moment.
			const ahead = -diff;
			if (ahead < 10 * SEC) return ahead + 10 * SEC;
			const unit = ahead < MIN ? SEC : ahead < HOUR ? MIN : ahead < DAY ? HOUR : DAY;
			return ahead % unit;
		}
		if (diff < 10 * SEC) return 10 * SEC - diff;
		const unit = diff < MIN ? SEC : diff < HOUR ? MIN : diff < DAY ? HOUR : DAY;
		return unit - (diff % unit);
	}

	const time = $derived.by(() => {
		if (date === null) return null;
		const value = new Date(date).getTime();
		return Number.isNaN(value) ? null : value;
	});

	// The server has no idea what "now" is on the reader's clock, so it renders
	// a placeholder and the browser fills in after hydration.
	let mounted = $state(false);
	let clock = $state(0);
	onMount(() => {
		mounted = true;
	});

	const text = $derived.by(() => {
		void clock;
		if (!mounted || time === null) return null;
		return describe((now ?? Date.now()) - time, time);
	});

	$effect(() => {
		// A pinned clock only changes when the caller passes a new one.
		if (time === null || now !== undefined) return;
		const from = time;
		let timer: ReturnType<typeof setTimeout>;
		const schedule = () => {
			const wait = untilChange(Date.now() - from) + SETTLE;
			timer = setTimeout(
				() => {
					clock += 1;
					schedule();
				},
				Math.min(wait, MAX_TIMEOUT)
			);
		};
		schedule();
		// Background tabs throttle timers; catch up the moment the page is seen.
		const onVisible = () => {
			if (document.visibilityState !== 'visible') return;
			clearTimeout(timer);
			clock += 1;
			schedule();
		};
		document.addEventListener('visibilitychange', onVisible);
		return () => {
			clearTimeout(timer);
			document.removeEventListener('visibilitychange', onVisible);
		};
	});

	const parts = $derived.by(() => {
		const match = text?.match(/^(\D*?)(\d+)(.*)$/);
		const digits = match ? Array.from(match[2]) : [];
		// Keyed from the right, so 9 to 10 rolls the ones and brings a new tens digit in beside it.
		return {
			lead: match ? match[1] : '',
			digits: digits.map((digit, i) => ({ digit, slot: digits.length - i })),
			rest: match ? match[3] : (text ?? '')
		};
	});

	const uid = $props.id();
	const tipId = `${uid}-tip`;
	let open = $state(false);
	let instant = $state(false);
	let openTimer: ReturnType<typeof setTimeout> | undefined;
	const full = $derived(
		time === null
			? ''
			: new Intl.DateTimeFormat(locale, {
					weekday: 'short',
					month: 'short',
					day: 'numeric',
					year: 'numeric',
					hour: 'numeric',
					minute: '2-digit'
				}).format(time)
	);

	function show(delayed: boolean) {
		clearTimeout(openTimer);
		const warm = Date.now() - lastClosedAt < WARM_FOR;
		if (!delayed || warm) {
			instant = warm;
			open = true;
			return;
		}
		instant = false;
		openTimer = setTimeout(() => (open = true), OPEN_DELAY);
	}

	function hide() {
		clearTimeout(openTimer);
		if (open) lastClosedAt = Date.now();
		open = false;
	}

	$effect(() => () => clearTimeout(openTimer));

	// New values come up from below and old ones leave upward: time only moves
	// forward, so the roll always runs the same way. The exit travels less and
	// leaves faster; it should not hold the eye.
	function roll(_node: Element, { exit = false } = {}): TransitionConfig {
		if (prefersReducedMotion()) return { duration: duration.fast, css: (t) => `opacity: ${t}` };
		const y = exit ? -0.4 : 0.55;
		return {
			duration: exit ? duration.fast : duration.base,
			easing: exit ? easeIn : easeOut,
			css: (t, u) => `opacity: ${t}; translate: 0 ${u * y}em; filter: blur(${u * 3}px)`
		};
	}

	/** A digit column that appears or leaves also opens or closes its width, so neighbors never jump. */
	function slot(node: HTMLElement, { exit = false } = {}): TransitionConfig {
		const base = roll(node, { exit });
		if (prefersReducedMotion()) return base;
		const width = node.getBoundingClientRect().width;
		return { ...base, css: (t, u) => `${base.css?.(t, u)}; width: ${t * width}px` };
	}

	function tooltip(_node: Element): TransitionConfig {
		if (instant) return { duration: 0 };
		if (prefersReducedMotion()) return { duration: duration.fast, css: (t) => `opacity: ${t}` };
		return {
			duration: duration.fast,
			easing: easeOut,
			css: (t, u) =>
				`opacity: ${t}; scale: ${1 - u * 0.1}; translate: 0 ${u * 3}px; filter: blur(${u * 2}px)`
		};
	}

	function tooltipOut(_node: Element): TransitionConfig {
		const reduce = prefersReducedMotion();
		return {
			duration: duration.instant,
			easing: easeIn,
			css: (t, u) => `opacity: ${t}; scale: ${reduce ? 1 : 1 - u * 0.03}`
		};
	}

	/** Starts centered on the text; nudged sideways only if it would poke past the viewport. */
	function nudge(node: HTMLElement) {
		const rect = node.getBoundingClientRect();
		const max = document.documentElement.clientWidth - VIEWPORT_GUTTER;
		const shift =
			rect.left < VIEWPORT_GUTTER
				? VIEWPORT_GUTTER - rect.left
				: rect.right > max
					? max - rect.right
					: 0;
		node.style.marginLeft = `${Math.round(shift)}px`;
	}
</script>

<!-- Focusable so keyboard users can reach the full date in the tooltip. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<time
	{...restProps}
	bind:this={ref}
	datetime={time === null ? undefined : new Date(time).toISOString()}
	tabindex={text === null ? undefined : 0}
	aria-describedby={open ? tipId : undefined}
	class={cn(
		'focus-visible:ring-ring hover:text-foreground focus-visible:text-foreground relative inline-flex cursor-default rounded-sm whitespace-nowrap tabular-nums transition-colors duration-(--duration-fast) ease-out outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
		className
	)}
	onpointerenter={(event) => {
		if (event.pointerType !== 'touch') show(true);
	}}
	onpointerleave={hide}
	onfocus={() => show(false)}
	onblur={hide}
	onkeydown={(event) => {
		if (event.key === 'Escape') hide();
	}}
>
	{#if text === null}
		<!-- Holds roughly the right width so the line does not reflow on fill. -->
		<span aria-hidden="true" class="invisible">0 min ago</span>
	{:else}
		<span class="sr-only">{text}</span>
		<span aria-hidden="true" class="inline-flex">
			{#if parts.lead}
				<span class="relative inline-grid">
					{#key parts.lead}
						<span class="col-start-1 row-start-1 whitespace-pre" in:roll out:roll={{ exit: true }}
							>{parts.lead}</span
						>
					{/key}
				</span>
			{/if}
			{#each parts.digits as { digit, slot: place } (place)}
				<span class="relative inline-grid" in:slot out:slot={{ exit: true }}>
					{#key digit}
						<span class="col-start-1 row-start-1" in:roll out:roll={{ exit: true }}>{digit}</span>
					{/key}
				</span>
			{/each}
			<span class="relative inline-grid">
				{#key parts.rest}
					<span class="col-start-1 row-start-1 whitespace-pre" in:roll out:roll={{ exit: true }}
						>{parts.rest}</span
					>
				{/key}
			</span>
		</span>
		{#if open && full}
			<span class="pointer-events-none absolute bottom-full left-1/2 z-10 -translate-x-1/2 pb-1.5">
				<span
					{@attach nudge}
					id={tipId}
					role="tooltip"
					class="bg-popover text-popover-foreground block origin-bottom rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap shadow-lg"
					in:tooltip
					out:tooltipOut
				>
					{full}
				</span>
			</span>
		{/if}
	{/if}
</time>
