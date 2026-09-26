<script lang="ts" generics="T extends { id: string }">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** The items in display order. Each needs a stable `id`. */
		items: T[];
		/** Ids of the selected items. */
		selected?: string[];
		/** Called with the selected ids whenever the selection changes. */
		onSelectionChange?: (selected: string[]) => void;
		/** Heading shown above the items, and the listbox's accessible name. */
		label: string;
		/** Renders one item's content. The tile around it shows the selection. */
		children: Snippet<[T, { selected: boolean }]>;
		/** Extra controls in the footer, beside the count, given the selected ids. */
		actions?: Snippet<[string[]]>;
		/** Smallest tile width. Tiles flow into as many columns as fit. */
		tileWidth?: string;
		/** The outer element. */
		ref?: HTMLDivElement | null;
		/** Classes for the outer element. Set its height here; it defaults to 22.5rem. */
		class?: string;
	};

	let {
		items,
		selected = $bindable([]),
		onSelectionChange,
		label,
		children,
		actions,
		tileWidth = '6.5rem',
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	/** Movement below this is a click on empty space, not the start of a marquee. */
	const DRAG_THRESHOLD = 3;
	/**
	 * Within this distance of the top or bottom edge the list scrolls on its
	 * own, faster the closer the pointer gets, up to MAX_SCROLL px a frame.
	 */
	const SCROLL_EDGE = 40;
	const MAX_SCROLL = 14;

	type Box = { left: number; top: number; right: number; bottom: number };
	type Drag = {
		pointerId: number;
		/** Start point in content coordinates, so it stays pinned while scrolling. */
		x: number;
		y: number;
		clientX: number;
		clientY: number;
		/** What was selected before the drag, kept when Shift, Command, or Control is held. */
		base: Set<number> | null;
		active: boolean;
		boxes: Box[];
	};

	const uid = $props.id();
	const hintId = `${uid}-hint`;
	let focused = $state(0);
	// Clamped, so a shorter list still leaves an option to tab to.
	const focusIndex = $derived(Math.min(focused, Math.max(items.length - 1, 0)));
	let scroller = $state<HTMLDivElement | null>(null);
	let content = $state<HTMLDivElement | null>(null);
	let marquee = $state<HTMLDivElement | null>(null);
	let listbox = $state<HTMLDivElement | null>(null);
	let anchor: number | null = null;
	let lastPointer = 'mouse';
	let drag: Drag | null = null;
	let frame = 0;

	/** The option elements, in item order. */
	const tiles = () => [...(listbox?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])];

	const chosen = $derived(new Set(selected));
	const indices = $derived(
		new Set(items.flatMap((item, index) => (chosen.has(item.id) ? [index] : [])))
	);
	const count = $derived(indices.size);

	$effect(() => () => cancelAnimationFrame(frame));

	function commit(next: Set<number>) {
		// Marquee moves fire constantly; only update when membership changes.
		if (next.size === indices.size && [...next].every((i) => indices.has(i))) return;
		selected = items.filter((_, index) => next.has(index)).map((item) => item.id);
		onSelectionChange?.(selected);
	}

	function range(from: number, to: number) {
		const low = Math.min(from, to);
		return new Set(Array.from({ length: Math.abs(to - from) + 1 }, (_, i) => low + i));
	}

	/** The selection with one index flipped. */
	const toggled = (set: Set<number>, index: number) =>
		new Set(set.has(index) ? [...set].filter((i) => i !== index) : [...set, index]);

	function focusTile(index: number) {
		focused = index;
		const tile = tiles()[index];
		tile?.focus({ preventScroll: true });
		tile?.scrollIntoView?.({ block: 'nearest' });
	}

	/** Tiles flow into however many columns fit, so count them from the layout. */
	function columns() {
		const all = tiles();
		const top = all[0]?.offsetTop;
		return Math.max(1, all.filter((tile) => tile.offsetTop === top).length);
	}

	function paintMarquee() {
		const d = drag;
		if (!d || !content || !marquee) return;
		const box = content.getBoundingClientRect();
		// Clamped to the content, so the marquee never widens the scroll area.
		const x = Math.min(Math.max(d.clientX - box.left, 0), content.offsetWidth);
		const y = Math.min(Math.max(d.clientY - box.top, 0), content.offsetHeight);
		const left = Math.min(d.x, x);
		const top = Math.min(d.y, y);
		const right = Math.max(d.x, x);
		const bottom = Math.max(d.y, y);
		marquee.style.translate = `${left}px ${top}px`;
		marquee.style.width = `${right - left}px`;
		marquee.style.height = `${bottom - top}px`;

		const hits = d.boxes.flatMap((b, i) =>
			b.left < right && b.right > left && b.top < bottom && b.bottom > top ? [i] : []
		);
		commit(new Set([...(d.base ?? []), ...hits]));
	}

	function autoscroll() {
		const d = drag;
		if (!d?.active || !scroller) return;
		const box = scroller.getBoundingClientRect();
		const fromTop = d.clientY - box.top;
		const fromBottom = box.bottom - d.clientY;
		let speed = 0;
		if (fromTop < SCROLL_EDGE) speed = -MAX_SCROLL * (1 - Math.max(fromTop, 0) / SCROLL_EDGE);
		else if (fromBottom < SCROLL_EDGE)
			speed = MAX_SCROLL * (1 - Math.max(fromBottom, 0) / SCROLL_EDGE);
		if (speed) {
			const before = scroller.scrollTop;
			scroller.scrollTop += speed;
			if (scroller.scrollTop !== before) paintMarquee();
		}
		frame = requestAnimationFrame(autoscroll);
	}

	function endDrag() {
		const d = drag;
		drag = null;
		cancelAnimationFrame(frame);
		if (!d?.active || !marquee) return;
		// Fades out quickly; the next drag resets it, so it never holds anything up.
		marquee.dataset.state = 'closed';
	}

	function onpointerdown(event: PointerEvent & { currentTarget: HTMLDivElement }) {
		lastPointer = event.pointerType;
		if (event.button !== 0 || drag) return;
		// Touch keeps native scrolling; tapping tiles toggles them instead.
		if (event.pointerType === 'touch') return;
		if ((event.target as Element).closest('[role=option]')) return;
		// Stops text selection and keeps focus in the list for its shortcuts.
		event.preventDefault();
		listbox?.focus({ preventScroll: true });
		event.currentTarget.setPointerCapture?.(event.pointerId);
		const box = event.currentTarget.getBoundingClientRect();
		const additive = event.shiftKey || event.metaKey || event.ctrlKey;
		drag = {
			pointerId: event.pointerId,
			x: event.clientX - box.left,
			y: event.clientY - box.top,
			clientX: event.clientX,
			clientY: event.clientY,
			base: additive ? new Set(indices) : null,
			active: false,
			// Measured once per drag; positions inside the content never change.
			boxes: tiles().map((tile) => ({
				left: tile.offsetLeft,
				top: tile.offsetTop,
				right: tile.offsetLeft + tile.offsetWidth,
				bottom: tile.offsetTop + tile.offsetHeight
			}))
		};
	}

	function onpointermove(event: PointerEvent & { currentTarget: HTMLDivElement }) {
		const d = drag;
		if (!d || event.pointerId !== d.pointerId) return;
		d.clientX = event.clientX;
		d.clientY = event.clientY;
		if (!d.active) {
			const box = event.currentTarget.getBoundingClientRect();
			const moved = Math.hypot(event.clientX - box.left - d.x, event.clientY - box.top - d.y);
			if (moved < DRAG_THRESHOLD) return;
			d.active = true;
			// Appears at once: it is drawn by the hand, not by the interface.
			if (marquee) marquee.dataset.state = 'open';
			frame = requestAnimationFrame(autoscroll);
		}
		paintMarquee();
	}

	function onpointerup(event: PointerEvent) {
		const d = drag;
		if (!d || event.pointerId !== d.pointerId) return;
		// A plain click on empty space clears, like the desktop.
		if (!d.active && !d.base) {
			commit(new Set());
			anchor = null;
		}
		endDrag();
	}

	function onTileClick(index: number, event: MouseEvent) {
		focused = index;
		if (lastPointer !== 'touch' && event.shiftKey) {
			const span = range(anchor ?? index, index);
			commit(event.metaKey || event.ctrlKey ? new Set([...indices, ...span]) : span);
			return;
		}
		anchor = index;
		// No modifier keys on touch, so every tap toggles, like Command-click.
		if (lastPointer === 'touch' || event.metaKey || event.ctrlKey) commit(toggled(indices, index));
		else commit(new Set([index]));
	}

	function onkeydown(event: KeyboardEvent) {
		const last = items.length - 1;
		const cols = columns();
		const moves: Record<string, number> = {
			ArrowLeft: focusIndex - 1,
			ArrowRight: focusIndex + 1,
			ArrowUp: focusIndex - cols,
			ArrowDown: focusIndex + cols,
			Home: 0,
			End: last
		};
		if (event.key in moves) {
			event.preventDefault();
			const next = moves[event.key];
			if (next < 0 || next > last) return;
			if (event.shiftKey) {
				// Shift extends from the anchor, the same as Shift-clicking.
				anchor ??= focusIndex;
				commit(range(anchor, next));
			}
			focusTile(next);
			return;
		}
		if (event.key === ' ' || event.key === 'Enter') {
			event.preventDefault();
			if (event.shiftKey && anchor !== null) {
				commit(new Set([...indices, ...range(anchor, focusIndex)]));
				return;
			}
			anchor = focusIndex;
			commit(toggled(indices, focusIndex));
			return;
		}
		if (event.key.toLowerCase() === 'a' && (event.metaKey || event.ctrlKey)) {
			event.preventDefault();
			commit(range(0, last));
			return;
		}
		if (event.key === 'Escape' && indices.size > 0) {
			event.preventDefault();
			commit(new Set());
			anchor = null;
		}
	}

	function toggleAll() {
		commit(count > 0 ? new Set() : range(0, items.length - 1));
		anchor = null;
	}

	// Both labels share one grid cell, so the button never changes width.
	const swapShown =
		'opacity-100 blur-none transition-[opacity,filter] duration-(--duration-fast) ease-out';
	const swapHidden =
		'opacity-0 blur-[4px] transition-[opacity,filter] duration-(--duration-fast) ease-in motion-reduce:blur-none';
