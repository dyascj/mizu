<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { duration, prefersReducedMotion, springs } from '$lib/components/ui/motion';
	import { NumberTicker } from '$lib/components/ui/number-ticker';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLButtonAttributes, 'children' | 'onclick' | 'value'> & {
		/** Whether the reader has liked it. Bindable. */
		liked?: boolean;
		/** The total shown beside the heart, including the reader's own like. Omit to show the heart alone. */
		count?: number;
		/** Called with the new state each time the button toggles. */
		onLikedChange?: (liked: boolean) => void;
		/** Accessible name, read before the count. */
		label?: string;
		/** BCP 47 locale for the count. */
		locale?: string;
		/** Intl.NumberFormat options for the count, such as compact notation. */
		format?: Intl.NumberFormatOptions;
		/** A quiet gray pill, or transparent until hover for rows of message actions. */
		variant?: 'secondary' | 'ghost';
		/** Blocks toggling. */
		disabled?: boolean;
		/** The button element. */
		ref?: HTMLButtonElement | null;
		/** Classes for the button. */
		class?: string;
	};

	let {
		liked = $bindable(false),
		count,
		onLikedChange,
		label = 'Like',
		locale,
		format,
		variant = 'secondary',
		disabled = false,
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	type Particle = { x: number; y: number; size: number };
	type Burst = { id: number; particles: Particle[] };

	const particleCount = 7;

	let heart = $state<HTMLSpanElement | null>(null);
	let bursts = $state<Burst[]>([]);
	let nextBurst = 0;
	let pressed = false;
	let motion: Animation | undefined;

	/** A motion token as a Web Animations easing string. */
	const token = (name: string) =>
		(heart && getComputedStyle(heart).getPropertyValue(name).trim()) || 'ease-out';

	/**
	 * Scale the heart from `from` (by default wherever it is now) through
	 * `stops`, holding the end. `easing` shapes the first leg.
	 */
	function scaleHeart(
		easing: string,
		stops: { scale: number; offset?: number; easing?: string }[],
		ms: number,
		from?: number
	) {
		if (!heart?.animate || prefersReducedMotion()) return;
		const now = getComputedStyle(heart).scale;
		motion?.cancel();
		motion = heart.animate(
			[{ scale: from ?? (now === 'none' ? 1 : Number(now)), easing: token(easing) }, ...stops],
			{ duration: ms, fill: 'forwards' }
		);
	}

	/** Seven particles, evenly spread and jittered so no two bursts look stamped. */
	function burst(): Burst {
		const turn = Math.random() * 360;
		return {
			id: nextBurst++,
			particles: Array.from({ length: particleCount }, (_, i) => {
				const angle =
					((turn + (i * 360) / particleCount + (Math.random() - 0.5) * 20) * Math.PI) / 180;
				const distance = 18 + Math.random() * 6;
				return {
					x: Math.cos(angle) * distance,
					y: Math.sin(angle) * distance,
					size: Math.random() < 0.5 ? 4 : 3
				};
			})
		};
	}

	const settle = () => scaleHeart('--ease-spring-snappy', [{ scale: 1 }], springs.snappy.duration);

	function onpointerdown(event: PointerEvent) {
		if (event.button !== 0 || disabled) return;
		pressed = true;
		// Liking squashes hard to wind up the pop; unliking barely gives.
		scaleHeart('--ease-out', [{ scale: liked ? 0.9 : 0.8 }], duration.instant);
	}

	function release() {
		if (!pressed) return;
		pressed = false;
		settle();
	}

	function onclick() {
		if (disabled) return;
		const fromPointer = pressed;
		pressed = false;
		liked = !liked;
		onLikedChange?.(liked);
		if (prefersReducedMotion()) return;
		if (liked) {
			// Swells past full size fast, then a bouncy spring lands it. Keyboard
			// presses skip the squash, so theirs starts from it.
			scaleHeart(
				'--ease-out',
				[{ scale: 1.2, offset: 0.22, easing: token('--ease-spring-bouncy') }, { scale: 1 }],
				duration.slow,
				fromPointer ? undefined : 0.8
			);
			bursts = [...bursts, burst()];
		} else if (fromPointer) {
			settle();
		} else {
			// Unliking from the keyboard only dips.
			scaleHeart(
				'--ease-out',
				[{ scale: 0.94, offset: 0.35, easing: token('--ease-in-out') }, { scale: 1 }],
				duration.base
			);
		}
	}

	$effect(() => () => motion?.cancel());
</script>

<button
	{...restProps}
	bind:this={ref}
	type="button"
	aria-pressed={liked}
	{disabled}
	data-state={liked ? 'on' : 'off'}
	class={cn(
		'group/like focus-visible:ring-ring focus-visible:ring-offset-background inline-flex h-9 shrink-0 touch-manipulation items-center gap-1.5 rounded-full text-sm font-medium outline-none select-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
		'transition-[background-color,color,scale] duration-(--duration-fast) ease-out active:scale-[0.96] motion-reduce:transition-[background-color,color]',
		count === undefined ? 'w-9 justify-center' : 'ps-3 pe-3.5',
		liked
			? 'bg-primary-muted text-primary'
			: variant === 'ghost'
				? 'text-muted-foreground hover:text-foreground hover:bg-foreground/8'
				: 'bg-secondary text-secondary-foreground hover:bg-control',
		className
	)}
	{onpointerdown}
	onpointerleave={release}
	onpointercancel={release}
	{onclick}
>
	<span class="relative grid size-5 place-items-center">
		<!-- Behind the heart, so the particles seem to leave from inside it. -->
		<span aria-hidden="true" class="pointer-events-none absolute inset-0">
			{#each bursts as { id, particles } (id)}
				<span class="like-ring border-primary absolute inset-0 rounded-full border-[1.5px]"></span>
				{#each particles as particle, i (i)}
					<span
						class="like-particle bg-primary absolute top-1/2 left-1/2 rounded-full"
						style:--x={particle.x}
						style:--y={particle.y}
						style:width="{particle.size}px"
						style:height="{particle.size}px"
						style:margin="{-particle.size / 2}px"
						onanimationend={i === 0
							? () => (bursts = bursts.filter((b) => b.id !== id))
							: undefined}
					></span>
				{/each}
			{/each}
		</span>
		<span bind:this={heart} class="relative block">
			<svg
				viewBox="0 0 24 24"
				aria-hidden="true"
				class={cn(
					'block size-5 fill-current transition-[color,fill-opacity] ease-out',
					liked
						? 'text-primary duration-(--duration-fast) [fill-opacity:1]'
						: 'duration-(--duration-instant) [fill-opacity:0]'
				)}
				stroke="currentColor"
				stroke-width="1.75"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path
					d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
				/>
			</svg>
		</span>
	</span>
	<span class="sr-only">{label}</span>
	{#if count !== undefined}
		<NumberTicker value={count} {locale} {format} />
	{/if}
</button>

<style>
	/* Starts inside the heart rather than from nothing, then opens and fades. */
	.like-ring {
		opacity: 0;
		animation: like-ring var(--duration-slow) var(--ease-out);
	}

	@keyframes like-ring {
		from {
			scale: 0.6;
			opacity: 0.6;
		}
		to {
			scale: 1.8;
			opacity: 0;
		}
	}

	/* Leaves from the heart's edge, holds full strength for half its flight,
	   and shrinks as it goes. Waits a beat so the heart starts swelling first. */
	.like-particle {
		opacity: 0;
		animation: like-particle var(--duration-deliberate) var(--ease-out) var(--stagger) both;
	}

	@keyframes like-particle {
		from {
			translate: calc(var(--x) * 0.3px) calc(var(--y) * 0.3px);
			scale: 1;
			opacity: 1;
		}
		50% {
			opacity: 1;
		}
		to {
			translate: calc(var(--x) * 1px) calc(var(--y) * 1px);
			scale: 0.4;
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.like-ring,
		.like-particle {
			display: none;
		}
	}
</style>
