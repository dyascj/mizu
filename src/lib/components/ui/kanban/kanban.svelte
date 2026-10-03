<script lang="ts" generics="T extends { id: string }">
	import { untrack, type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { SpringValue, springPresets, type SpringPreset } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';
	import type { KanbanColumn } from './types.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onchange'> & {
		/** The columns in order, each with its cards in order. Cards need a stable `id`. */
		columns: KanbanColumn<T>[];
		/** Called with the new columns after every move, by pointer or keyboard. */
		onChange?: (columns: KanbanColumn<T>[]) => void;
		/** Accessible name for the board, such as "Agent tasks". */
		label: string;
		/** Names a card in announcements. Defaults to its `id`. */
		getLabel?: (card: T) => string;
		/** Renders a card's content. The board supplies the card surface. */
		children: Snippet<[T, KanbanColumn<T>]>;
		/** The board element. */
		ref?: HTMLDivElement | null;
		/** Classes for the board. */
		class?: string;
	};

	let {
		columns = $bindable(),
		onChange,
		label,
		getLabel = (card) => card.id,
		children,
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	/** Enough to read as picked up without the card outgrowing its column. */
	const LIFT_SCALE = 1.03;
	/** Pointer speed, in px per second, that reaches the full tilt, and that tilt in degrees. */
	const TILT_SPEED = 1000;
	const TILT = 2;
	/** Movement before a press becomes a drag, so a click still just focuses. */
	const DRAG_SLOP = 4;
	/** Room kept inside the board's edge for the lifted scale, so a card never widens the page. */
	const INSET = 3;

	/** One set per card that outlives remounts: a card moving columns is a new element. */
	type Values = {
		/** The slot's glide to a new place in the layout. */
		sx: SpringValue;
		sy: SpringValue;
		/** The card's offset from its slot while dragged or landing. */
		dx: SpringValue;
		dy: SpringValue;
		lift: SpringValue;
		rotate: SpringValue;
	};
	type Held = { id: string; mode: 'pointer' | 'keyboard'; before: KanbanColumn<T>[] };
	type Session = {
		id: string;
		pointerId: number;
		startX: number;
		startY: number;
		/** Where on the card it was grabbed, so it stays pinned under the pointer. */
		grabX: number;
		grabY: number;
		lastX: number;
		lastY: number;
		lastTime: number;
		vx: number;
		vy: number;
		started: boolean;
	};

	const uid = $props.id();
	const hintId = `${uid}-hint`;
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- bookkeeping for animation, never rendered
	const values = new Map<string, Values>();
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- bookkeeping for animation, never rendered
	const slots = new Map<string, HTMLElement>();
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- bookkeeping for animation, never rendered
	const buttons = new Map<string, HTMLElement>();
	const lists: (HTMLElement | null)[] = $state([]);
	let held = $state<Held | null>(null);
	let focusId = $state<string | null>(null);
	let announcement = $state('');
	let session: Session | null = null;
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- bookkeeping for animation, never rendered
	let before = new Map<string, { left: number; top: number }>();
	let blurFrame = 0;

	const allCards = $derived(columns.flatMap((column) => column.cards));
	const tabStop = $derived(
		allCards.some((card) => card.id === focusId) ? focusId : (allCards[0]?.id ?? null)
	);

	function locate(from: KanbanColumn<T>[], id: string) {
		const col = from.findIndex((column) => column.cards.some((card) => card.id === id));
		const index = col < 0 ? -1 : from[col].cards.findIndex((card) => card.id === id);
		return { col, index };
	}

	function moveCard(from: KanbanColumn<T>[], id: string, toCol: number, toIndex: number) {
		const { col, index } = locate(from, id);
		const card = from[col].cards[index];
		const next = from.map((column) => ({
			...column,
			cards: column.cards.filter((other) => other.id !== id)
		}));
		next[toCol].cards.splice(toIndex, 0, card);
		return next;
	}

	const title = (id: string, from = columns) => {
		const card = from.flatMap((column) => column.cards).find((other) => other.id === id);
		return card ? getLabel(card) : '';
	};
	function where(id: string, from = columns) {
		const { col, index } = locate(from, id);
		if (col < 0) return '';
		return `${from[col].title}, position ${index + 1} of ${from[col].cards.length}`;
	}

	function commit(next: KanbanColumn<T>[]) {
		columns = next;
		onChange?.(next);
	}

	function paint(id: string) {
		const v = values.get(id);
		const slot = slots.get(id);
		const button = buttons.get(id);
		if (!v || !slot || !button) return;
		slot.style.translate = `${v.sx.current}px ${v.sy.current}px`;
		button.style.translate = `${v.dx.current}px ${v.dy.current}px`;
		button.style.scale = String(1 + (LIFT_SCALE - 1) * v.lift.current);
		button.style.rotate = `${v.rotate.current}deg`;
		const shadow = button.firstElementChild as HTMLElement | null;
		if (shadow) shadow.style.opacity = String(Math.min(1, Math.max(0, v.lift.current)));
		// Stays above its neighbours until it has landed.
		const raised = held?.id === id || v.dx.moving || v.dy.moving || v.lift.current > 0.01;
		slot.style.zIndex = raised ? '10' : v.sx.moving || v.sy.moving ? '1' : '';
	}

	function valuesFor(id: string) {
		let v = values.get(id);
		if (!v) {
			const update = () => paint(id);
			const spring = (preset: SpringPreset = springPresets.smooth) =>
				new SpringValue(0, { preset, onUpdate: update, onRest: update });
			v = {
				sx: spring(),
				sy: spring(),
				dx: spring(),
				dy: spring(),
				lift: spring(springPresets.snappy),
				rotate: spring(springPresets.snappy)
			};
			values.set(id, v);
		}
		return v;
	}

	/**
	 * Finds every card's slot and button. Read from the DOM after each change,
	 * because a card moved to another column is a new element, made after this
	 * component's effects have run. The springs for its id carry over.
	 */
	function rescan() {
		slots.clear();
		buttons.clear();
		for (const slot of ref?.querySelectorAll<HTMLElement>('[data-kanban-slot]') ?? []) {
			const id = slot.dataset.kanbanSlot!;
			const button = slot.querySelector<HTMLElement>('[data-slot="kanban-card"]');
			slots.set(id, slot);
			if (button) buttons.set(id, button);
		}
	}

	/** A slot's resting position in board coordinates, whatever its glide is doing. */
	function home(id: string) {
		const slot = slots.get(id);
		if (!slot || !ref) return null;
		const board = ref.getBoundingClientRect();
		const rect = slot.getBoundingClientRect();
		const v = values.get(id);
		return {
			left: rect.left - board.left - (v?.sx.current ?? 0),
			top: rect.top - board.top - (v?.sy.current ?? 0),
			width: slot.offsetWidth,
			height: slot.offsetHeight
		};
	}

	// Remember where every card visibly is before the columns change...
	$effect.pre(() => {
		void columns;
		untrack(() => {
			before = new Map();
			for (const id of slots.keys()) {
				const at = home(id);
				const v = values.get(id);
				if (at && v) before.set(id, { left: at.left + v.sx.current, top: at.top + v.sy.current });
			}
		});
	});

	// ...then glide each slot from there to its new place. The card under the
	// pointer is placed by hand instead, so its slot must not also move.
	$effect(() => {
		void columns;
		untrack(() => {
			rescan();
			const ids = new Set(allCards.map((c) => c.id));
			for (const [id, v] of values) {
				if (ids.has(id)) continue;
				Object.values(v).forEach((spring: SpringValue) => spring.stop());
				values.delete(id);
			}
			for (const id of slots.keys()) {
				const was = before.get(id);
				const at = home(id);
				const v = valuesFor(id);
				paint(id);
				if (!was || !at) continue;
				if (session?.started && session.id === id) {
					v.sx.jump(0);
					v.sy.jump(0);
					continue;
				}
				const x = was.left - at.left;
				const y = was.top - at.top;
				if (Math.abs(x - v.sx.current) < 0.5 && Math.abs(y - v.sy.current) < 0.5) continue;
				v.sx.jump(x);
				v.sy.jump(y);
				v.sx.set(0);
				v.sy.set(0);
			}
			before.clear();
			if (session?.started) follow();
			// Focus rides along when a card moves to another column and remounts.
			if (held) {
				const button = buttons.get(held.id);
				if (button && document.activeElement !== button) button.focus({ preventScroll: true });
			}
		});
	});

	function lift(id: string) {
		valuesFor(id).lift.set(1, { preset: springPresets.snappy });
		paint(id);
	}

	/** Sets the card down from wherever it is, keeping the release speed. */
	function settle(id: string, vx = 0, vy = 0) {
		const v = valuesFor(id);
		v.dx.set(0, { velocity: vx / 60 });
		v.dy.set(0, { velocity: vy / 60 });
		v.rotate.set(0);
		v.lift.set(0, { preset: springPresets.snappy });
		paint(id);
	}

	/** Keeps the dragged card under the pointer, inside the board, and moves its slot to match. */
	function follow() {
		const s = session;
		if (!s?.started || !ref) return;
		const at = home(s.id);
		if (!at) return;
		const board = ref.getBoundingClientRect();
		const clamp = (value: number, min: number, max: number) =>
			Math.min(Math.max(value, min), Math.max(min, max));
		const left = clamp(s.lastX - s.grabX - board.left, INSET, board.width - at.width - INSET);
		const top = clamp(s.lastY - s.grabY - board.top, INSET, board.height - at.height - INSET);
		const v = valuesFor(s.id);
		v.dx.jump(left - at.left);
		v.dy.jump(top - at.top);

		// The column nearest the card's centre, then the place among its cards.
		const cx = left + at.width / 2 + board.left;
		const cy = top + at.height / 2 + board.top;
		let toCol = -1;
		let best = Infinity;
		lists.forEach((list, index) => {
			if (!list) return;
			const r = list.getBoundingClientRect();
			const dx = Math.max(r.left - cx, 0, cx - r.right);
			const dy = Math.max(r.top - cy, 0, cy - r.bottom);
			const distance = Math.hypot(dx, dy);
			if (distance < best) [best, toCol] = [distance, index];
		});
		if (toCol < 0) return;
		const others = columns[toCol].cards.filter((c) => c.id !== s.id);
		const centre = cy - board.top;
		// Switches place once the card's centre passes the middle of a neighbour.
		const toIndex = others.filter((c) => {
			const other = home(c.id);
			return other && other.top + other.height / 2 < centre;
		}).length;
		const from = locate(columns, s.id);
		if (from.col === toCol && from.index === toIndex) return;
		commit(moveCard(columns, s.id, toCol, toIndex));
	}

	function endDrag(cancelled: boolean) {
		const s = session;
		if (!s) return;
		listen(false);
		session = null;
		if (!s.started) return;
		const original = held?.before;
		held = null;
		// A cancelled card's slot glides back while the card settles onto it.
		if (cancelled && original) commit(original);
		settle(s.id, cancelled ? 0 : s.vx, cancelled ? 0 : s.vy);
		const list = cancelled && original ? original : columns;
		announcement = cancelled
			? `Cancelled. ${title(s.id, list)} returned to ${where(s.id, list)}.`
			: `Dropped ${title(s.id, list)} in ${where(s.id, list)}.`;
	}

	function onmove(event: PointerEvent) {
		const s = session;
		// Ignores a second finger, so switching fingers can't yank the card.
		if (!s || event.pointerId !== s.pointerId) return;
		const dt = event.timeStamp - s.lastTime;
		if (dt > 0) {
			s.vx = ((event.clientX - s.lastX) / dt) * 1000;
			s.vy = ((event.clientY - s.lastY) / dt) * 1000;
		}
		s.lastX = event.clientX;
		s.lastY = event.clientY;
		s.lastTime = event.timeStamp;
		if (!s.started) {
			if (Math.hypot(s.lastX - s.startX, s.lastY - s.startY) < DRAG_SLOP) return;
			const at = home(s.id);
			if (!at || !ref) return;
			const v = valuesFor(s.id);
			// Grabbing a card still settling picks it up from where it visibly is.
			v.dx.stop();
			v.dy.stop();
			const board = ref.getBoundingClientRect();
			s.grabX = s.startX - (board.left + at.left + v.dx.current);
			s.grabY = s.startY - (board.top + at.top + v.dy.current);
			s.started = true;
			held = { id: s.id, mode: 'pointer', before: columns };
			lift(s.id);
			announcement = `Picked up ${title(s.id)}.`;
		}
		// Tilts with the hand's sideways speed, smoothed by the spring.
		const lean = Math.max(-1, Math.min(1, s.vx / TILT_SPEED)) * TILT;
		valuesFor(s.id).rotate.set(lean);
		follow();
	}

	function onup(event: PointerEvent) {
		if (event.pointerId === session?.pointerId) endDrag(false);
	}
	function oncancel(event: PointerEvent) {
		if (event.pointerId === session?.pointerId) endDrag(true);
	}
	function onescape(event: KeyboardEvent) {
		if (event.key === 'Escape' && session?.started) {
			event.preventDefault();
			endDrag(true);
		}
	}

	function listen(on: boolean) {
		// On the window, so the drag survives the card remounting in another column.
		if (on) {
			window.addEventListener('pointermove', onmove);
			window.addEventListener('pointerup', onup);
			window.addEventListener('pointercancel', oncancel);
			window.addEventListener('keydown', onescape);
		} else {
			window.removeEventListener('pointermove', onmove);
			window.removeEventListener('pointerup', onup);
			window.removeEventListener('pointercancel', oncancel);
			window.removeEventListener('keydown', onescape);
		}
	}

	function onpointerdown(id: string, event: PointerEvent) {
		if (event.button !== 0 || session) return;
		if (held) drop();
		session = {
			id,
			pointerId: event.pointerId,
			startX: event.clientX,
			startY: event.clientY,
			grabX: 0,
			grabY: 0,
			lastX: event.clientX,
			lastY: event.clientY,
			lastTime: event.timeStamp,
			vx: 0,
			vy: 0,
			started: false
		};
		listen(true);
	}

	$effect(() => () => {
		listen(false);
		cancelAnimationFrame(blurFrame);
		for (const v of values.values()) Object.values(v).forEach((spring) => spring.stop());
	});

	// Keyboard

	function pickUp(id: string) {
		held = { id, mode: 'keyboard', before: columns };
		lift(id);
		announcement = `Picked up ${title(id)}, ${where(id)}. Arrow keys move it, Space drops it, Escape cancels.`;
	}

	function drop() {
		if (!held) return;
		const { id } = held;
		held = null;
		settle(id);
		announcement = `Dropped ${title(id)} in ${where(id)}.`;
	}

	function cancel() {
		if (!held) return;
		const { id, before: original } = held;
		held = null;
		commit(original);
		settle(id);
		announcement = `Cancelled. ${title(id, original)} returned to ${where(id, original)}.`;
	}

	function onkeydown(id: string, event: KeyboardEvent) {
		if (session?.started) return;
		const { col, index } = locate(columns, id);
		const isHeld = held?.id === id;
		const focus = (target: T | undefined) => {
			if (!target) return;
			focusId = target.id;
			buttons.get(target.id)?.focus();
		};
		// Focus moves to the nearest card in the next column that has any.
		const focusAcross = (step: number) => {
			for (let c = col + step; c >= 0 && c < columns.length; c += step) {
				const cards = columns[c].cards;
				if (cards.length) return focus(cards[Math.min(index, cards.length - 1)]);
			}
		};
		const move = (toCol: number, toIndex: number) => {
			if (toCol < 0 || toCol >= columns.length) return;
			const others = columns[toCol].cards.filter((c) => c.id !== id).length;
			const target = Math.max(0, Math.min(toIndex, others));
			if (toCol === col && target === index) return;
			const next = moveCard(columns, id, toCol, target);
			commit(next);
			announcement = `Moved to ${where(id, next)}.`;
		};
		// Columns mirror right to left, so each side arrow still moves the way it points.
		const side = getComputedStyle(event.currentTarget as Element).direction === 'rtl' ? -1 : 1;
		const keys: Record<string, (() => void) | undefined> = {
			' ': () => (isHeld ? drop() : pickUp(id)),
			Enter: () => (isHeld ? drop() : pickUp(id)),
			Escape: isHeld ? cancel : undefined,
			ArrowUp: () => (isHeld ? move(col, index - 1) : focus(columns[col].cards[index - 1])),
			ArrowDown: () => (isHeld ? move(col, index + 1) : focus(columns[col].cards[index + 1])),
			ArrowLeft: () => (isHeld ? move(col - side, index) : focusAcross(-side)),
			ArrowRight: () => (isHeld ? move(col + side, index) : focusAcross(side))
		};
		const run = keys[event.key];
		if (!run) return;
		event.preventDefault();
		if (event.repeat && (event.key === ' ' || event.key === 'Enter')) return;
		run();
	}

	/**
	 * Tabbing or clicking away sets a keyboard-held card down where it is.
	 * Checked a frame later, because a move between columns remounts the card
	 * and blurs it until it is focused again.
	 */
	function onblur(id: string) {
		cancelAnimationFrame(blurFrame);
		blurFrame = requestAnimationFrame(() => {
			if (held?.id !== id || held.mode !== 'keyboard') return;
			if (document.activeElement === buttons.get(id)) return;
			drop();
		});
	}

	// The column counts roll up when a column gains a card and down when it loses one.
	let counts = $state<{ value: number; previous: number | null; dir: number }[]>([]);
	$effect.pre(() => {
		const next = columns.map((column) => column.cards.length);
		untrack(() => {
			counts = next.map((value, i) => {
				const was = counts[i];
				if (!was) return { value, previous: null, dir: 1 };
				if (was.value === value) return was;
				return { value, previous: was.value, dir: value > was.value ? 1 : -1 };
			});
		});
	});

	const pointerDragging = $derived(held?.mode === 'pointer');
</script>

<div
	{...restProps}
	bind:this={ref}
	role="group"
	aria-label={label}
	class={cn(
		'relative grid w-full grid-cols-[repeat(auto-fit,minmax(8.5rem,1fr))] gap-3',
		pointerDragging && 'cursor-grabbing select-none [&_*]:cursor-grabbing',
		className
	)}
>
	{#each columns as column, c (column.id)}
		{@const count = counts[c]}
		<!-- Concentric with the cards: 20px = 12px card radius + 8px padding. -->
		<div class="bg-secondary flex min-w-0 flex-col rounded-xl p-2">
			<div
				aria-hidden="true"
				class="text-muted-foreground flex h-9 shrink-0 items-center justify-between px-2 text-sm font-medium"
			>
				<span class="truncate">{column.title}</span>
				<span class="relative inline-grid h-4 min-w-2 overflow-hidden text-xs tabular-nums">
					{#key count?.value}
						{#if count?.previous != null}
							<span
								class="kanban-count-out col-start-1 row-start-1 text-end leading-4"
								style:--roll="{count.dir * -8}px">{count.previous}</span
							>
						{/if}
						<span
							class={cn(
								'col-start-1 row-start-1 text-end leading-4',
								count?.previous != null && 'kanban-count-in'
							)}
							style:--roll="{(count?.dir ?? 1) * 8}px">{column.cards.length}</span
						>
					{/key}
				</span>
			</div>
			<ul
				bind:this={lists[c]}
				aria-label={column.title}
				class="flex min-h-12 flex-1 flex-col gap-2"
			>
				{#each column.cards as item (item.id)}
					{@const isHeld = held?.id === item.id}
					<li
						data-kanban-slot={item.id}
						class={cn(
							'relative shrink-0 rounded-md',
							// The drop placeholder shows through once the card leaves its slot.
							isHeld && 'bg-muted outline-border-strong outline-1 -outline-offset-1 outline-dashed'
						)}
					>
						<button
							type="button"
							data-slot="kanban-card"
							tabindex={item.id === tabStop ? 0 : -1}
							aria-describedby={hintId}
							aria-pressed={isHeld}
							class={cn(
								'bg-card text-card-foreground focus-visible:ring-ring focus-visible:ring-offset-background dark:aria-pressed:bg-popover relative flex w-full cursor-grab touch-none flex-col items-start gap-1 rounded-md px-3 py-2.5 text-start text-sm shadow-sm outline-none select-none focus-visible:ring-2 focus-visible:ring-offset-2',
								!isHeld &&
									'transition-[scale] duration-(--duration-fast) ease-out active:scale-[0.96] motion-reduce:transition-none'
							)}
							onpointerdown={(event) => onpointerdown(item.id, event)}
							onkeydown={(event) => onkeydown(item.id, event)}
							onfocus={() => (focusId = item.id)}
							onblur={() => onblur(item.id)}
						>
							<!-- The lifted shadow, faded in with the lift on its own layer. -->
							<span
								aria-hidden="true"
								class="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 shadow-lg"
							></span>
							{@render children(item, column)}
						</button>
					</li>
				{/each}
			</ul>
		</div>
	{/each}
	<p id={hintId} class="sr-only">
		Press Space to pick up. While holding, use the arrow keys to move within or between columns,
		Space to drop, or Escape to cancel.
	</p>
	<p class="sr-only" aria-live="assertive" aria-atomic="true">{announcement}</p>
</div>

<style>
	.kanban-count-in {
		animation: kanban-roll-in var(--duration-base) var(--ease-out) both;
	}

	.kanban-count-out {
		animation: kanban-roll-out var(--duration-fast) var(--ease-in) both;
	}

	@keyframes kanban-roll-in {
		from {
			opacity: 0;
			filter: blur(2px);
			translate: 0 var(--roll);
		}
	}

	@keyframes kanban-roll-out {
		to {
			opacity: 0;
			filter: blur(2px);
			translate: 0 var(--roll);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.kanban-count-in {
			animation: none;
		}

		.kanban-count-out {
			display: none;
		}
	}
</style>
