<script lang="ts">
	import ChevronsLeftRight from '@lucide/svelte/icons/chevrons-left-right';
	import { untrack, type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { duration as durations, easeOut, prefersReducedMotion } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** The original, shown left of the divider. */
		before: Snippet;
		/** The changed version, shown right of the divider. Draw it over the same box. */
		after: Snippet;
		/** How much of the before side shows, from 0 to 100. Bindable. */
		value?: number;
		/** Called with the new position whenever it changes. */
		onValueChange?: (value: number) => void;
		/** How far one arrow key moves the divider, in percent. */
		step?: number;
		/** Accessible name for the divider handle. */
		label?: string;
		/** Tag over the before side. Also used in the spoken value. */
		beforeLabel?: string;
		/** Tag over the after side. Also used in the spoken value. */
		afterLabel?: string;
		/** Shows the tags, which fade out before the divider can cover them. */
		showLabels?: boolean;
		/** The frame element. */
		ref?: HTMLDivElement | null;
		/** Classes for the frame. Give it a height here. */
		class?: string;
	};

	let {
		before,
		after,
		value = $bindable(50),
		onValueChange,
		step = 5,
		label = 'Comparison position',
		beforeLabel = 'Before',
		afterLabel = 'After',
		showLabels = true,
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	/** A touch must travel this far sideways before it counts as a drag. */
	const slop = 4;
	// Tags sit in the outer fifth of the frame. They start fading at 35%
	// visible and are gone by 20%, before the divider can reach them.
	const tagFadeStart = 35;
	const tagFadeEnd = 20;

	const clamp = (v: number) => Math.min(Math.max(v, 0), 100);
	const round = (v: number) => Math.round(v * 100) / 100;
	const tagOpacity = (visible: number) =>
		Math.min(Math.max((visible - tagFadeEnd) / (tagFadeStart - tagFadeEnd), 0), 1);

	const initial = clamp(untrack(() => value));
	/** Where the divider is drawn this frame. */
	let position = initial;
	/** Where it is heading. */
	let target = initial;
	let glideEnd = 0;
	let frame = 0;

	let afterLayer: HTMLDivElement | null = null;
	let divider: HTMLDivElement | null = null;
	let handle: HTMLDivElement | null = null;
	// State, since the tags come and go with `showLabels`.
	let beforeTag = $state<HTMLSpanElement | null>(null);
	let afterTag = $state<HTMLSpanElement | null>(null);

	// Writes straight to the DOM, so a drag never re-renders anything.
	function draw() {
		afterLayer?.style.setProperty('clip-path', `inset(0 0 0 ${round(position)}%)`);
		divider?.style.setProperty('transform', `translateX(${round(position)}%)`);
		beforeTag?.style.setProperty('opacity', `${tagOpacity(position)}`);
		afterTag?.style.setProperty('opacity', `${tagOpacity(100 - position)}`);
	}

	function animate(to: number, ms: number) {
		cancelAnimationFrame(frame);
		const from = position;
		let start: number | undefined;
		const tick = (now: number) => {
			start ??= now;
			const t = Math.min(1, (now - start) / ms);
			position = from + (to - from) * easeOut(t);
			draw();
			frame = t < 1 ? requestAnimationFrame(tick) : 0;
		};
		frame = requestAnimationFrame(tick);
	}

	function jump(to: number) {
		cancelAnimationFrame(frame);
		frame = 0;
		position = to;
		draw();
	}

	/**
	 * A click or key glides rather than teleports, so you see which way the
	 * divider went, and it is short enough never to feel like waiting.
	 * Dragging follows the hand, except during a glide, when it is retargeted
	 * to land under the pointer when the glide would have ended instead of
	 * snapping mid-flight.
	 */
	function moveTo(next: number, glide: boolean) {
		next = clamp(next);
		target = next;
		if (value !== next) {
			value = next;
			onValueChange?.(next);
		}
		if (prefersReducedMotion() || typeof requestAnimationFrame === 'undefined') return jump(next);
		const now = performance.now();
		if (glide) {
			glideEnd = now + durations.base;
			animate(next, durations.base);
			return;
		}
		const remaining = glideEnd - now;
		// A frame or less left is not worth animating.
		if (remaining > 16) animate(next, remaining);
		else jump(next);
	}

	// A new value from outside glides there like a click.
	$effect(() => {
		const next = clamp(value);
		untrack(() => {
			if (next !== target) moveTo(next, true);
		});
	});

	// Tags shown again start from where the divider is now.
	$effect(() => {
		if (beforeTag || afterTag) untrack(draw);
	});

	$effect(() => () => cancelAnimationFrame(frame));

	type Drag = { id: number; startX: number; offset: number; rect: DOMRect; active: boolean };
	let drag: Drag | null = null;
	let dragging = $state(false);

	const at = (clientX: number, d: Drag) =>
		d.rect.width ? ((clientX - d.offset - d.rect.left) / d.rect.width) * 100 : target;

	function begin(d: Drag) {
		d.active = true;
		dragging = true;
	}

	function end() {
		drag = null;
		dragging = false;
	}

	function onpointerdown(event: PointerEvent) {
		// Ignore a second finger while one is already dragging.
		if (event.button !== 0 || drag) return;
		// Skips the mouse's own focus handling so the handle can take focus,
		// and keeps text from being selected.
		event.preventDefault();
		const node = event.currentTarget as HTMLElement;
		const rect = node.getBoundingClientRect();
		const onHandle = !!handle?.contains(event.target as Node);
		const d: Drag = {
			id: event.pointerId,
			startX: event.clientX,
			// Where on the handle it was grabbed, so it doesn't jump to center
			// itself under the pointer.
			offset: onHandle ? event.clientX - (rect.left + (position / 100) * rect.width) : 0,
			rect,
			active: false
		};
		drag = d;
		node.setPointerCapture?.(event.pointerId);
		// No focus ring for a pointer press; the keyboard still gets one.
		handle?.focus({ preventScroll: true, focusVisible: false } as Parameters<
			HTMLElement['focus']
		>[0]);
		if (onHandle) {
			begin(d);
		} else if (event.pointerType !== 'touch') {
			// A mouse press is intent, so it glides at once. A touch waits to see
			// whether it is a tap, a drag, or a scroll.
			begin(d);
			moveTo(at(event.clientX, d), true);
		}
	}

	function onpointermove(event: PointerEvent) {
		const d = drag;
		if (!d || event.pointerId !== d.id) return;
		if (!d.active) {
			if (Math.abs(event.clientX - d.startX) < slop) return;
			begin(d);
			moveTo(at(event.clientX, d), true);
			return;
		}
		moveTo(at(event.clientX, d), false);
	}

	function onpointerup(event: PointerEvent) {
		const d = drag;
		if (!d || event.pointerId !== d.id) return;
		// A tap that never became a drag.
		if (!d.active) moveTo(at(event.clientX, d), true);
		end();
	}

	function onpointercancel(event: PointerEvent) {
		if (drag?.id === event.pointerId) end();
	}

	function onkeydown(event: KeyboardEvent) {
		const next = (
			{
				ArrowLeft: target - step,
				ArrowDown: target - step,
				ArrowRight: target + step,
				ArrowUp: target + step,
				PageDown: target - step * 2,
				PageUp: target + step * 2,
				Home: 0,
				End: 100
			} as Record<string, number>
		)[event.key];
		if (next === undefined) return;
		event.preventDefault();
		// Occasional, so it glides exactly like a click.
		moveTo(next, true);
	}

	const shown = $derived(Math.round(clamp(value)));
	const tag =
		'bg-popover text-muted-foreground pointer-events-none absolute top-4 rounded-full px-3 py-1 text-sm font-medium shadow-sm';
	/** Runs a handler passed by the caller first; one that calls preventDefault takes over the event. */
	function chain<E extends Event>(
		theirs: ((event: E) => unknown) | null | undefined,
		ours: (event: E) => void
	) {
		return (event: E) => {
			theirs?.(event);
			if (!event.defaultPrevented) ours(event);
		};
	}
</script>

<!-- The frame is the drag surface; the handle inside is the keyboard slider. -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	{...restProps}
	bind:this={ref}
	data-slot="compare-slider"
	data-dragging={dragging ? '' : undefined}
	class={cn(
		'group/compare bg-secondary relative h-72 w-full cursor-ew-resize touch-pan-y overflow-hidden rounded-2xl select-none',
		className
	)}
	onpointerdown={chain(restProps.onpointerdown, onpointerdown)}
	onpointermove={chain(restProps.onpointermove, onpointermove)}
	onpointerup={chain(restProps.onpointerup, onpointerup)}
	onpointercancel={chain(restProps.onpointercancel, onpointercancel)}
>
	<div aria-hidden="true" class="absolute inset-0">{@render before()}</div>
	<div
		bind:this={afterLayer}
		aria-hidden="true"
		class="absolute inset-0"
		style="clip-path: inset(0 0 0 {initial}%)"
	>
		{@render after()}
	</div>

	{#if showLabels}
		<span
			bind:this={beforeTag}
			aria-hidden="true"
			class={cn(tag, 'left-4')}
			style="opacity: {tagOpacity(initial)}">{beforeLabel}</span
		>
		<span
			bind:this={afterTag}
			aria-hidden="true"
			class={cn(tag, 'right-4')}
			style="opacity: {tagOpacity(100 - initial)}">{afterLabel}</span
		>
	{/if}

	<!-- Full width, so its translateX percentage matches the clip inset. -->
	<div
		bind:this={divider}
		class="pointer-events-none absolute inset-0"
		style="transform: translateX({initial}%)"
	>
		<div class="bg-foreground absolute inset-y-0 left-0 w-px -translate-x-1/2"></div>
		<div
			bind:this={handle}
			role="slider"
			tabindex="0"
			aria-label={label}
			aria-orientation="horizontal"
			aria-valuemin={0}
			aria-valuemax={100}
			aria-valuenow={shown}
			aria-valuetext="{shown}% {beforeLabel}, {100 - shown}% {afterLabel}"
			class="bg-popover text-popover-foreground focus-visible:ring-ring focus-visible:ring-offset-background pointer-events-auto absolute top-1/2 left-0 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full shadow-md transition-[scale] duration-(--duration-fast) ease-out outline-none group-data-dragging/compare:scale-[0.96] focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:transition-none"
			{onkeydown}
		>
			<ChevronsLeftRight class="size-5" aria-hidden="true" />
		</div>
	</div>
</div>
