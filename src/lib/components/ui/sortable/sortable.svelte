<script lang="ts" generics="T extends { id: string }">
	import GripVertical from '@lucide/svelte/icons/grip-vertical';
	import { untrack, type Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import type { HTMLAttributes } from 'svelte/elements';
	import { SpringValue, springPresets } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** The items in their current order. Each needs a stable `id`. */
		items: T[];
		/** Called with the new order after every move, by pointer or keyboard. */
		onReorder?: (items: T[]) => void;
		/** Accessible name for the whole collection, such as "Pipeline steps". */
		label: string;
		/** Names an item in the handle label and in announcements. Defaults to its `id`. */
		getLabel?: (item: T) => string;
		/**
		 * `list` is a column of rows, each dragged by its grip handle. `grid` is
		 * a tray of square tiles, dragged by the whole tile.
		 */
		layout?: 'list' | 'grid';
		/** Tiles per row in the grid layout. */
		columns?: number;
		/** Renders an item's content: beside the handle in a row, or inside a tile. */
		children: Snippet<[T]>;
		/** The outer element. */
		ref?: HTMLDivElement | null;
		/** Classes for the outer element. */
		class?: string;
	};

	let {
		items = $bindable(),
		onReorder,
		label,
		getLabel = (item) => item.id,
		layout = 'list',
		columns = 3,
		children,
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	const grid = $derived(layout === 'grid');
	/** Scale while lifted: enough to read as picked up without outgrowing the column. */
	const liftScale = $derived(grid ? 1.05 : 1.02);
	/** The press scale shared with every other button. */
	const PRESS_SCALE = 0.96;
	/** Mouse drags start after a small move, so a sloppy click stays a click. */
	const MOUSE_THRESHOLD = 4;
	/** Touch on a tile waits for a hold, leaving quick swipes to scroll the page. */
	const LONG_PRESS = 250;
	/** A finger that moves this far before the hold completes is scrolling. */
	const TOUCH_SLOP = 8;
	/** How far past the edge an item can be pulled, in px, before it stiffens. */
	const EDGE_GIVE = 10;
	const SAMPLE_WINDOW = 100;

	type Entry = {
		node: HTMLElement;
		/** The handle or tile button, looked up when needed. */
		readonly button: HTMLElement | null;
		x: SpringValue;
		y: SpringValue;
		scale: SpringValue;
	};
	type Session = {
		id: string;
		pointerId: number;
		touch: boolean;
		startX: number;
		startY: number;
		/** Where the item visibly was when pressed, in container coordinates. */
		fromLeft: number;
		fromTop: number;
		lastX: number;
		lastY: number;
		started: boolean;
		samples: [number, number, number][];
		timer?: ReturnType<typeof setTimeout>;
	};

	const uid = $props.id();
	const hintId = `${uid}-hint`;
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- bookkeeping for animation, never rendered
	const entries = new Map<string, Entry>();
	let list = $state<HTMLUListElement | null>(null);
	let held = $state<{ id: string; before: T[] } | null>(null);
	let dragId = $state<string | null>(null);
	let focusId = $state<string | null>(null);
	let announcement = $state('');
	let session: Session | null = null;
	/** Visible positions before a reorder, keyed by id, for the slide that follows. */
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- bookkeeping for animation, never rendered
	let before = new Map<string, { left: number; top: number }>();

	const tabStop = $derived(
		items.some((item) => item.id === focusId) ? focusId : (items[0]?.id ?? null)
	);

	const name = (id: string, from = items) => {
		const item = from.find((other) => other.id === id);
		return item ? getLabel(item) : '';
	};
	function place(id: string, from = items) {
		const index = from.findIndex((item) => item.id === id);
		if (!grid) return `position ${index + 1} of ${from.length}`;
		return `row ${Math.floor(index / columns) + 1}, column ${(index % columns) + 1}`;
	}

	function paint(id: string) {
		const entry = entries.get(id);
		if (!entry) return;
		const { node, x, y, scale } = entry;
		node.style.translate = `${x.current}px ${y.current}px`;
		node.style.scale = String(scale.current);
		// Raised while lifted, and kept above its neighbours until it has landed.
		const lifted = held?.id === id || dragId === id;
		node.style.zIndex = lifted ? '2' : x.moving || y.moving ? '1' : '';
	}

	/**
	 * Registers an item's element. Its springs are made once and outlive
	 * nothing else, so a remount starts from rest.
	 */
	function entry(id: string): Attachment<HTMLElement> {
		return (node) => {
			const update = () => paint(id);
			const state: Entry = {
				node,
				get button() {
					return node.querySelector<HTMLElement>('[data-slot="sortable-handle"]');
				},
				x: new SpringValue(0, { preset: springPresets.smooth, onUpdate: update, onRest: update }),
				y: new SpringValue(0, { preset: springPresets.smooth, onUpdate: update, onRest: update }),
				scale: new SpringValue(1, { preset: springPresets.snappy, onUpdate: update })
			};
			entries.set(id, state);
			return () => {
				state.x.stop();
				state.y.stop();
				state.scale.stop();
				if (entries.get(id) === state) entries.delete(id);
			};
		};
	}

	// Remember where everything visibly is before the order changes...
	$effect.pre(() => {
		void items;
		untrack(() => {
			before = new Map();
			for (const [id, { node, x, y }] of entries) {
				before.set(id, { left: node.offsetLeft + x.current, top: node.offsetTop + y.current });
			}
		});
	});

	// ...then glide each item from there to its new slot, keeping any speed it
	// already had. The item under the pointer is re-pinned to the pointer instead.
	$effect(() => {
		void items;
		untrack(() => {
			for (const [id, { node, x, y }] of entries) {
				const was = before.get(id);
				if (!was || id === dragId) continue;
				const dx = was.left - node.offsetLeft;
				const dy = was.top - node.offsetTop;
				if (Math.abs(dx - x.current) < 0.5 && Math.abs(dy - y.current) < 0.5) continue;
				x.jump(dx);
				y.jump(dy);
				x.set(0);
				y.set(0);
			}
			before.clear();
			if (session?.started) follow();
			// A reorder can move the held item's node, which drops its focus.
			if (held) {
				const button = entries.get(held.id)?.button;
				if (button && document.activeElement !== button) button.focus({ preventScroll: true });
			}
		});
	});

	function commit(next: T[]) {
		items = next;
		onReorder?.(next);
	}

	function moveTo(id: string, target: number) {
		const from = items.findIndex((item) => item.id === id);
		const to = Math.max(0, Math.min(target, items.length - 1));
		if (from < 0 || from === to) return false;
		const next = [...items];
		next.splice(to, 0, ...next.splice(from, 1));
		commit(next);
		return true;
	}

	function lift(id: string, lifted: boolean) {
		const state = entries.get(id);
		if (!state) return;
		state.scale.set(lifted ? liftScale : 1, { preset: springPresets.snappy });
		paint(id);
	}

	// Pointer dragging

	/** Gives freely at first, then stiffens so it never passes EDGE_GIVE. */
	function resist(value: number, min: number, max: number) {
		if (value < min) return min - EDGE_GIVE * Math.tanh((min - value) / (EDGE_GIVE * 3));
		if (value > max) return max + EDGE_GIVE * Math.tanh((value - max) / (EDGE_GIVE * 3));
		return value;
	}

	/** Keeps the dragged item under the pointer and moves its slot to wherever it now sits. */
	function follow() {
		const s = session;
		const state = s && entries.get(s.id);
		if (!s?.started || !state || !list) return;
		const { node } = state;
		const maxLeft = list.clientWidth - node.offsetWidth;
		const maxTop = list.clientHeight - node.offsetHeight;
		const left = resist(s.fromLeft + s.lastX - s.startX, 0, maxLeft);
		const top = resist(s.fromTop + s.lastY - s.startY, 0, maxTop);
		state.x.jump(left - node.offsetLeft);
		state.y.jump(top - node.offsetTop);

		// The slot whose resting centre is nearest the item's centre.
		const cx = left + node.offsetWidth / 2;
		const cy = top + node.offsetHeight / 2;
		let target = -1;
		let best = Infinity;
		items.forEach((item, index) => {
			const other = entries.get(item.id)?.node;
			if (!other) return;
			const dx = grid ? other.offsetLeft + other.offsetWidth / 2 - cx : 0;
			const dy = other.offsetTop + other.offsetHeight / 2 - cy;
			const distance = Math.hypot(dx, dy);
			if (distance < best) [best, target] = [distance, index];
		});
		if (target >= 0) moveTo(s.id, target);
	}

	function begin() {
		const s = session;
		const state = s && entries.get(s.id);
		if (!s || !state) return;
		s.started = true;
		clearTimeout(s.timer);
		dragId = s.id;
		if (held) drop();
		if (s.touch) navigator.vibrate?.(8);
		lift(s.id, true);
		announcement = `Picked up ${name(s.id)}.`;
		follow();
	}

	function onmove(event: PointerEvent) {
		const s = session;
		if (!s || event.pointerId !== s.pointerId) return;
		s.lastX = event.clientX;
		s.lastY = event.clientY;
		s.samples.push([event.timeStamp, event.clientX, event.clientY]);
		if (s.samples.length > 8) s.samples.shift();
		if (s.started) {
			follow();
			return;
		}
		const moved = Math.hypot(s.lastX - s.startX, s.lastY - s.startY);
		// A tile held by touch must wait for the long press; moving first means scrolling.
		if (s.touch && grid) {
			if (moved > TOUCH_SLOP) finish(false);
		} else if (moved > MOUSE_THRESHOLD) {
			begin();
		}
	}

	function onup(event: PointerEvent) {
		if (event.pointerId === session?.pointerId) finish(true, event.timeStamp);
	}
	function oncancel(event: PointerEvent) {
		if (event.pointerId === session?.pointerId) finish(false);
	}

	function listen(on: boolean) {
		// On the window rather than captured, so the drag survives its node moving in the list.
		if (on) {
			window.addEventListener('pointermove', onmove);
			window.addEventListener('pointerup', onup);
			window.addEventListener('pointercancel', oncancel);
		} else {
			window.removeEventListener('pointermove', onmove);
			window.removeEventListener('pointerup', onup);
			window.removeEventListener('pointercancel', oncancel);
		}
	}

	function finish(dropped: boolean, now = 0) {
		const s = session;
		if (!s) return;
		clearTimeout(s.timer);
		listen(false);
		session = null;
		const state = entries.get(s.id);
		if (!state) return;
		if (!s.started) {
			state.scale.set(1, { preset: springPresets.snappy });
			return;
		}
		// Keeps the hand's speed, so a flick carries into the landing.
		const recent = s.samples.filter(([time]) => now - time <= SAMPLE_WINDOW);
		let vx = 0;
		let vy = 0;
		if (dropped && recent.length > 1) {
			const [t0, x0, y0] = recent[0];
			const [t1, x1, y1] = recent[recent.length - 1];
			if (t1 > t0) [vx, vy] = [((x1 - x0) / (t1 - t0)) * 1000, ((y1 - y0) / (t1 - t0)) * 1000];
		}
		dragId = null;
		state.x.set(0, { velocity: vx / 60 });
		state.y.set(0, { velocity: vy / 60 });
		lift(s.id, false);
		announcement = `Dropped ${name(s.id)} at ${place(s.id)}.`;
	}

	function onpointerdown(id: string, event: PointerEvent) {
		if (event.button !== 0 || !event.isPrimary || session) return;
		const state = entries.get(id);
		if (!state) return;
		const touch = event.pointerType === 'touch';
		// A row's handle never scrolls, so it keeps the press from selecting text or taking focus.
		if (!grid) event.preventDefault();
		// Grabbing an item still settling picks it up from where it visibly is.
		state.x.stop();
		state.y.stop();
		session = {
			id,
			pointerId: event.pointerId,
			touch,
			startX: event.clientX,
			startY: event.clientY,
			fromLeft: state.node.offsetLeft + state.x.current,
			fromTop: state.node.offsetTop + state.y.current,
			lastX: event.clientX,
			lastY: event.clientY,
			started: false,
			samples: [[event.timeStamp, event.clientX, event.clientY]]
		};
		if (grid) state.scale.set(PRESS_SCALE, { preset: springPresets.snappy });
		if (touch && grid) session.timer = setTimeout(begin, LONG_PRESS);
		listen(true);
	}

	// Once a hold turns into a drag, the page must stop scrolling. Only a
	// non-passive listener can cancel a touchmove.
	$effect(() => {
		const node = list;
		if (!node) return;
		const block = (event: TouchEvent) => {
			if (session?.started && event.cancelable) event.preventDefault();
		};
		node.addEventListener('touchmove', block, { passive: false });
		return () => node.removeEventListener('touchmove', block);
	});

	$effect(() => () => {
		if (session) clearTimeout(session.timer);
		listen(false);
	});

	// Keyboard

	function pickUp(id: string) {
		held = { id, before: items };
		lift(id, true);
		announcement = `Picked up ${name(id)}, ${place(id)}. Arrow keys move it, Space drops it, Escape cancels.`;
	}

	function drop() {
		if (!held) return;
		const { id } = held;
		held = null;
		lift(id, false);
		announcement = `Dropped ${name(id)} at ${place(id)}.`;
	}

	function cancel() {
		if (!held) return;
		const { id, before: original } = held;
		held = null;
		commit(original);
		lift(id, false);
		announcement = `Cancelled. ${name(id, original)} is back at ${place(id, original)}.`;
	}

	function focusItem(index: number) {
		const item = items[index];
		if (!item) return;
		focusId = item.id;
		entries.get(item.id)?.button?.focus();
	}

	function onkeydown(id: string, event: KeyboardEvent) {
		if (session?.started) return;
		const index = items.findIndex((item) => item.id === id);
		const isHeld = held?.id === id;
		const step: Record<string, number> = grid
			? { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -columns, ArrowDown: columns }
			: { ArrowUp: -1, ArrowDown: 1 };

		if (event.key === ' ' || event.key === 'Enter') {
			event.preventDefault();
			if (event.repeat) return;
			if (isHeld) drop();
			else pickUp(id);
			return;
		}
		if (event.key === 'Escape' && isHeld) {
			event.preventDefault();
			cancel();
			return;
		}
		let target: number | undefined;
		if (event.key in step) target = index + step[event.key];
		else if (event.key === 'Home') target = 0;
		else if (event.key === 'End') target = items.length - 1;
		if (target === undefined) return;
		event.preventDefault();
		// Stops at the edges instead of wrapping into another row or column.
		if (target < 0 || target >= items.length) return;
		if (isHeld) {
			if (moveTo(id, target)) announcement = `Moved ${name(id)} to ${place(id)}.`;
		} else {
			focusItem(target);
		}
	}

	/**
	 * Tabbing or clicking away sets a held item down where it is. Checked a
	 * frame later, because a reorder can blur the item for a moment before it
	 * is focused again.
	 */
	function onblur(id: string) {
		requestAnimationFrame(() => {
			if (held?.id !== id) return;
			if (document.activeElement === entries.get(id)?.button) return;
			drop();
		});
	}

	const focusRing =
		'focus-visible:ring-ring focus-visible:ring-offset-background outline-none focus-visible:ring-2 focus-visible:ring-offset-2';
</script>

<div
	{...restProps}
	bind:this={ref}
	class={cn(
		// Concentric with the tiles: the tray's radius is the tile's plus its padding.
		grid && 'bg-secondary rounded-[2.25rem] p-3',
		dragId && 'cursor-grabbing select-none [&_*]:cursor-grabbing',
		className
	)}
>
	<ul
		bind:this={list}
		aria-label={label}
		class={cn('relative', grid ? 'grid gap-3' : 'flex flex-col gap-3')}
		style:grid-template-columns={grid ? `repeat(${columns}, minmax(0, 1fr))` : undefined}
	>
		{#each items as item (item.id)}
			{@const lifted = held?.id === item.id || dragId === item.id}
			{@const tabbable = item.id === tabStop}
			<li
				{@attach entry(item.id)}
				data-lifted={lifted || undefined}
				class={cn(
					'bg-card text-card-foreground group dark:data-lifted:bg-popover relative rounded-2xl shadow-sm transition-[background-color] duration-(--duration-fast) ease-out',
					grid ? 'aspect-square' : 'flex items-center gap-3 p-1.5 pr-4'
				)}
			>
				<!-- The lifted shadow fades on its own layer, which is cheap to animate. -->
				<span
					aria-hidden="true"
					class="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 shadow-lg transition-opacity duration-(--duration-base) ease-out group-data-lifted:opacity-100"
				></span>
				{#if grid}
					<button
						type="button"
						data-slot="sortable-handle"
						tabindex={tabbable ? 0 : -1}
						aria-label="{getLabel(item)}, {place(item.id)}"
						aria-describedby={hintId}
						aria-pressed={held?.id === item.id}
						class={cn(
							'relative flex size-full touch-manipulation flex-col items-center justify-center gap-2 rounded-[inherit] text-sm select-none [-webkit-touch-callout:none]',
							lifted ? 'cursor-grabbing' : 'cursor-grab',
							focusRing
						)}
						onpointerdown={(event) => onpointerdown(item.id, event)}
						oncontextmenu={(event) => event.preventDefault()}
						onkeydown={(event) => onkeydown(item.id, event)}
						onfocus={() => (focusId = item.id)}
						onblur={() => onblur(item.id)}
					>
						{@render children(item)}
					</button>
				{:else}
					<!-- The 6px row padding around a round 40px handle keeps the corners concentric. -->
					<button
						type="button"
						data-slot="sortable-handle"
						tabindex={tabbable ? 0 : -1}
						aria-label="Reorder {getLabel(item)}"
						aria-describedby={hintId}
						aria-pressed={held?.id === item.id}
						class={cn(
							'text-muted-foreground hover:bg-secondary hover:text-foreground relative inline-flex size-10 shrink-0 cursor-grab touch-none items-center justify-center rounded-full transition-[background-color,color] duration-(--duration-fast) ease-out select-none active:cursor-grabbing',
							lifted && 'bg-secondary text-foreground',
							focusRing
						)}
						onpointerdown={(event) => onpointerdown(item.id, event)}
						onkeydown={(event) => onkeydown(item.id, event)}
						onfocus={() => (focusId = item.id)}
						onblur={() => onblur(item.id)}
					>
						<GripVertical class="size-4" />
					</button>
					<div class="relative flex min-w-0 flex-1 items-center gap-3">
						{@render children(item)}
					</div>
				{/if}
			</li>
		{/each}
	</ul>
	<p id={hintId} class="sr-only">
		{grid ? 'Drag to reorder, or press' : 'Press'} Space to pick up. While holding, use the arrow keys
		to move, Space to drop, or Escape to cancel.
	</p>
	<p class="sr-only" aria-live="assertive" aria-atomic="true">{announcement}</p>
</div>
