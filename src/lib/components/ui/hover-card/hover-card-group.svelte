<script lang="ts" module>
	import { getContext, setContext, type Snippet } from 'svelte';

	/** Where a card sits relative to its trigger. */
	export type HoverCardPlace = { side: 'top' | 'bottom'; left: number; originX: number };

	export type HoverCardOpen = {
		id: string;
		place: HoverCardPlace;
		/** Skips the entrance, because a card is already showing or just closed. */
		instant: boolean;
		/** Where the previous card sat on screen; the new one travels from there. */
		from?: DOMRect;
	} | null;

	export type HoverCardGroupContext = {
		readonly open: HoverCardOpen;
		/** Registers the card on screen, so the next one knows where to start. */
		setCard: (el: HTMLElement) => void;
		requestOpen: (id: string, measure: () => HoverCardPlace, immediate?: boolean) => void;
		requestClose: (id: string) => void;
		closeNow: () => void;
		readonly width: number;
	};

	const KEY = Symbol('mizu-hover-card-group');

	export function getHoverCardGroup(): HoverCardGroupContext {
		const group = getContext<HoverCardGroupContext | undefined>(KEY);
		if (!group) throw new Error('HoverCard.GroupTrigger must be inside a HoverCard.Group');
		return group;
	}
</script>

<script lang="ts">
	type Props = {
		/**
		 * How long the pointer rests on a trigger before the first card opens, in
		 * ms. Long enough that sweeping across a paragraph opens nothing.
		 */
		openDelay?: number;
		/**
		 * How long the card waits before closing once the pointer leaves, in ms.
		 * Covers the trip from the trigger to the card.
		 */
		closeDelay?: number;
		/**
		 * Just after a card closes, another trigger within this many ms opens at
		 * once: the reader is browsing people, not passing through.
		 */
		skipDelayDuration?: number;
		/** Card width in pixels. It never grows past the viewport. */
		width?: number;
		/** The text holding the triggers. */
		children?: Snippet;
	};

	let {
		openDelay = 500,
		closeDelay = 150,
		skipDelayDuration = 300,
		width = 288,
		children
	}: Props = $props();

	let open = $state<HoverCardOpen>(null);
	let current: HoverCardOpen = null;
	let openTimer: ReturnType<typeof setTimeout> | undefined;
	let closeTimer: ReturnType<typeof setTimeout> | undefined;
	let closedAt = -Infinity;
	let card: HTMLElement | null = null;
	// Where the last card was when it closed, for a quick return trip.
	let lastRect: DOMRect | null = null;

	$effect(() => () => {
		clearTimeout(openTimer);
		clearTimeout(closeTimer);
	});

	const cardRect = () => (card?.isConnected ? card.getBoundingClientRect() : undefined);

	function commit(next: HoverCardOpen) {
		if (current && !next) {
			closedAt = performance.now();
			lastRect = cardRect() ?? null;
		}
		current = next;
		open = next;
	}

	setContext<HoverCardGroupContext>(KEY, {
		get open() {
			return open;
		},
		get width() {
			return width;
		},
		setCard(el) {
			card = el;
		},
		requestOpen(id, measure, immediate) {
			clearTimeout(closeTimer);
			if (current?.id === id) return;
			clearTimeout(openTimer);
			const recent = performance.now() - closedAt < skipDelayDuration;
			if (current) {
				// Already showing someone: no delay, and the card itself moves over.
				commit({ id, place: measure(), instant: true, from: cardRect() });
			} else if (recent && lastRect) {
				// Closed a moment ago on the way here: fly back out from there.
				commit({ id, place: measure(), instant: true, from: lastRect });
			} else if (immediate || recent) {
				commit({ id, place: measure(), instant: false });
			} else {
				openTimer = setTimeout(() => commit({ id, place: measure(), instant: false }), openDelay);
			}
		},
		requestClose(id) {
			clearTimeout(openTimer);
			if (current?.id !== id) return;
			clearTimeout(closeTimer);
			closeTimer = setTimeout(() => commit(null), closeDelay);
		},
		closeNow() {
			clearTimeout(openTimer);
			clearTimeout(closeTimer);
			if (current) commit(null);
		}
	});
</script>

{@render children?.()}
