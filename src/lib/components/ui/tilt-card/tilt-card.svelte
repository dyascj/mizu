<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import {
		pointerPosition,
		prefersReducedMotion,
		SpringValue,
		springPresets
	} from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = HTMLAttributes<HTMLDivElement> & {
		/**
		 * Largest lean in degrees, reached at the card's edges. Past about 12 the
		 * text skews enough to become hard to read.
		 */
		maxTilt?: number;
		/**
		 * The glossy streak and lit rim. They read best on a dark surface, such as
		 * a card with the `dark` class, which keeps it dark in both themes.
		 */
		glare?: boolean;
		/** The card element, the one that tilts. */
		ref?: HTMLDivElement | null;
		/** Classes for the card: give it a size, a radius, and a surface here. */
		class?: string;
		/**
		 * The card's face. Anything lifted with `[transform:translateZ(2rem)]`
		 * floats above the surface and drifts against it as the card leans.
		 */
		children?: Snippet;
	};

	let {
		maxTilt = 12,
		glare = true,
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: Props = $props();

	let shadow: HTMLDivElement | null = null;

	// Pointer position across the card, 0 to 1 on each axis, chased by a
	// critically damped spring: it settles quickly with no wobble, so the card
	// feels heavy rather than springy.
	const x = new SpringValue(0.5, { preset: springPresets.snappy, onUpdate: write });
	const y = new SpringValue(0.5, { preset: springPresets.snappy, onUpdate: write });

	function write() {
		if (!ref) return;
		// The edge under the pointer dips away, as if pressed.
		const rotateX = (0.5 - y.current) * 2 * maxTilt;
		const rotateY = (x.current - 0.5) * 2 * maxTilt;
		ref.style.transform = `perspective(800px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
		// The streak rides the same spring, so the reflection and the lean agree.
		ref.style.setProperty('--tilt-streak-position', `${x.current * 100}% ${y.current * 100}%`);
		// The light sits above the card, so the shadow slides away from the lifted edge.
		if (shadow) {
			const shadowX = 10 - x.current * 20;
			const shadowY = 18 - y.current * 12;
			shadow.style.translate = `${shadowX.toFixed(2)}px ${shadowY.toFixed(2)}px`;
		}
	}

	function move(event: PointerEvent) {
		// Touch would fight the page scroll, so leaning is for mouse and pen.
		if (event.pointerType === 'touch' || prefersReducedMotion()) return;
		const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
		if (!rect.width || !rect.height) return;
		x.set((event.clientX - rect.left) / rect.width);
		y.set((event.clientY - rect.top) / rect.height);
	}

	function leave() {
		x.set(0.5);
		y.set(0.5);
	}

	$effect(() => () => {
		x.stop();
		y.stop();
	});

	// Half lit at rest, so the card still reads as glossy before it is touched,
	// and fully lit under a fine pointer. pointerPosition keeps
	// --pointer-active at 0 for touch and reduced motion.
	const light =
		'pointer-events-none absolute inset-0 rounded-[inherit] opacity-[calc(0.5+0.5*var(--pointer-active,0))] transition-opacity duration-(--duration-slow) ease-out';
</script>

<!-- Hover only drives decoration; the card has nothing to operate. -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="relative"
	data-slot="tilt-card-frame"
	onpointermove={move}
	onpointerleave={leave}
	{@attach pointerPosition()}
>
	<div
		bind:this={shadow}
		aria-hidden="true"
		class="absolute inset-x-8 top-10 bottom-0 [translate:0_12px] rounded-2xl bg-[color-mix(in_oklab,var(--foreground)_30%,transparent)] blur-xl dark:bg-[color-mix(in_oklab,var(--background)_80%,transparent)]"
	></div>
	<div
		{...restProps}
		bind:this={ref}
		data-slot="tilt-card"
		class={cn(
			'bg-card text-card-foreground relative rounded-2xl shadow-md [transform-style:preserve-3d]',
			// The lit rim and streak paint in the card's own foreground, so they
			// are pale light on a dark card.
			'[--tilt-light:color-mix(in_oklab,var(--foreground)_70%,transparent)] [--tilt-streak-echo:color-mix(in_oklab,var(--foreground)_14%,transparent)] [--tilt-streak-soft:color-mix(in_oklab,var(--foreground)_5%,transparent)] [--tilt-streak:color-mix(in_oklab,var(--foreground)_30%,transparent)]',
			className
		)}
	>
		{#if glare}
			<!-- Fine grain, so the surface reads as a material rather than a flat fill. -->
			<div
				aria-hidden="true"
				class="pointer-events-none absolute inset-0 rounded-[inherit] opacity-[0.14] mix-blend-overlay"
				style="background-image: url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E&quot;)"
			></div>
			<!-- A glossy surface reflects light as a streak, not a spot: one broad
			     band with a thin echo beside it, like light on polished glass. The
			     oversized image slides fully across as the pointer travels. -->
			<div
				aria-hidden="true"
				class={cn(light, 'mix-blend-plus-lighter')}
				style="background-image: linear-gradient(115deg, transparent 32%, var(--tilt-streak-soft) 40%, var(--tilt-streak) 47%, var(--tilt-streak-soft) 53%, transparent 56%, transparent 59%, var(--tilt-streak-echo) 61%, transparent 63%); background-size: 250% 250%; background-position: var(--tilt-streak-position, 50% 50%)"
			></div>
			<!-- Paints only the 1px padding ring, so the light catches the rim
			     nearest the pointer. It follows the cursor itself, with no lag:
			     the cursor is the light. -->
			<div
				aria-hidden="true"
				class={cn(
					light,
					'p-px [mask:linear-gradient(black_0_0)_content-box_exclude,linear-gradient(black_0_0)]'
				)}
				style="background: radial-gradient(circle at var(--pointer-x, 50%) var(--pointer-y, 50%), var(--tilt-light), transparent 50%)"
			></div>
		{/if}
		{@render children?.()}
	</div>
</div>
