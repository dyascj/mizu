<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';
	import { DOCK_GAP, DOCK_TILE, setDockContext } from './context.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** Peak scale under the cursor, clamped to the inclusive range 1 to 3. */
		magnification?: number;
		/** Influence radius in pixels, clamped to the inclusive range 1 to 1000. */
		distance?: number;
		class?: string;
		ref?: HTMLDivElement | null;
		children?: Snippet;
	};

	let {
		magnification = 1.6,
		distance = 110,
		class: className,
		ref = $bindable(null),
		children,
		...rest
	}: Props = $props();

	// The live pointer X (viewport px) while over the dock; null when the
	// cursor leaves so every item eases back to rest.
	let pointerX = $state<number | null>(null);
	const resolvedMagnification = $derived(
		Math.min(3, Math.max(1, Number.isFinite(magnification) ? magnification : 1.6))
	);
	const resolvedDistance = $derived(
		Math.min(1000, Math.max(1, Number.isFinite(distance) ? distance : 110))
	);

	/** Hover intent before the first caption shows, in milliseconds. */
	const TOOLTIP_DELAY = 300;

	let tip = $state<string | null>(null);
	let tipInstant = $state(false);
	let tipTimer: ReturnType<typeof setTimeout> | undefined;

	function showTip(id: string, now = false) {
		clearTimeout(tipTimer);
		if (tip !== null || now) {
			// Moving along the dock swaps the caption with no delay and no
			// animation, so scanning the icons feels instant.
			tipInstant = tip !== null && tip !== id;
			tip = id;
			return;
		}
		tipTimer = setTimeout(() => {
			tipInstant = false;
			tip = id;
		}, TOOLTIP_DELAY);
	}

	function hideTip() {
		clearTimeout(tipTimer);
		tipInstant = false;
		tip = null;
	}

	$effect(() => () => clearTimeout(tipTimer));

	/** Free width beside the resting row, in px, that magnified slots may widen into. */
	let room = $state(0);

	/** How much wider the row gets at the height of the swell, wherever the pointer sits. */
	const peak = $derived.by(() => {
		const pitch = DOCK_TILE + DOCK_GAP;
		const reach = Math.ceil(resolvedDistance / pitch) + 1;
		let most = 0;
		for (const shift of [0, pitch / 2]) {
			let sum = 0;
			for (let i = -reach; i <= reach; i++) {
				const delta = Math.abs(i * pitch + shift);
				if (delta < resolvedDistance)
					sum += (Math.cos((delta / resolvedDistance) * Math.PI) + 1) / 2;
			}
			most = Math.max(most, sum);
		}
		return DOCK_TILE * (resolvedMagnification - 1) * most;
	});
	const growth = $derived(peak > 0 ? Math.min(1, room / peak) : 0);

	// Measures the room at rest: the row's width with every slot back at tile
	// size, against the space its parent offers. A row that already fills it,
	// or wraps, gets none, and its tiles magnify in place.
	$effect(() => {
		const dock = ref;
		const parent = dock?.parentElement;
		if (!dock || !parent) return;
		const measure = () => {
			const style = getComputedStyle(parent);
			const inner =
				parent.clientWidth -
				(parseFloat(style.paddingLeft) || 0) -
				(parseFloat(style.paddingRight) || 0);
			let extra = 0;
			for (const slot of dock.querySelectorAll<HTMLElement>('.mizu-dock-slot')) {
				extra += Math.max(0, slot.offsetWidth - DOCK_TILE);
			}
			room = Math.max(0, inner - (dock.offsetWidth - extra));
		};
		measure();
		if (typeof ResizeObserver === 'undefined') return;
		const observer = new ResizeObserver(measure);
		observer.observe(parent);
		observer.observe(dock);
		return () => observer.disconnect();
	});

	setDockContext({
		get pointerX() {
			return pointerX;
		},
		get magnification() {
			return resolvedMagnification;
		},
		get distance() {
			return resolvedDistance;
		},
		get growth() {
			return growth;
		},
		get tip() {
			return tip;
		},
		get tipInstant() {
			return tipInstant;
		},
		showTip,
		hideTip
	});

	function onpointermove(event: PointerEvent) {
		// Coarse pointers (touch) shouldn't trigger the lens; only fine ones hover.
		if (event.pointerType === 'touch') return;
		pointerX = event.clientX;
	}

	function onpointerleave() {
		pointerX = null;
		hideTip();
	}
</script>

<div
	bind:this={ref}
	{onpointermove}
	{onpointerleave}
	class={cn(
		'bg-popover flex max-w-full items-end gap-2 rounded-2xl px-3 pt-2 pb-2.5 shadow-xl',
		className
	)}
	{...rest}
>
	<div class="relative z-10 flex flex-wrap items-end justify-center gap-2">
		{@render children?.()}
	</div>
</div>
