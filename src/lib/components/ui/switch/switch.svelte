<script lang="ts">
	import { Switch as SwitchPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import { untrack } from 'svelte';
	import { prefersReducedMotion, springPresets } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = WithoutChildrenOrChild<SwitchPrimitive.RootProps> & {
		/** Classes for the track. */
		class?: string;
	};

	let {
		ref = $bindable(null),
		checked = $bindable(false),
		disabled = false,
		onCheckedChange,
		onclick,
		onpointerdown,
		onpointermove,
		onpointerup,
		onpointercancel,
		onkeydown,
		class: className,
		...restProps
	}: Props = $props();

	// The track is 44 by 24 with 2px of padding, so the 20px knob travels 20px.
	const KNOB = 20;
	const INNER = 40;
	/** How far a pressed knob leans into the move it is about to make. */
	const LEAN = 6;
	/** A landing past the end squashes the knob against the wall, at most this much. */
	const MAX_SQUASH = 4;
	/** Movement below this is still a tap, so a shaky finger never drags. */
	const DRAG_SLOP = 3;
	/** Milliseconds in one frame of the Svelte spring presets. */
	const FRAME = 1000 / 60;

	type Sim = { value: number; velocity: number; target: number };

	const start = untrack(() => (checked ? 1 : 0));
	/** 0 is off and 1 is on. The spring overshoots past either end on landing. */
	const progress: Sim = { value: start, velocity: 0, target: start };
	/** 0 at rest and 1 while pressed. */
	const stretch: Sim = { value: 0, velocity: 0, target: 0 };

	let thumb = $state<HTMLElement | null>(null);
	let fill = $state<HTMLElement | null>(null);
	let target = untrack(() => checked);
	let frame = 0;
	let last = 0;
	/** A drag ends in a click too, and that click must not toggle again. */
	let swallowClick = false;
	let swallowTimer: ReturnType<typeof setTimeout> | undefined;
	/** True while the knob or its lean is in motion, or a finger holds it. */
	let moving = false;
	let gesture: {
		pointerId: number;
		startX: number;
		startProgress: number;
		dragging: boolean;
		lastX: number;
		lastTime: number;
		velocity: number;
	} | null = null;

	const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

	/**
	 * A part's color in a state, read from a hidden copy of it so a consumer's
	 * `data-[state=checked]:bg-*` counts as much as the default.
	 */
	function stateColor(part: HTMLElement, state: 'checked' | 'unchecked') {
		const probe = document.createElement('span');
		probe.className = part.className;
		probe.dataset.state = state;
		probe.setAttribute('aria-hidden', 'true');
		probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;transition:none';
		part.after(probe);
		const color = getComputedStyle(probe).backgroundColor;
		probe.remove();
		return color;
	}

	// At rest the track shows its own state color and the fill simply inherits
	// it. In motion the track holds the off color and the fill carries the on
	// color, fading in with the knob's travel. The knob holds its on color the
	// whole way: any fade of its own would cross the fading track and vanish
	// against it for a moment, where the dark theme's on knob stands out from
	// both track colors.
	function beginMotion() {
		if (moving) return;
		moving = true;
		if (!ref || !fill) return;
		fill.style.backgroundColor = stateColor(ref, 'checked');
		ref.style.backgroundColor = stateColor(ref, 'unchecked');
		if (thumb) thumb.style.backgroundColor = stateColor(thumb, 'checked');
	}

	function endMotion() {
		if (!moving || gesture) return;
		moving = false;
		ref?.style.removeProperty('background-color');
		fill?.style.removeProperty('background-color');
		thumb?.style.removeProperty('background-color');
	}

	function knobWidth() {
		const p = progress.value;
		const over = p > 1 ? p - 1 : p < 0 ? -p : 0;
		const squash = Math.min(over * (INNER - KNOB), MAX_SQUASH);
		return KNOB + stretch.value * LEAN - squash;
	}

	// Position follows width, so widening while off grows rightward and
	// widening while on grows leftward: always into the coming move.
	function render() {
		const width = knobWidth();
		if (thumb) {
			thumb.style.width = `${width}px`;
			thumb.style.translate = `${clamp01(progress.value) * (INNER - width)}px 0`;
		}
		if (fill) fill.style.opacity = String(clamp01(progress.value));
	}

	/** Advances one spring. Returns true while it is still moving. */
	function advance(sim: Sim, preset: { stiffness: number; damping: number }, frames: number) {
		// Whole-frame steps keep the integration stable after a slow frame.
		for (let left = frames; left > 0; left -= 1) {
			const dt = Math.min(1, left);
			const force = preset.stiffness * (sim.target - sim.value) - preset.damping * sim.velocity;
			sim.velocity += force * dt;
			sim.value += sim.velocity * dt;
		}
		if (Math.abs(sim.target - sim.value) < 0.001 && Math.abs(sim.velocity) < 0.001) {
			sim.value = sim.target;
			sim.velocity = 0;
			return false;
		}
		return true;
	}

	function tick(now: number) {
		const frames = Math.min(now - last, 1000 / 30) / FRAME;
		last = now;
		const dragging = gesture?.dragging ?? false;
		// A bouncy landing sells the knob as a physical thing; the lean snaps.
		const travelling = !dragging && advance(progress, springPresets.bouncy, frames);
		const leaning = advance(stretch, springPresets.snappy, frames);
		render();
		frame = travelling || leaning ? requestAnimationFrame(tick) : 0;
		if (!frame) endMotion();
	}

	function run() {
		if (typeof requestAnimationFrame === 'undefined') return render();
		if (frame) return;
		beginMotion();
		last = performance.now();
		frame = requestAnimationFrame(tick);
	}

	function travelTo(next: boolean, velocity = progress.velocity) {
		target = next;
		progress.target = next ? 1 : 0;
		if (prefersReducedMotion()) {
			progress.value = progress.target;
			progress.velocity = 0;
			render();
			if (!frame) endMotion();
			return;
		}
		// Carries the release speed of a drag into the spring.
		progress.velocity = velocity;
		run();
	}

	function lean(on: boolean) {
		stretch.target = on && !prefersReducedMotion() ? 1 : 0;
		if (stretch.value !== stretch.target) run();
	}

	// Follows every change, whether from a tap, a key, a label, or the parent.
	$effect(() => {
		const next = checked;
		untrack(() => {
			if (next !== target) travelTo(next);
		});
	});

	$effect(() => () => {
		if (frame) cancelAnimationFrame(frame);
		clearTimeout(swallowTimer);
	});

	function commit(next: boolean, velocity: number) {
		travelTo(next, velocity);
		if (next === checked) return;
		checked = next;
		onCheckedChange?.(next);
	}

	function endGesture() {
		gesture = null;
		lean(false);
		if (!frame) endMotion();
	}

	type ButtonEvent<E extends Event> = E & { currentTarget: EventTarget & HTMLButtonElement };

	function handlePointerDown(event: ButtonEvent<PointerEvent>) {
		onpointerdown?.(event);
		if (disabled || event.button !== 0 || gesture) return;
		swallowClick = false;
		beginMotion();
		// Captured so the drag keeps following once the finger leaves the track.
		event.currentTarget.setPointerCapture?.(event.pointerId);
		gesture = {
			pointerId: event.pointerId,
			startX: event.clientX,
			startProgress: clamp01(progress.value),
			dragging: false,
			lastX: event.clientX,
			lastTime: event.timeStamp,
			velocity: 0
		};
		lean(true);
	}

	function handlePointerMove(event: ButtonEvent<PointerEvent>) {
		onpointermove?.(event);
		const g = gesture;
		if (!g || event.pointerId !== g.pointerId) return;
		const dx = event.clientX - g.startX;
		if (!g.dragging && Math.abs(dx) < DRAG_SLOP) return;
		g.dragging = true;
		// Pointer pixels map to knob pixels one to one at the knob's current width.
		const range = INNER - knobWidth();
		const next = clamp01(g.startProgress + dx / range);
		const elapsed = event.timeStamp - g.lastTime;
		if (elapsed > 0) g.velocity = ((event.clientX - g.lastX) / range / elapsed) * FRAME;
		g.lastX = event.clientX;
		g.lastTime = event.timeStamp;
		progress.value = next;
		progress.velocity = 0;
		render();
	}

	function handlePointerUp(event: ButtonEvent<PointerEvent>) {
		onpointerup?.(event);
		const g = gesture;
		if (!g || event.pointerId !== g.pointerId) return;
		if (g.dragging) {
			// The click that ends a drag is dispatched in the same task as this
			// release. A touch drag often sends none, so the flag lapses rather
			// than eat a later click on the label or from assistive technology.
			swallowClick = true;
			clearTimeout(swallowTimer);
			swallowTimer = setTimeout(() => (swallowClick = false));
			commit(progress.value > 0.5, g.velocity);
		}
		endGesture();
	}

	function handlePointerCancel(event: ButtonEvent<PointerEvent>) {
		onpointercancel?.(event);
		const g = gesture;
		if (!g || event.pointerId !== g.pointerId) return;
		if (g.dragging) travelTo(target, 0);
		endGesture();
	}

	// Taps, label clicks, and assistive technology all land here and toggle
	// through bits-ui. Keys and labels never press the knob, so they travel
	// without the lean.
	function handleClick(event: ButtonEvent<MouseEvent>) {
		onclick?.(event);
		if (!swallowClick) return;
		swallowClick = false;
		// The drag already decided; stop bits-ui from toggling a second time.
		event.preventDefault();
	}
</script>

<SwitchPrimitive.Root
	bind:ref
	bind:checked
	{disabled}
	{onCheckedChange}
	class={cn(
		'peer focus-visible:ring-ring focus-visible:ring-offset-background data-[state=checked]:bg-primary data-[state=unchecked]:bg-input relative inline-flex h-6 w-11 shrink-0 cursor-pointer touch-pan-y items-center rounded-full outline-none select-none after:absolute after:-inset-x-1 after:-inset-y-2 focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
		className
	)}
	{...restProps}
	onclick={handleClick}
	onpointerdown={handlePointerDown}
	onpointermove={handlePointerMove}
	onpointerup={handlePointerUp}
	onpointercancel={handlePointerCancel}
	onkeydown={(event) => {
		swallowClick = false;
		onkeydown?.(event);
	}}
>
	<!-- The on color fades in with the knob's travel, so a half-dragged switch
	     reads as half on. At rest it inherits the track's own color, so the
	     track's state classes, including a consumer's, are what shows. -->
	<span
		bind:this={fill}
		aria-hidden="true"
		data-slot="switch-fill"
		class="pointer-events-none absolute inset-0 rounded-full bg-inherit"
		style:opacity={start}
	></span>
	<!-- The knob's stretch is the press feedback, so the track never scales:
	     shrinking it would shift the knob under the finger mid-drag. -->
	<SwitchPrimitive.Thumb
		bind:ref={thumb}
		class="data-[state=checked]:bg-primary-foreground pointer-events-none absolute top-0.5 left-0.5 block h-5 rounded-full bg-white shadow-sm"
		style="width: {KNOB}px; translate: {start * (INNER - KNOB)}px 0"
	/>
</SwitchPrimitive.Root>
