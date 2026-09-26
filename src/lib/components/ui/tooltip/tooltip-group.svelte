<script lang="ts" module>
	import { getContext, setContext, type Snippet } from 'svelte';

	/** What a trigger hands the group: where to point, and what to say. */
	export type TooltipGroupEntry = {
		el: HTMLElement | null;
		content: string | Snippet;
		shortcut?: string;
	};

	export type TooltipGroupContext = {
		/** The id of the trigger whose tooltip is showing, if any. */
		readonly openId: string | null;
		register: (id: string, entry: TooltipGroupEntry) => () => void;
		/** Asks to show a trigger's tooltip. `immediate` skips the delay, for keyboard focus. */
		request: (id: string, immediate: boolean) => void;
		/** The pointer or focus left the trigger. */
		release: (id: string) => void;
		/** A press or Escape: stay quiet until the pointer or focus moves on. */
		dismiss: (id: string) => void;
	};

	const KEY = Symbol('mizu-tooltip-group');

	export function getTooltipGroup(): TooltipGroupContext {
		const group = getContext<TooltipGroupContext | undefined>(KEY);
		if (!group) throw new Error('Tooltip.GroupTrigger must be inside a Tooltip.Group');
		return group;
	}

	function setTooltipGroup(group: TooltipGroupContext) {
		setContext(KEY, group);
	}
</script>

<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import type { TransitionConfig } from 'svelte/transition';
	import {
		SpringValue,
		duration as durations,
		easeOut,
		prefersReducedMotion,
		springPresets
	} from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = HTMLAttributes<HTMLDivElement> & {
		/**
		 * How long the pointer rests on a trigger before the first tooltip opens,
		 * in ms. Long enough that sweeping across never flashes one.
		 */
		delayDuration?: number;
		/**
		 * How long the group stays warm after a tooltip closes, in ms. Within it,
		 * the next trigger's tooltip opens at once and the bubble slides over.
		 */
		skipDelayDuration?: number;
		/** Which side of the triggers the bubble sits on. */
		side?: 'top' | 'bottom';
		/** Space between the trigger and the bubble, in pixels. */
		sideOffset?: number;
		/** The triggers, anywhere inside. */
		children?: Snippet;
		/** The wrapper element. */
		ref?: HTMLDivElement | null;
		/** Classes for the wrapper. */
		class?: string;
	};

	let {
		delayDuration = 200,
		skipDelayDuration = 300,
		side = 'top',
		sideOffset = 6,
		children,
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	/** Horizontal padding inside the pill, added to the measured label. */
	const PAD_X = 24;
	/**
	 * A reopen within this window finds the old bubble still fading out, so it
	 * slides from there instead of popping in somewhere new.
	 */
	const STILL_VISIBLE = durations.instant + 10;

	type Open = { id: string; instant: boolean } | null;
	type Shown = { id: string; dir: number };

	// The registry itself need not be reactive; each entry is, so a label that
	// changes while showing reaches the bubble.
	const anchors: Record<string, TooltipGroupEntry> = {};
	let open = $state<Open>(null);
	let shown = $state<Shown | null>(null);
	// Pointer events can outrun re-renders, so the handlers read plain copies.
	let current: Open = null;
	let shownId: string | null = null;
	let closedAt = -Infinity;
	let warm = false;
	let pending: string | null = null;
	let suppressed: string | null = null;
	let delayTimer: ReturnType<typeof setTimeout> | undefined;
	let graceTimer: ReturnType<typeof setTimeout> | undefined;

	let bubble = $state<HTMLDivElement | null>(null);
	let measure = $state<HTMLSpanElement | null>(null);

	// Position of the pill's anchor point and its width, relative to the group.
	// Not stopped between targets: a new target keeps the current velocity, so
	// a fast sweep bends the path instead of restarting it.
	const place = () => {
		if (!bubble) return;
		bubble.style.transform = `translate3d(${x.current}px, ${y.current}px, 0)`;
	};
	// A touch of give on the slide, so the bubble reads as one object carried
	// over rather than a highlight jumping between buttons.
	const x = new SpringValue(0, { preset: springPresets.smooth, onUpdate: place });
	const y = new SpringValue(0, { preset: springPresets.smooth, onUpdate: place });
	// The outline itself never overshoots: a pill that outgrows its label for a
	// moment looks like a measuring bug.
	const width = new SpringValue(0, {
		preset: springPresets.snappy,
		onUpdate: (value) => {
			if (bubble) bubble.style.width = `${value}px`;
		}
	});

	function centerOf(id: string | null) {
		const box = id ? anchors[id]?.el?.getBoundingClientRect() : null;
		return box ? box.left + box.width / 2 : null;
	}

	function setOpen(next: Open) {
		const previous = current;
		current = next;
		open = next;
		if (!next) {
			if (previous) closedAt = performance.now();
			return;
		}
		const from = centerOf(shownId);
		const to = centerOf(next.id);
		shownId = next.id;
		shown = { id: next.id, dir: from === null || to === null ? 0 : Math.sign(to - from) };
	}

	// Measures the new label and moves the bubble before paint, so the first
	// frame is already heading to the right place.
	let lastOpen: Open = null;
	$effect(() => {
		const target = open;
		void shown;
		const wasOpen = lastOpen !== null;
		lastOpen = target;
		const anchor = target ? anchors[target.id] : undefined;
		// A label edited while open re-measures, so the pill follows its text.
		void anchor?.content;
		void anchor?.shortcut;
		const el = anchor?.el;
		const box = ref?.getBoundingClientRect();
		if (!el || !box || !measure) return;
		const rect = el.getBoundingClientRect();
		const tx = rect.left + rect.width / 2 - box.left;
		const ty =
			side === 'top' ? rect.top - box.top - sideOffset : rect.bottom - box.top + sideOffset;
		const tw = measure.offsetWidth + PAD_X;
		if (!wasOpen && performance.now() - closedAt >= STILL_VISIBLE) {
			x.jump(tx);
			y.jump(ty);
			width.jump(tw);
			return;
		}
		x.set(tx);
		y.set(ty);
		width.set(tw);
	});

	$effect(() => () => {
		clearTimeout(delayTimer);
		clearTimeout(graceTimer);
		x.stop();
		y.stop();
		width.stop();
	});

	$effect(() => {
		if (!open) return;
		const id = open.id;
		const onKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') dismiss(id);
		};
		document.addEventListener('keydown', onKey);
		return () => document.removeEventListener('keydown', onKey);
	});

	function request(id: string, immediate: boolean) {
		if (suppressed === id) return;
		clearTimeout(delayTimer);
		clearTimeout(graceTimer);
		pending = null;
		if (warm || current) {
			// Scanning the row: no delay and no entrance. The bubble that is
			// already up slides over instead.
			setOpen({ id, instant: true });
			return;
		}
		if (immediate) {
			warm = true;
			setOpen({ id, instant: false });
			return;
		}
		pending = id;
		delayTimer = setTimeout(() => {
			pending = null;
			warm = true;
			setOpen({ id, instant: false });
		}, delayDuration);
	}

	function release(id: string) {
		if (suppressed === id) suppressed = null;
		if (pending === id) {
			clearTimeout(delayTimer);
			pending = null;
		}
		// A late leave or blur from a trigger that is no longer showing must not
		// close or cool down the one that is.
		if (current && current.id !== id) return;
		if (current) setOpen(null);
		if (!warm) return;
		clearTimeout(graceTimer);
		graceTimer = setTimeout(() => (warm = false), skipDelayDuration);
	}

	function dismiss(id: string) {
		if (pending === id) {
			clearTimeout(delayTimer);
			pending = null;
		}
		suppressed = id;
		if (current?.id === id) setOpen(null);
	}

	setTooltipGroup({
		get openId() {
			return open?.id ?? null;
		},
		register(id, entry) {
			anchors[id] = entry;
			return () => {
				if (anchors[id] === entry) delete anchors[id];
				if (current?.id === id) setOpen(null);
			};
		},
		request,
		release,
		dismiss
	});

	// The incoming label drifts in from the side the bubble travels from and
	// the outgoing one leaves the other way, so the text rides with the motion.
	function labelIn(_node: Element, { dir }: { dir: number }): TransitionConfig {
		if (prefersReducedMotion()) return { duration: durations.fast, css: (t) => `opacity: ${t}` };
		return {
			duration: durations.base,
			easing: easeOut,
			css: (t, u) => `opacity: ${t}; translate: ${u * dir * 10}px 0; filter: blur(${u * 4}px)`
		};
	}
	// Softer and quicker than the entrance: gone before the new one settles.
	function labelOut(_node: Element, { dir }: { dir: number }): TransitionConfig {
		if (prefersReducedMotion()) return { duration: durations.instant, css: (t) => `opacity: ${t}` };
		return {
			duration: durations.instant,
			easing: easeOut,
			css: (t, u) => `opacity: ${t}; translate: ${u * dir * -6}px 0; filter: blur(${u * 2}px)`
		};
	}

	const entry = $derived(shown ? anchors[shown.id] : undefined);
