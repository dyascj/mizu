<script lang="ts">
	import { untrack } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import type { TransitionConfig } from 'svelte/transition';
	import {
		duration as durations,
		easeIn,
		easeOut,
		prefersReducedMotion
	} from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';
	import Toast from './toast.svelte';
	import { toaster } from './toast-state.svelte.js';

	type Position =
		'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

	type Props = {
		/** Which corner or edge of the viewport the toasts gather in. */
		position?: Position;
		/**
		 * Keeps every toast fanned out in a list. By default they pile into a
		 * stack that fans out while you hover it or move focus into it.
		 */
		expand?: boolean;
		/** How many toasts show at once. Older ones wait, hidden, behind them. */
		visibleToasts?: number;
		/** Classes for the region. */
		class?: string;
	};

	let {
		position = 'bottom-right',
		expand = false,
		visibleToasts = 3,
		class: className
	}: Props = $props();

	/** Space between fanned-out toasts. */
	const GAP = 10;
	/** Collapsed, each toast behind sits this much further back and 5% smaller: a pile, not a wall. */
	const PEEK = 12;
	const SHRINK = 0.05;
	/** Movement below this still counts as a press on whatever is under the pointer. */
	const DRAG_START = 4;
	/** A release past this distance, or faster than this in px per ms, dismisses. */
	const DISMISS_DISTANCE = 40;
	const FLICK_VELOCITY = 0.11;
	/** How far a leaving toast drifts toward the edge it leaves by. */
	const DRIFT = 12;

	const isTop = $derived(position.startsWith('top'));
	/** Which way is back into the stack, and away from the screen edge. */
	const inward = $derived(isTop ? 1 : -1);

	let hovered = $state(false);
	let focused = $state(false);
	let list = $state<HTMLOListElement | null>(null);
	const expanded = $derived(expand || hovered || focused);

	// Newest first: index 0 is the front of the stack.
	const ordered = $derived([...toaster.toasts].reverse());
	let heights = $state<Record<number, number>>({});
	const offsets = $derived.by(() => {
		let total = 0;
		return ordered.map((toast) => {
			const offset = total;
			total += (heights[toast.id] ?? 0) + GAP;
			return offset;
		});
	});
	const frontHeight = $derived(ordered[0] ? heights[ordered[0].id] : undefined);
	const shown = $derived(Math.min(ordered.length, visibleToasts));
	/** Grows with the fanned-out stack, so moving between toasts never leaves the hover area. */
	const listHeight = $derived(
		expanded && shown > 0
			? offsets[shown - 1] + (heights[ordered[shown - 1].id] ?? 0)
			: (frontHeight ?? 0)
	);

	// Heights of toasts that have gone are no longer needed.
	$effect(() => {
		const live = new Set(toaster.toasts.map((toast) => toast.id));
		for (const id of Object.keys(untrack(() => heights))) {
			if (!live.has(Number(id))) delete heights[Number(id)];
		}
	});

	// Timers hold while you read the stack or look at another tab, so a toast
	// never disappears unseen.
	$effect(() => {
		toaster.hold('hover', hovered);
		toaster.hold('focus', focused);
	});
	$effect(() => () => {
		toaster.hold('hover', false);
		toaster.hold('focus', false);
		toaster.hold('hidden', false);
	});
	$effect(() => {
		const sync = () => toaster.hold('hidden', document.hidden);
		sync();
		document.addEventListener('visibilitychange', sync);
		return () => document.removeEventListener('visibilitychange', sync);
	});

	// Ctrl or Cmd+Z takes back the newest undo toast, unless a text field wants
	// the shortcut for its own undo.
	const undoable = $derived(ordered.find((toast) => toast.undo));
	$effect(() => {
		if (!undoable) return;
		const id = undoable.id;
		const onKey = (event: KeyboardEvent) => {
			if (event.key.toLowerCase() !== 'z' || !(event.metaKey || event.ctrlKey)) return;
			if (event.shiftKey || event.altKey || editable(event.target)) return;
			event.preventDefault();
			toaster.undo(id);
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});

	function editable(target: EventTarget | null) {
		return (
			target instanceof HTMLElement &&
			(target.isContentEditable || target.closest('input, textarea, select') !== null)
		);
	}

	/**
	 * Swipe to dismiss. Commits to one axis after a few pixels, so a slightly
	 * diagonal swipe never wobbles. Sideways works both ways; along the stack
	 * only toward the screen edge, and pulling the other way gives just a little.
	 */
	function swipe(id: number): Attachment<HTMLElement> {
		return (node) => {
			let drag: {
				pointer: number;
				x: number;
				y: number;
				time: number;
				axis: 'x' | 'y' | null;
				distance: number;
			} | null = null;
			let dragged = false;

			const down = (event: PointerEvent) => {
				if (drag || (event.pointerType === 'mouse' && event.button !== 0)) return;
				dragged = false;
				drag = {
					pointer: event.pointerId,
					x: event.clientX,
					y: event.clientY,
					time: performance.now(),
					axis: null,
					distance: 0
				};
			};
			const move = (event: PointerEvent) => {
				if (!drag || event.pointerId !== drag.pointer) return;
				const dx = event.clientX - drag.x;
				const dy = event.clientY - drag.y;
				if (!drag.axis) {
					if (Math.hypot(dx, dy) < DRAG_START) return;
					drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
					dragged = true;
					node.setPointerCapture?.(event.pointerId);
					node.dataset.dragging = '';
				}
				if (drag.axis === 'x') {
					drag.distance = dx;
					node.style.translate = `${dx}px 0`;
				} else {
					const away = -dy * inward;
					drag.distance = away < 0 ? -Math.sqrt(-away) : away;
					node.style.translate = `0 ${-drag.distance * inward}px`;
				}
			};
			const end = (event: PointerEvent) => {
				if (!drag || event.pointerId !== drag.pointer) return;
				const { axis, distance, time } = drag;
				drag = null;
				delete node.dataset.dragging;
				if (!axis) return;
				const reach = axis === 'x' ? Math.abs(distance) : distance;
				const velocity = reach / (performance.now() - time);
				if (event.type === 'pointerup' && (reach > DISMISS_DISTANCE || velocity > FLICK_VELOCITY)) {
					node.dataset.swipe = axis === 'x' ? String(Math.sign(distance)) : 'edge';
					toaster.dismiss(id);
				} else {
					node.style.translate = '';
				}
			};
			// A drag that began on a button shouldn't also press it.
			const click = (event: MouseEvent) => {
				if (!dragged) return;
				dragged = false;
				event.preventDefault();
				event.stopPropagation();
			};

			node.addEventListener('pointerdown', down);
			node.addEventListener('pointermove', move);
			node.addEventListener('pointerup', end);
			node.addEventListener('pointercancel', end);
			node.addEventListener('click', click, true);
			return () => {
				node.removeEventListener('pointerdown', down);
				node.removeEventListener('pointermove', move);
				node.removeEventListener('pointerup', end);
				node.removeEventListener('pointercancel', end);
				node.removeEventListener('click', click, true);
			};
		};
	}

	/**
	 * A toast that closes with focus inside passes it to the next toast still
	 * showing, or lets it go once none is left. Firefox and Safari fire no
	 * focusout when a focused element is removed, so without this the stack
	 * would think focus never left and hold every later timer.
	 */
	function handOffFocus(node: HTMLElement) {
		const active = document.activeElement;
		if (!(active instanceof HTMLElement) || !node.contains(active)) return;
		// After this update settles, so the remaining toasts carry their new order.
		queueMicrotask(() => {
			if (!node.contains(document.activeElement)) return;
			const next = [...(list?.children ?? [])].find(
				(item): item is HTMLElement =>
					item instanceof HTMLElement &&
					item !== node &&
					!('leaving' in item.dataset) &&
					Number(item.dataset.index) < visibleToasts
			);
			const target = next?.querySelector<HTMLElement>('[role="status"], [role="alert"]');
			if (target) target.focus({ preventScroll: true });
			else active.blur();
		});
	}

	/**
	 * Leaving is quicker and softer than arriving, and only the leaver blurs. It
	 * keeps the slot it left from while the rest close the gap. A thrown toast
	 * carries on the way it was going, easing out of the momentum it already has.
	 */
	function leave(node: HTMLElement): TransitionConfig {
		node.style.pointerEvents = 'none';
		node.dataset.leaving = '';
		handOffFocus(node);
		if (prefersReducedMotion()) return { duration: durations.fast, css: (t) => `opacity: ${t}` };
		const [x0 = 0, y0 = 0] = (node.style.translate || '0 0')
			.split(' ')
			.map((part) => parseFloat(part) || 0);
		const thrown = node.dataset.swipe;
		const x1 = thrown === '1' || thrown === '-1' ? Number(thrown) * node.offsetWidth : x0;
		const y1 = y0 - DRIFT * inward;
		return {
			duration: durations.base,
			easing: thrown ? easeOut : easeIn,
			css: (t, u) =>
				`opacity: ${t}; filter: blur(${u * 4}px); translate: ${x0 + (x1 - x0) * u}px ${y0 + (y1 - y0) * u}px`
		};
	}

	const regionClass = $derived(
		cn(
			'pointer-events-none fixed z-[100] w-[calc(100%-2rem)] max-w-sm p-0',
			isTop ? 'top-4' : 'bottom-4',
			position.endsWith('left') && 'left-4',
			position.endsWith('right') && 'right-4',
			position.endsWith('center') && 'left-1/2 -translate-x-1/2',
			className
		)
	);
</script>

<div class={regionClass} role="region" aria-label="Notifications" tabindex="-1">
	<ol
		bind:this={list}
		class="pointer-events-auto relative m-0 list-none p-0"
		style:height="{listHeight}px"
		onpointerenter={(event) => {
			if (event.pointerType !== 'touch') hovered = true;
		}}
		onpointerleave={() => (hovered = false)}
		onfocusin={() => (focused = true)}
		onfocusout={(event) => {
			focused =
				event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget);
		}}
	>
		{#each ordered as toast, index (toast.id)}
			<!-- Tucked toasts sit out of reach until the stack fans out; focus on the
			     front toast fans it out, so the keyboard reaches every one in turn. -->
			{@const tucked = !expanded && index > 0}
			<li
				{@attach swipe(toast.id)}
				out:leave
				inert={tucked || index >= visibleToasts}
				data-index={index}
				class={cn(
					'absolute inset-x-0 touch-none select-none',
					isTop ? 'top-0' : 'bottom-0',
					// Transitions rather than keyframes, so a toast added mid-flight
					// retargets the stack instead of restarting it.
					'[transform:translateY(var(--y))_scale(var(--scale))] opacity-(--opacity)',
					'[transition:transform_var(--duration-spring)_var(--ease-spring),translate_var(--duration-spring)_var(--ease-spring),opacity_var(--duration-base)_var(--ease-out)]',
					'data-dragging:[transition-property:transform,opacity]',
					isTop
						? 'starting:[transform:translateY(-100%)] starting:opacity-0'
						: 'starting:[transform:translateY(100%)] starting:opacity-0',
					index >= visibleToasts && 'pointer-events-none'
				)}
				style:--y="{inward * (expanded ? offsets[index] : index * PEEK)}px"
				style:--scale={expanded ? 1 : 1 - index * SHRINK}
				style:--opacity={index >= visibleToasts ? 0 : 1}
				style:z-index={100 - index}
			>
				<Toast
					{toast}
					behind={tucked}
					height={tucked ? frontHeight : undefined}
					onHeight={(height) => (heights[toast.id] = height)}
				/>
			</li>
		{/each}
	</ol>
	<span class="sr-only" aria-live="polite">{toaster.announcement}</span>
</div>
