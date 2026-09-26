<script lang="ts" generics="T extends { id: string }">
	import Check from '@lucide/svelte/icons/check';
	import X from '@lucide/svelte/icons/x';
	import { tick, untrack, type Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import type { HTMLAttributes } from 'svelte/elements';
	import { prefersReducedMotion, SpringValue, springPresets } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Direction = 'left' | 'right';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** The cards, front first. Each needs a stable `id`. */
		items: T[];
		/** Renders the face of one card. The deck supplies the surface. */
		children: Snippet<[T]>;
		/** Accessible name for the deck, such as "Suggested memories". */
		label: string;
		/** Names a card in announcements. Defaults to its `id`. */
		getLabel?: (item: T) => string;
		/**
		 * Called once for each card that leaves the deck. `right` accepts and
		 * `left` rejects, whether the card was flung, thrown with an arrow key,
		 * or sent by a button.
		 */
		onSwipe?: (item: T, direction: Direction) => void;
		/** Put thrown cards back at the bottom of the deck instead of removing them. */
		loop?: boolean;
		/** Name of the left button and the left arrow key's action. */
		rejectLabel?: string;
		/** Name of the right button and the right arrow key's action. */
		acceptLabel?: string;
		/** Show the reject and accept buttons under the deck. */
		buttons?: boolean;
		/** Shown in the deck's place once every card has gone. */
		empty?: Snippet;
		/** The outer element, holding the deck and its buttons. */
		ref?: HTMLDivElement | null;
		/** Classes for the deck itself. Size it here; it defaults to 16rem by 20rem. */
		class?: string;
	};

	let {
		items,
		children,
		label,
		getLabel = (item) => item.id,
		onSwipe,
		loop = false,
		rejectLabel = 'Reject',
		acceptLabel = 'Accept',
		buttons = true,
		empty,
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	/** Dragged this far, the card is committed and the deck has fully stepped forward. */
	const THROW_DISTANCE = 120;
	/** A release faster than this, in px per second, throws however short the drag. */
	const THROW_VELOCITY = 400;
	/** Far enough to clear the deck. The card has faded well before it gets there. */
	const OFFSCREEN = 360;
	/** Each card behind sits this much lower and smaller than the one in front. */
	const STEP_Y = 12;
	const STEP_SCALE = 0.05;
	const VISIBLE = 3;
	/** Velocity is read over this window, so a pause before letting go reads as still. */
	const SAMPLE_WINDOW = 100;
	/**
	 * The drop and the spin settle at half the pace of the throw. Springs
	 * drifting out of step are what make it read as a tossed object rather
	 * than one scripted path.
	 */
	const lazy = {
		stiffness: springPresets.smooth.stiffness / 4,
		damping: springPresets.smooth.damping / 2
	};

	/** The throw: the smooth spring at a slower pace, so the card is seen leaving. */
	const throwing = {
		stiffness: springPresets.smooth.stiffness / 2,
		damping: springPresets.smooth.damping / Math.SQRT2
	};

	type Flight = {
		id: number;
		item: T;
		from: number;
		direction: 1 | -1;
		/** px per second at release. */
		velocity: number;
		/** Rolled per throw, so no two cards leave the same way. */
		spin: number;
		drop: number;
	};

	type CardState = { node: HTMLElement; slot: SpringValue; index: number };

	const uid = $props.id();
	const hintId = `${uid}-hint`;

	let order = $state<string[]>([]);
	/** Cards thrown in the non-looping deck, which stay gone even if `items` still lists them. */
	let gone = $state.raw<string[]>([]);
	let flights = $state.raw<Flight[]>([]);
	let announcement = $state('');
	let flightCount = 0;
	let group = $state<HTMLDivElement | null>(null);
	let controls = $state<HTMLDivElement | null>(null);

	// Cards keep their place in the deck across `items` updates. New ones join at the back.
	const deck = $derived.by(() => {
		const byId = new Map(items.map((item) => [item.id, item]));
		const known = order.filter((id) => byId.has(id));
		const fresh = items.filter((item) => !known.includes(item.id) && !gone.includes(item.id));
		return [...known.map((id) => byId.get(id)!), ...fresh];
	});
	const shown = $derived(deck.slice(0, VISIBLE + 1));

	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- bookkeeping for animation, never rendered
	const cards = new Map<string, CardState>();
	let pointer: { id: number; start: number; origin: number; samples: [number, number][] } | null =
		null;
	/** How far the drag had pulled the deck forward when the card was thrown. */
	let handoff = 0;

	/** The top card's horizontal offset. Everything else in the deck follows it. */
	const x = new SpringValue(0, { onUpdate: paintAll });

	/** How far the deck has stepped forward, from 0 at rest to 1 at the throw distance. */
	const progress = () => Math.min(Math.abs(x.current) / THROW_DISTANCE, 1);
	/** Pivots from below, like a card held at its bottom edge. */
	const tilt = (offset: number) => Math.max(-1, Math.min(offset / 240, 1)) * 18;
	/** Solid while you decide, then fading on the way out. */
	function fade(offset: number) {
		const distance = Math.abs(offset);
		const end = OFFSCREEN * 0.8;
		if (distance <= THROW_DISTANCE) return 1;
		return Math.max(0, 1 - (distance - THROW_DISTANCE) / (end - THROW_DISTANCE));
	}

	function paint(id: string, card: CardState) {
		const top = deck[0]?.id === id;
		// Every card behind moves up as the top card is dragged away, so when it
		// leaves, the next one is already exactly in place.
		const depth = Math.max(card.slot.current - progress(), 0);
		const offset = top ? x.current : 0;
		card.node.style.transform = `translate(${offset}px, ${depth * STEP_Y}px) scale(${1 - depth * STEP_SCALE}) rotate(${top ? tilt(offset) : 0}deg)`;
		const face = card.node.firstElementChild as HTMLElement | null;
		if (face) face.style.opacity = top ? String(fade(offset)) : '';
	}

	function paintAll() {
		for (const [id, card] of cards) paint(id, card);
	}

	function card(id: string): Attachment<HTMLElement> {
		return (node) => {
			// Read once: the slot spring, not a re-run, handles later moves.
			const index = untrack(() => shown.findIndex((item) => item.id === id));
			const slot: SpringValue = new SpringValue(index, {
				preset: springPresets.smooth,
				onUpdate: () => paint(id, state)
			});
			const state: CardState = { node, index, slot };
			cards.set(id, state);
			// Untracked, so the attachment never re-runs and resets the slot spring.
			untrack(() => paint(id, state));
			return () => {
				state.slot.stop();
				if (cards.get(id) === state) cards.delete(id);
			};
		};
	}

	// Each card springs up to its new slot when the deck advances instead of
	// snapping, which matters most for throws with no drag behind them.
	$effect(() => {
		const ids = shown.map((item) => item.id);
		for (const [id, state] of cards) {
			const index = ids.indexOf(id);
			if (index < 0 || index === state.index) continue;
			const from = state.index;
			state.index = index;
			if (from >= VISIBLE && index < VISIBLE) {
				// Coming into view: start a step further back and rise into place.
				state.slot.jump(index + 1);
			} else {
				// Carry on from wherever the drag had visibly pulled it.
				state.slot.jump(state.slot.current - handoff);
			}
			state.slot.set(index);
		}
		handoff = 0;
		paintAll();
	});

	$effect(() => () => x.stop());

	function throwCard(direction: 1 | -1, velocity = 0) {
		const item = deck[0];
		if (!item) return;
		const from = x.current;
		handoff = progress();
		if (!prefersReducedMotion()) {
			flights = [
				...flights,
				{
					id: flightCount++,
					item,
					from,
					direction,
					velocity,
					spin: 8 + Math.random() * 14,
					// Mostly falls, as if gravity takes it; now and then it lifts a little.
					drop: Math.random() * 110 - 20
				}
			];
		}
		const ids = deck.map((card) => card.id);
		if (loop) {
			order = [...ids.slice(1), item.id];
		} else {
			gone = [...gone, item.id];
			order = ids.slice(1);
		}
		pointer = null;
		x.jump(0);

		// The buttons disable once the last card goes, which would drop their
		// focus on the page. It moves into the empty state, or onto the deck.
		if (deck.length === 0 && controls?.contains(document.activeElement)) {
			void tick().then(() => {
				const target =
					group?.querySelector<HTMLElement>(
						'[data-slot="swipe-deck-empty"] :is(a[href], button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"]))'
					) ?? group;
				target?.focus({ preventScroll: true });
			});
		}

		const side: Direction = direction === 1 ? 'right' : 'left';
		const verb = side === 'right' ? acceptLabel : rejectLabel;
		const name = getLabel(item).replace(/[.!?]+$/, '');
		announcement = loop ? `${verb}: ${name}.` : `${verb}: ${name}. ${deck.length} left.`;
		onSwipe?.(item, side);
	}

	function flight(entry: Flight): Attachment<HTMLElement> {
		return (node) => {
			const paintFlight = () => {
				node.style.transform = `translate(${fx.current}px, ${fy.current}px) rotate(${spin.current}deg)`;
				const face = node.firstElementChild as HTMLElement | null;
				if (face) face.style.opacity = String(fade(fx.current));
			};
			const land = () => (flights = flights.filter((other) => other.id !== entry.id));
			const fx = new SpringValue(entry.from, {
				preset: throwing,
				onUpdate: paintFlight,
				// Gone once it has faded out sideways; the lazier springs needn't finish.
				onRest: land,
				precision: 1
			});
			const fy = new SpringValue(0, { preset: lazy, onUpdate: paintFlight });
			// Starts from exactly the tilt it had when released, then spins on.
			const spin = new SpringValue(tilt(entry.from), { preset: lazy, onUpdate: paintFlight });
			paintFlight();
			// The throw starts at the hand's release speed instead of from rest.
			fx.set(entry.direction * OFFSCREEN, { velocity: entry.velocity / 60 });
			fy.set(entry.drop);
			spin.set(spin.current + entry.direction * entry.spin);
			return () => [fx, fy, spin].forEach((spring) => spring.stop());
		};
	}

	function onpointerdown(event: PointerEvent & { currentTarget: HTMLElement }) {
		if (event.button !== 0 || pointer) return;
		event.currentTarget.setPointerCapture?.(event.pointerId);
		x.stop();
		pointer = {
			id: event.pointerId,
			start: event.clientX,
			origin: x.current,
			samples: [[event.timeStamp, x.current]]
		};
	}

	function onpointermove(event: PointerEvent) {
		if (event.pointerId !== pointer?.id) return;
		const offset = pointer.origin + event.clientX - pointer.start;
		pointer.samples.push([event.timeStamp, offset]);
		if (pointer.samples.length > 8) pointer.samples.shift();
		x.jump(offset);
	}

	/** Release speed in px per second, from the moves in the last moment of the drag. */
	function releaseVelocity(samples: [number, number][], now: number) {
		const recent = samples.filter(([time]) => now - time <= SAMPLE_WINDOW);
		if (recent.length < 2) return 0;
		const [t0, x0] = recent[0];
		const [t1, x1] = recent[recent.length - 1];
		return t1 > t0 ? ((x1 - x0) / (t1 - t0)) * 1000 : 0;
	}

	function onpointerup(event: PointerEvent) {
		if (event.pointerId !== pointer?.id) return;
		const velocity = releaseVelocity(pointer.samples, event.timeStamp);
		pointer = null;
		const offset = x.current;
		if (Math.abs(offset) > THROW_DISTANCE || Math.abs(velocity) > THROW_VELOCITY) {
			throwCard((Math.abs(offset) > THROW_DISTANCE ? offset : velocity) < 0 ? -1 : 1, velocity);
		} else {
			// Snaps back with the hand's speed, a touch lively, like a card let go.
			x.set(0, { preset: springPresets.bouncy, velocity: velocity / 60 });
		}
	}

	function onpointercancel(event: PointerEvent) {
		if (event.pointerId !== pointer?.id) return;
		pointer = null;
		x.set(0, { preset: springPresets.bouncy });
	}

	function onkeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowLeft') throwCard(-1);
		else if (event.key === 'ArrowRight') throwCard(1);
		else return;
		event.preventDefault();
	}

	const buttonClass =
		'bg-card text-foreground focus-visible:ring-ring focus-visible:ring-offset-background inline-flex size-11 items-center justify-center rounded-full shadow-sm transition-[scale,opacity] duration-(--duration-fast) ease-out outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none [&_svg]:size-4';
