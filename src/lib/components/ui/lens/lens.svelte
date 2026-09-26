<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { prefersReducedMotion, SpringValue, springPresets } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** What everyone sees. */
		children: Snippet;
		/**
		 * The layer the lens uncovers, drawn over the same box. Lay it out exactly
		 * like `children` and only add to it, so the two line up to the pixel.
		 */
		reveal: Snippet;
		/** Accessible name for the surface, such as "Flight answer". */
		label: string;
		/**
		 * Spoken to screen readers in place of the hidden layer, which they
		 * cannot see. Say what the lens reveals.
		 */
		description: string;
		/** Lens radius in pixels while it follows the pointer. */
		radius?: number;
		/** Lens radius in pixels after a click, Enter, or Space makes it larger. */
		largeRadius?: number;
		/** Whether the lens is at its larger size. Bindable. */
		large?: boolean;
		/** The surface element. */
		ref?: HTMLDivElement | null;
		/** Classes for the surface. Give it a height here. */
		class?: string;
	};

	let {
		children,
		reveal,
		label,
		description,
		radius = 72,
		largeRadius = 118,
		large = $bindable(false),
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	/** Arrow keys move the lens this far, and Shift moves it further. */
	const keyStep = 24;
	const keyStepFar = 72;
	/** A press that travels further than this was steering the lens, not a click. */
	const tapSlop = 6;

	const uid = $props.id();
	const hintId = `${uid}-hint`;

	let hidden: HTMLDivElement | null = null;
	let rim: SVGCircleElement | null = null;
	let shown = $state(false);
	let touchId: number | null = null;
	let press: [number, number] | null = null;

	// Trails the pointer by a hair: enough to feel like a physical lens with
	// weight, never enough to feel laggy. Critically damped, so it never
	// overshoots what it follows.
	const x = new SpringValue(0, { preset: springPresets.snappy, onUpdate: write });
	const y = new SpringValue(0, { preset: springPresets.snappy, onUpdate: write });
	const size = new SpringValue(0, { preset: springPresets.snappy, onUpdate: write });

	function write() {
		const round = (value: number) => String(Math.round(value * 100) / 100);
		const r = round(size.current);
		const cx = round(x.current);
		const cy = round(y.current);
		hidden?.style.setProperty('clip-path', `circle(${r}px at ${cx}px ${cy}px)`);
		rim?.setAttribute('cx', cx);
		rim?.setAttribute('cy', cy);
		rim?.setAttribute('r', r);
	}

	const restRadius = () => (large ? largeRadius : radius);

	function moveTo(px: number, py: number, instant: boolean) {
		// Jumping on entry keeps the lens from sweeping in from its last spot.
		if (instant) {
			x.jump(px);
			y.jump(py);
		} else {
			x.set(px);
			y.set(py);
		}
	}

	function show() {
		if (shown) return;
		shown = true;
		// Enters a little smaller and grows, so it arrives like a material
		// rather than a point.
		size.jump(restRadius() * 0.78);
		size.set(restRadius());
	}

	function hide() {
		if (!shown) return;
		shown = false;
		size.set(restRadius() * 0.78);
	}

	function toggleLarge() {
		large = !large;
		if (shown) size.set(restRadius());
	}

	// A new size from outside, or new radii, resize an open lens.
	$effect(() => {
		const target = large ? largeRadius : radius;
		if (shown) size.set(target);
	});

	$effect(() => () => {
		x.stop();
		y.stop();
		size.stop();
	});

	function local(event: PointerEvent) {
		const box = ref!.getBoundingClientRect();
		return [event.clientX - box.left, event.clientY - box.top] as const;
	}

	function onpointerenter(event: PointerEvent) {
		if (event.pointerType === 'touch') return;
		const [px, py] = local(event);
		moveTo(px, py, true);
		show();
	}

	function onpointermove(event: PointerEvent) {
		if (event.pointerType === 'touch' && touchId !== event.pointerId) return;
		const [px, py] = local(event);
		moveTo(px, py, false);
		show();
	}

	function onpointerleave(event: PointerEvent) {
		if (event.pointerType !== 'touch') hide();
	}

	function onpointerdown(event: PointerEvent) {
		press = [event.clientX, event.clientY];
		if (event.pointerType !== 'touch' || touchId !== null) return;
		// A finger steers the lens, so the surface keeps it until it lifts.
		touchId = event.pointerId;
		ref?.setPointerCapture?.(event.pointerId);
		const [px, py] = local(event);
		moveTo(px, py, true);
		show();
	}

	function onpointerup(event: PointerEvent) {
		if (touchId === event.pointerId) touchId = null;
	}

	function onpointercancel(event: PointerEvent) {
		if (touchId !== event.pointerId) return;
		touchId = null;
		hide();
	}

	function onclick(event: MouseEvent) {
		const start = press;
		press = null;
		if (start && Math.hypot(event.clientX - start[0], event.clientY - start[1]) > tapSlop) return;
		// Activated without a pointer over it, such as by assistive technology.
		if (!shown) openCentered();
		toggleLarge();
	}

	function onfocus(event: FocusEvent) {
		// Keyboard arrival opens the lens in the middle, so the arrows have
		// something to move. Mouse focus already has one under the pointer.
		if (shown || !(event.currentTarget as HTMLElement).matches(':focus-visible')) return;
		openCentered();
	}

	function onblur() {
		if (touchId === null) hide();
	}

	function onkeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			if (!shown) openCentered();
			toggleLarge();
			return;
		}
		if (event.key === 'Escape') {
			hide();
			return;
		}
		const delta = (
			{ ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] } as Record<
				string,
				[number, number]
			>
		)[event.key];
		if (!delta || !ref) return;
		event.preventDefault();
		if (!shown) openCentered();
		const box = ref.getBoundingClientRect();
		const step = event.shiftKey ? keyStepFar : keyStep;
		// Starts from the target, not the trailing lens, so a held key glides
		// at a steady pace instead of stalling behind it.
		const px = Math.min(Math.max(x.target + delta[0] * step, 0), box.width);
		const py = Math.min(Math.max(y.target + delta[1] * step, 0), box.height);
		moveTo(px, py, prefersReducedMotion());
	}

	/** Opens the lens in the middle of the surface. */
	function openCentered() {
		if (!ref) return;
		const box = ref.getBoundingClientRect();
		moveTo(box.width / 2, box.height / 2, true);
		show();
	}
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