</script>

{#snippet label(item: TooltipGroupEntry | undefined)}
	{#if item}
		{#if typeof item.content === 'string'}{item.content}{:else}{@render item.content()}{/if}
		{#if item.shortcut}
			<kbd class="text-muted-foreground font-sans">{item.shortcut}</kbd>
		{/if}
	{/if}
{/snippet}

<div bind:this={ref} class={cn('relative w-fit max-w-full', className)} {...restProps}>
	{@render children?.()}
	<!-- Every trigger describes itself with its own hidden text, so this visual
	     copy stays out of the accessibility tree. -->
	<div
		bind:this={bubble}
		aria-hidden="true"
		data-state={open ? 'open' : 'closed'}
		data-side={side}
		class={cn(
			'pointer-events-none absolute top-0 left-0 z-50 h-7 -translate-x-1/2',
			side === 'top' ? 'origin-bottom -translate-y-full' : 'origin-top',
			'transition-[opacity,scale] ease-out motion-reduce:scale-100',
			// Arrives quickly and leaves quicker, so the exit never holds the eye.
			open
				? 'scale-100 opacity-100 duration-(--duration-fast)'
				: 'scale-[0.97] opacity-0 duration-(--duration-instant) ease-in',
			open?.instant && 'duration-0'
		)}
	>
		<div
			class="bg-popover text-popover-foreground relative size-full overflow-hidden rounded-full text-xs font-medium shadow-lg"
		>
			{#if shown}
				{#key shown.id}
					<span
						in:labelIn={{ dir: shown.dir }}
						out:labelOut={{ dir: shown.dir }}
						class="absolute inset-0 flex items-center justify-center gap-2 whitespace-nowrap"
					>
						{@render label(entry)}
					</span>
				{/key}
			{/if}
		</div>
	</div>
	<!-- Sizes the pill: the same label, laid out but never painted. -->
	<span
		bind:this={measure}
		aria-hidden="true"
		class="invisible absolute top-0 left-0 flex gap-2 text-xs font-medium whitespace-nowrap"
	>
		{@render label(entry)}
	</span>
</div>
