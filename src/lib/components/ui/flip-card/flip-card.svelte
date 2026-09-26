<script lang="ts">
	import { tick, untrack, type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import {
		prefersReducedMotion,
		SpringValue,
		springPresets,
		type SpringPreset
	} from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** The face that shows first. */
		front: Snippet;
		/** The face on the other side. */
		back: Snippet;
		/** Whether the back is showing. Bindable. */
		flipped?: boolean;
		/** Called with the new side each time the card turns over. */
		onFlippedChange?: (flipped: boolean) => void;
		/** Accessible name of the front face's turn button, such as "Show specs". */
		frontLabel?: string;
		/** Accessible name of the back face's turn button. */
		backLabel?: string;
		/** How far the card leans toward the pointer, in degrees. More skews the text. */
		maxTilt?: number;
		/** The card element. */
		ref?: HTMLDivElement | null;
		/** Classes for the card. Size it here; it defaults to 18rem by 24rem. */
		class?: string;
	};

	let {
		front,
		back,
		flipped = $bindable(false),
		onFlippedChange,
		frontLabel = 'Show back',
		backLabel = 'Show front',
		maxTilt = 6,
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	/**
	 * Half a turn is a lot of travel for a physical object: under about 300ms
	 * it reads as a snap rather than a card turning over, so this spring is
	 * slower than the theme's, with a small bounce that settles like something
	 * with weight.
	 */
	const turnPreset: SpringPreset = { stiffness: 0.02, damping: 0.2 };
	/** How far the card rises toward you at the halfway point of a flip. */
	const liftScale = 0.03;

	let body: HTMLDivElement | null = null;
	let shadow: HTMLDivElement | null = null;
	let frontButton: HTMLButtonElement | null = null;
	let backButton: HTMLButtonElement | null = null;

	const startAngle = untrack(() => flipped) ? 180 : 0;
	const angle = new SpringValue(startAngle, { preset: turnPreset, onUpdate: write });
	// Pointer position across the card, -1 to 1 on each axis, followed with no
	// overshoot so the lean feels heavy.
	const pointerX = new SpringValue(0, { preset: springPresets.snappy, onUpdate: write });
	const pointerY = new SpringValue(0, { preset: springPresets.snappy, onUpdate: write });

	function write() {
		if (!body) return;
		// 0 when a face is flat to the viewer, 1 when the card is edge-on. From
		// the angle itself, so an interrupted flip lifts exactly as much as its
		// current position warrants.
		const lift = Math.abs(Math.sin((angle.current * Math.PI) / 180));
		// The half under the pointer tips toward you. The lean adds to the turn,
		// so it still follows the cursor while the back is showing.
		const tiltX = -pointerY.current * maxTilt;
		const turn = angle.current + pointerX.current * maxTilt;
		body.style.transform = `rotateX(${tiltX.toFixed(2)}deg) rotateY(${turn.toFixed(2)}deg) scale(${(1 + lift * liftScale).toFixed(4)})`;
		if (shadow) {
			// Raised higher, the shadow falls further away, spreads and darkens.
			shadow.style.transform = `translateY(${(14 + lift * 22).toFixed(2)}px) scale(${(0.92 + lift * 0.08).toFixed(4)})`;
			shadow.style.opacity = `${(0.3 + lift * 0.3).toFixed(3)}`;
		}
	}

	// Follows `flipped` from any source. The spring starts from the live angle
	// and velocity, so flipping again mid-turn reverses smoothly instead of
	// restarting. Reduced motion never turns; the faces crossfade instead.
	$effect(() => {
		const target = flipped ? 180 : 0;
		if (prefersReducedMotion()) angle.jump(0);
		else angle.set(target);
	});

	$effect(() => () => {
		angle.stop();
		pointerX.stop();
		pointerY.stop();
	});

	async function toggle() {
		flipped = !flipped;
		onFlippedChange?.(flipped);
		// The pressed face turns inert, so focus follows to the other one.
		await tick();
		(flipped ? backButton : frontButton)?.focus({ preventScroll: true });
	}

	function lean(event: PointerEvent) {
		// Touch would fight the page scroll, so leaning is for mouse and pen.
		if (event.pointerType === 'touch' || prefersReducedMotion() || !ref) return;
		const rect = ref.getBoundingClientRect();
		if (!rect.width || !rect.height) return;
		pointerX.set(((event.clientX - rect.left) / rect.width) * 2 - 1);
		pointerY.set(((event.clientY - rect.top) / rect.height) * 2 - 1);
	}

	function settle() {
		pointerX.set(0);
		pointerY.set(0);
	}

	const face =
		'absolute inset-0 rounded-2xl backface-hidden motion-reduce:transition-opacity motion-reduce:duration-(--duration-base) motion-reduce:ease-out';
	const hitArea =
		'focus-visible:ring-ring focus-visible:ring-offset-background absolute inset-0 z-10 cursor-pointer rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-offset-2';
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

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	{...restProps}
	bind:this={ref}
	data-slot="flip-card"
	data-flipped={flipped ? '' : undefined}
	class={cn(
		'group/flip relative h-96 w-72 max-w-full touch-manipulation transition-[scale] duration-(--duration-fast) ease-out select-none has-[button:active]:scale-[0.96] motion-reduce:transition-none',
		className
	)}
	onpointermove={chain(restProps.onpointermove, lean)}
	onpointerleave={chain(restProps.onpointerleave, settle)}
>
	<div
		bind:this={shadow}
		aria-hidden="true"
		class="bg-foreground dark:bg-background absolute inset-x-6 top-10 bottom-2 [transform:translateY(14px)_scale(0.92)] rounded-2xl opacity-30 blur-2xl"
	></div>
	<div class="absolute inset-0 [perspective:1200px]">
		<div
			bind:this={body}
			class="relative size-full [transform-style:preserve-3d]"
			style={startAngle ? 'transform: rotateY(180deg)' : undefined}
		>
			<div
				class={cn(face, 'motion-reduce:group-data-flipped/flip:opacity-0')}
				inert={flipped}
				aria-hidden={flipped}
			>
				<button
					bind:this={frontButton}
					type="button"
					aria-label={frontLabel}
					class={hitArea}
					onclick={toggle}
				></button>
				{@render front()}
			</div>
			<div
				class={cn(
					face,
					'[transform:rotateY(180deg)] motion-reduce:[transform:none] motion-reduce:opacity-0 motion-reduce:group-data-flipped/flip:opacity-100'
				)}
				inert={!flipped}
				aria-hidden={!flipped}
			>
				<button
					bind:this={backButton}
					type="button"
					aria-label={backLabel}
					class={hitArea}
					onclick={toggle}
				></button>
				{@render back()}
			</div>
		</div>
	</div>
</div>
