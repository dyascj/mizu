<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { stagger } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLButtonAttributes, 'children' | 'onclick' | 'value'> & {
		/**
		 * Which theme the icon shows. Bindable. The toggle only reports the
		 * choice; applying it to the page is up to you.
		 */
		mode?: 'light' | 'dark';
		/** Called with the new mode each time the button toggles. */
		onModeChange?: (mode: 'light' | 'dark') => void;
		/** Accessible name. The pressed state says whether it is on. */
		label?: string;
		/** A quiet gray circle, or transparent until hover for toolbars and headers. */
		variant?: 'secondary' | 'ghost';
		/** Button diameter. */
		size?: 'sm' | 'md' | 'lg';
		/** Blocks toggling. */
		disabled?: boolean;
		/** The button element. */
		ref?: HTMLButtonElement | null;
		/** Classes for the button. */
		class?: string;
	};

	let {
		mode = $bindable('light'),
		onModeChange,
		label = 'Dark mode',
		variant = 'secondary',
		size = 'md',
		disabled = false,
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	const uid = $props.id();
	const maskId = `theme-toggle-${uid}-bite`;
	const dark = $derived(mode === 'dark');

	// The bite circle slides along one straight line, 5 degrees above three
	// o'clock, so it reads as sliding in rather than sweeping. Parked 20 units
	// out it never touches the sun; 7.5 out it leaves a crescent. The tilt of
	// the whole glyph then carries the bite round to the familiar top right.
	const angle = (-5 * Math.PI) / 180;
	const bite = { cx: 12 + 7.5 * Math.cos(angle), cy: 12 + 7.5 * Math.sin(angle) };
	const parked = { x: 12.5 * Math.cos(angle), y: 12.5 * Math.sin(angle) };

	/** Rays go round the dial one by one, a third of a stagger step apart. */
	const rayStep = stagger / 3;
	const rays = Array.from({ length: 8 }, (_, i) => i);

	/**
	 * Retract in dial order. Extend in reverse, a beat late, once the disc has
	 * shrunk enough to give them room.
	 */
	const rayDelay = (i: number) => (dark ? i * rayStep : stagger + (rays.length - 1 - i) * rayStep);

	const sizes = {
		sm: 'size-8 [&_svg]:size-4',
		md: 'size-10 [&_svg]:size-5',
		lg: 'size-14 [&_svg]:size-7'
	};

	function onclick() {
		if (disabled) return;
		mode = dark ? 'light' : 'dark';
		onModeChange?.(mode);
	}

	// No overshoot anywhere: an icon that overshoots its own outline reads as a
	// wobble, not a morph.
	const morph =
		'[transform-box:view-box] origin-[12px_12px] transition-[scale,translate,rotate] duration-(--duration-spring-snappy) ease-(--ease-spring-snappy)';
</script>

<button
	{...restProps}
	bind:this={ref}
	type="button"
	aria-label={label}
	aria-pressed={dark}
	{disabled}
	data-state={mode}
	class={cn(
		'focus-visible:ring-ring focus-visible:ring-offset-background relative inline-grid shrink-0 touch-manipulation place-items-center rounded-full outline-none select-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
		'transition-[background-color,color,scale] duration-(--duration-fast) ease-out active:scale-[0.96] motion-reduce:transition-[background-color,color]',
		variant === 'ghost'
			? 'text-muted-foreground hover:text-foreground hover:bg-foreground/8'
			: 'bg-secondary text-secondary-foreground hover:bg-control',
		sizes[size],
		className
	)}
	{onclick}
>
	<svg
		viewBox="0 0 24 24"
		aria-hidden="true"
		class={cn(
			'transition-[rotate] duration-(--duration-spring-snappy) ease-(--ease-spring-snappy)',
			dark ? '-rotate-40' : 'rotate-0'
		)}
	>
		<defs>
			<mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
				<rect width="24" height="24" fill="white" />
				<circle
					cx={bite.cx}
					cy={bite.cy}
					r="7.5"
					fill="black"
					data-slot="theme-toggle-bite"
					class={morph}
					style:translate={dark ? '0 0' : `${parked.x}px ${parked.y}px`}
				/>
			</mask>
		</defs>
		<!-- The sun's disc swells into the fuller moon. The mask sits on a group so
		     the bite stays put while the disc scales. -->
		<g mask="url(#{maskId})">
			<circle
				cx="12"
				cy="12"
				r="8"
				fill="currentColor"
				data-slot="theme-toggle-disc"
				class={morph}
				style:scale={dark ? 1 : 0.5625}
			/>
		</g>
		<g stroke="currentColor" stroke-width="2" stroke-linecap="round">
			{#each rays as i (i)}
				<g class="origin-[12px_12px] [transform-box:view-box]" style:rotate="{i * 45}deg">
					<!-- Out, a ray clears the disc; in, it tucks under the moon at half
					     the reach. Opacity leaves before the ray reaches the disc and
					     arrives early going out, so rays read as growing, not fading. -->
					<line
						x1="12"
						y1="4.5"
						x2="12"
						y2="2"
						data-slot="theme-toggle-ray"
						class={cn(
							'theme-ray origin-[12px_12px] [transform-box:view-box]',
							dark ? 'scale-50 opacity-0' : 'scale-100 opacity-100'
						)}
						style:--ray-delay="{rayDelay(i)}ms"
						style:--ray-fade={dark ? 'var(--duration-instant)' : 'var(--duration-fast)'}
					/>
				</g>
			{/each}
		</g>
	</svg>
</button>

<style>
	.theme-ray {
		transition:
			scale var(--duration-spring-snappy) var(--ease-spring-snappy) var(--ray-delay),
			opacity var(--ray-fade) var(--ease-out) var(--ray-delay);
	}

	/* Reduced motion lands each shape at once and drops the sweep across the dial. */
	@media (prefers-reduced-motion: reduce) {
		.theme-ray {
			--ray-delay: 0ms !important;
		}
	}
</style>