<!-- A group that takes focus: the lens itself is what the arrow keys steer. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	{...restProps}
	bind:this={ref}
	role="group"
	aria-roledescription="lens"
	aria-label={label}
	aria-describedby={hintId}
	tabindex="0"
	data-slot="lens"
	data-shown={shown ? '' : undefined}
	class={cn(
		// touch-none: a finger on the surface steers the lens, so the page
		// should not scroll out from under it.
		'focus-visible:ring-ring focus-visible:ring-offset-background relative w-full touch-none overflow-hidden rounded-2xl shadow-sm outline-none select-none focus-visible:ring-2 focus-visible:ring-offset-2',
		className
	)}
	onpointerenter={chain(restProps.onpointerenter, onpointerenter)}
	onpointermove={chain(restProps.onpointermove, onpointermove)}
	onpointerleave={chain(restProps.onpointerleave, onpointerleave)}
	onpointerdown={chain(restProps.onpointerdown, onpointerdown)}
	onpointerup={chain(restProps.onpointerup, onpointerup)}
	onpointercancel={chain(restProps.onpointercancel, onpointercancel)}
	onclick={chain(restProps.onclick, onclick)}
	onfocus={chain(restProps.onfocus, onfocus)}
	onblur={chain(restProps.onblur, onblur)}
	onkeydown={chain(restProps.onkeydown, onkeydown)}
>
	<div class="absolute inset-0">{@render children()}</div>
	<!-- Leaves faster than it arrives: the exit should never hold the eye. -->
	<div
		bind:this={hidden}
		aria-hidden="true"
		class="absolute inset-0 opacity-0 transition-opacity duration-(--duration-instant) ease-in [clip-path:circle(0px_at_0px_0px)] in-data-shown:opacity-100 in-data-shown:duration-(--duration-fast) in-data-shown:ease-out"
	>
		{@render reveal()}
	</div>
	<!-- The rim sells it as glass sitting over the page, not a hole cut in it.
	     Drawn in SVG so its stroke stays 1px at every radius. -->
	<svg
		aria-hidden="true"
		class="text-foreground pointer-events-none absolute inset-0 size-full overflow-visible opacity-0 transition-opacity duration-(--duration-instant) ease-in in-data-shown:opacity-100 in-data-shown:duration-(--duration-fast) in-data-shown:ease-out"
	>
		<circle
			bind:this={rim}
			cx="0"
			cy="0"
			r="0"
			fill="none"
			stroke="currentColor"
			stroke-opacity="0.18"
			stroke-width="1"
		/>
	</svg>
	<span id={hintId} class="sr-only">
		{description} Arrow keys move the lens. Enter makes it larger.
	</span>
	<span class="sr-only" aria-live="polite">{large ? 'Large lens' : ''}</span>
</div>