</script>

<div
	{...restProps}
	bind:this={ref}
	class={cn(
		'bg-card text-card-foreground flex h-[22.5rem] w-full flex-col overflow-hidden rounded-2xl shadow-sm select-none',
		className
	)}
>
	<div class="flex h-10 shrink-0 items-end justify-between gap-3 px-4">
		<p class="truncate text-sm font-medium">{label}</p>
		<p class="text-muted-foreground shrink-0 text-xs tabular-nums">{items.length} items</p>
	</div>

	<div bind:this={scroller} class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
		<!-- The empty space around the tiles is where a marquee starts. -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			bind:this={content}
			class="relative p-3"
			{onpointerdown}
			{onpointermove}
			{onpointerup}
			onpointercancel={endDrag}
			onlostpointercapture={endDrag}
		>
			<div
				bind:this={listbox}
				role="listbox"
				aria-label={label}
				aria-multiselectable="true"
				aria-describedby={hintId}
				tabindex="-1"
				class="grid gap-1 outline-none"
				style:grid-template-columns="repeat(auto-fill, minmax(min({tileWidth}, 100%), 1fr))"
				{onkeydown}
			>
				{#each items as item, index (item.id)}
					{@const on = indices.has(index)}
					<div
						role="option"
						aria-selected={on}
						tabindex={index === focusIndex ? 0 : -1}
						class="focus-visible:ring-ring aria-selected:bg-primary-muted flex min-w-0 cursor-default flex-col items-center gap-1.5 rounded-xl px-1 pt-2.5 pb-2 text-center transition-[scale,background-color] duration-(--duration-fast) ease-out outline-none focus-visible:ring-2 focus-visible:ring-inset active:scale-[0.96] motion-reduce:transition-[background-color]"
						onpointerdown={(event) => (lastPointer = event.pointerType)}
						onclick={(event) => onTileClick(index, event)}
						onkeydown={(event) => {
							// The listbox handles keys; this only keeps a11y lint quiet about clicks.
							if (event.key === 'Enter') event.preventDefault();
						}}
						onfocus={() => (focused = index)}
					>
						{@render children(item, { selected: on })}
					</div>
				{/each}
			</div>
			<div
				bind:this={marquee}
				aria-hidden="true"
				data-state="closed"
				class="border-primary/40 bg-primary/10 pointer-events-none absolute top-0 left-0 rounded-xs border data-[state=closed]:opacity-0 data-[state=closed]:transition-opacity data-[state=closed]:duration-(--duration-instant) data-[state=closed]:ease-in"
			></div>
		</div>
	</div>

	<div
		class="flex min-h-12 shrink-0 flex-wrap items-center justify-between gap-x-2 gap-y-1 py-2 pr-2 pl-4"
	>
		<p class="text-muted-foreground text-sm whitespace-nowrap tabular-nums" aria-live="polite">
			<span class="text-foreground">{count}</span> selected
		</p>
		<div class="flex items-center gap-1">
			<button
				type="button"
				class="text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:ring-ring grid h-8 touch-manipulation items-center rounded-full px-3 text-sm whitespace-nowrap transition-[scale,color,background-color] duration-(--duration-fast) ease-out outline-none focus-visible:ring-2 active:scale-[0.96] motion-reduce:transition-[color,background-color]"
				onclick={toggleAll}
			>
				<span
					aria-hidden={count > 0}
					class={cn('col-start-1 row-start-1', count === 0 ? swapShown : swapHidden)}
					>Select all</span
				>
				<span
					aria-hidden={count === 0}
					class={cn('col-start-1 row-start-1', count > 0 ? swapShown : swapHidden)}>Clear</span
				>
			</button>
			{@render actions?.(selected)}
		</div>
	</div>

	<p id={hintId} class="sr-only">
		Drag across items to select them. Arrow keys move, Space toggles, Shift with the arrows extends
		the selection, Control or Command A selects all, Escape clears.
	</p>
</div>