</script>

{#snippet surface(item: T)}
	<div class="bg-card text-card-foreground h-full overflow-hidden rounded-2xl shadow-md">
		{@render children(item)}
	</div>
{/snippet}

<div {...restProps} bind:this={ref} class="flex flex-col items-center gap-10">
	<!-- A focusable group: the arrow keys throw the front card. -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
	<div
		bind:this={group}
		role="group"
		aria-roledescription="card deck"
		aria-label={label}
		aria-describedby={hintId}
		tabindex="0"
		class={cn(
			'focus-visible:ring-ring focus-visible:ring-offset-background relative h-80 w-64 max-w-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-offset-4',
			className
		)}
		{onkeydown}
	>
		{#each shown as item, index (item.id)}
			<!-- Fades in as it moves up into view, but leaves instantly: a card
			     looping to the back would otherwise peek out below the deck. -->
			<article
				{@attach card(item.id)}
				aria-hidden={index > 0}
				inert={index > 0}
				data-hidden={index >= VISIBLE}
				style:z-index={100 - index}
				class={cn(
					'absolute inset-0 origin-bottom touch-pan-y transition-[opacity] duration-(--duration-slow) ease-out select-none data-[hidden=true]:opacity-0 data-[hidden=true]:transition-none',
					index === 0 && 'cursor-grab active:cursor-grabbing'
				)}
				onpointerdown={index === 0 ? onpointerdown : undefined}
				onpointermove={index === 0 ? onpointermove : undefined}
				onpointerup={index === 0 ? onpointerup : undefined}
				onpointercancel={index === 0 ? onpointercancel : undefined}
			>
				{@render surface(item)}
			</article>
		{/each}
		{#each flights as entry (entry.id)}
			<!-- The thrown card finishes flying out as a copy, so the next card
			     can be grabbed at once instead of waiting for the throw to settle. -->
			<div
				{@attach flight(entry)}
				aria-hidden="true"
				style:z-index={200}
				class="swipe-deck-flight pointer-events-none absolute inset-0 origin-bottom"
			>
				{@render surface(entry.item)}
			</div>
		{/each}
		{#if deck.length === 0 && empty}
			<div
				data-slot="swipe-deck-empty"
				class="animate-fade-in absolute inset-0 flex items-center justify-center"
			>
				{@render empty()}
			</div>
		{/if}
	</div>
	{#if buttons}
		<div bind:this={controls} class="flex gap-3">
			<button
				type="button"
				aria-label={rejectLabel}
				class={buttonClass}
				disabled={deck.length === 0}
				onclick={() => throwCard(-1)}
			>
				<X />
			</button>
			<button
				type="button"
				aria-label={acceptLabel}
				class={buttonClass}
				disabled={deck.length === 0}
				onclick={() => throwCard(1)}
			>
				<Check />
			</button>
		</div>
	{/if}
	<span id={hintId} class="sr-only">
		Left arrow to {rejectLabel.toLowerCase()}, right arrow to {acceptLabel.toLowerCase()}.
	</span>
	<span class="sr-only" aria-live="polite">{announcement}</span>
</div>

<style>
	/* The thrown copy shrinks a little as it goes, on the house curve. */
	.swipe-deck-flight {
		animation: swipe-deck-shrink var(--duration-slow) var(--ease-out) forwards;
	}

	@keyframes swipe-deck-shrink {
		to {
			scale: 0.94;
		}
	}
</style>
