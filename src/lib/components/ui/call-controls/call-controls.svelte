<script lang="ts" module>
	export type CallPhase = 'incoming' | 'active' | 'declined' | 'ended';

	/** Seconds as a call clock, such as 01:05 or 1:02:09. */
	export function formatCallTime(seconds: number): string {
		const total = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
		const h = Math.floor(total / 3600);
		const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
		const s = String(total % 60).padStart(2, '0');
		return h ? `${h}:${m}:${s}` : `${m}:${s}`;
	}
</script>

<script lang="ts">
	import Phone from '@lucide/svelte/icons/phone';
	import Volume2 from '@lucide/svelte/icons/volume-2';
	import { tick, type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { TransitionConfig } from 'svelte/transition';
	import {
		duration as durations,
		easeIn,
		easeOut,
		prefersReducedMotion,
		springs,
		stagger
	} from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** Who is on the other end, such as the assistant's name. */
		name: string;
		/** Where the call stands. Bind it, or follow `onPhaseChange`. */
		phase?: CallPhase;
		/** Called when a button moves the call to another phase. */
		onPhaseChange?: (phase: CallPhase) => void;
		/** Whether your microphone is muted. */
		muted?: boolean;
		/** Whether audio plays through the speaker. */
		speaker?: boolean;
		/**
		 * Time in the call, if your call provider owns the clock. Leave unset and
		 * the controls count from the moment the call is accepted.
		 */
		seconds?: number;
		/** The line under the name while the call is ringing. */
		incomingLabel?: string;
		/** The caller's picture. Defaults to their initial. */
		avatar?: Snippet;
		/** Classes for the bar. */
		class?: string;
		/** The bar element. */
		ref?: HTMLDivElement | null;
	};

	let {
		name,
		phase = $bindable('incoming'),
		onPhaseChange,
		muted = $bindable(false),
		speaker = $bindable(false),
		seconds,
		incomingLabel = 'Incoming voice call',
		avatar,
		class: className,
		ref = $bindable(null),
		...restProps
	}: Props = $props();

	const ringing = $derived(phase === 'incoming');
	const inCall = $derived(phase === 'active');
	const over = $derived(!ringing && !inCall);

	// The clock runs only while the call is live, one tick a second, anchored
	// to wall time so a throttled background tab catches up instead of drifting.
	let counted = $state(0);
	$effect(() => {
		if (!inCall || seconds !== undefined) return;
		const started = Date.now();
		counted = 0;
		const timer = setInterval(() => (counted = Math.floor((Date.now() - started) / 1000)), 1000);
		return () => clearInterval(timer);
	});
	const elapsed = $derived(seconds ?? counted);

	const subtitle = $derived(
		ringing
			? incomingLabel
			: inCall
				? formatCallTime(elapsed)
				: phase === 'declined'
					? 'Call declined'
					: `Call ended · ${formatCallTime(elapsed)}`
	);
	// The ticking clock is never announced; only the change of phase is.
	const announcement = $derived(
		ringing
			? `${name} is calling`
			: inCall
				? 'Call started'
				: phase === 'declined'
					? 'Call declined'
					: 'Call ended'
	);

	let mainButton = $state<HTMLButtonElement | null>(null);
	let details = $state<HTMLSpanElement | null>(null);
	let settle: ReturnType<typeof setTimeout> | undefined;

	async function go(next: CallPhase) {
		const bar = ref;
		const button = mainButton;
		const barFrom = bar?.getBoundingClientRect().width ?? 0;
		const buttonFrom = button?.getBoundingClientRect().width ?? 0;
		const hadFocus = !!bar?.contains(document.activeElement);
		if (next === 'active') {
			muted = false;
			speaker = false;
		}
		phase = next;
		onPhaseChange?.(next);
		await tick();
		if (bar && button && details) reshape(bar, button, details, barFrom, buttonFrom);
		// Decline and the call toggles leave the page; focus lands on the one
		// button that stays, instead of falling back to the document.
		const active = document.activeElement;
		if (hadFocus && (!bar?.contains(active) || active?.closest('[data-leaving]'))) {
			mainButton?.focus();
		}
	}

	/**
	 * The bar and the main button grow and shrink around their new content on
	 * a spring, played back from their old widths. The name holds its final
	 * width meanwhile, so the controls row takes up the difference.
	 */
	function reshape(
		bar: HTMLElement,
		button: HTMLElement,
		name: HTMLElement,
		barFrom: number,
		buttonFrom: number
	) {
		clearTimeout(settle);
		const elements = [bar, button];
		for (const element of elements) {
			element.style.transition = 'none';
			element.style.removeProperty('width');
		}
		name.style.removeProperty('min-width');
		const barTo = bar.getBoundingClientRect().width;
		const buttonTo = button.getBoundingClientRect().width;
		const nameTo = name.getBoundingClientRect().width;
		if (prefersReducedMotion() || Math.abs(barTo - barFrom) + Math.abs(buttonTo - buttonFrom) < 1) {
			for (const element of elements) element.style.removeProperty('transition');
			return;
		}
		bar.style.width = `${barFrom}px`;
		button.style.width = `${buttonFrom}px`;
		name.style.minWidth = `${nameTo}px`;
		void bar.offsetWidth;
		for (const element of elements) element.style.removeProperty('transition');
		bar.style.width = `${barTo}px`;
		button.style.width = `${buttonTo}px`;
		settle = setTimeout(() => {
			bar.style.removeProperty('width');
			button.style.removeProperty('width');
			name.style.removeProperty('min-width');
		}, springs.smooth.duration);
	}

	$effect(() => () => clearTimeout(settle));

	/** Takes a leaving element out of the flow where it stands. */
	function pin(node: Element) {
		const element = node as HTMLElement;
		element.dataset.leaving = '';
		const left = element.offsetLeft;
		const top = element.offsetTop;
		element.style.position = 'absolute';
		element.style.left = `${left}px`;
		element.style.top = `${top}px`;
		element.style.pointerEvents = 'none';
	}

	/** Fades out where it stands with a soft blur: it is not the one you chose. */
	function bowOut(node: Element, { scale = 0.6 }: { scale?: number } = {}): TransitionConfig {
		pin(node);
		if (prefersReducedMotion()) return { duration: durations.instant, css: (t) => `opacity: ${t}` };
		return {
			duration: durations.fast,
			easing: easeIn,
			css: (t, u) => `opacity: ${t}; scale: ${1 - u * (1 - scale)}; filter: blur(${u * 4}px)`
		};
	}

	function appear(_node: Element): TransitionConfig {
		if (prefersReducedMotion()) return { duration: durations.fast, css: (t) => `opacity: ${t}` };
		return {
			duration: durations.base,
			easing: easeOut,
			css: (t, u) => `opacity: ${t}; scale: ${1 - u * 0.4}; filter: blur(${u * 4}px)`
		};
	}

	// One button's width plus the gap, so a control can start tucked exactly
	// behind the one after it.
	const STEP = 52;

	/**
	 * The call toggles unfold out of the hang up button: each starts tucked
	 * behind it and slides out to its place on a spring, the nearest first.
	 */
	function unfold(
		node: Element,
		{ index, count }: { index: number; count: number }
	): TransitionConfig {
		if (prefersReducedMotion()) return { duration: durations.fast, css: (t) => `opacity: ${t}` };
		// Right to left, the hang up button is on the left, so they slide out the other way.
		const sign = getComputedStyle(node).direction === 'rtl' ? -1 : 1;
		const behind = sign * (count - index) * STEP;
		const spring = springs.smooth;
		return {
			delay: (count - 1 - index) * stagger + durations.instant,
			duration: spring.duration,
			css: (t) => {
				const s = spring.easing(t);
				return `translate: ${(1 - s) * behind}px 0; scale: ${0.8 + 0.2 * s}; opacity: ${easeOut(Math.min(1, t * 2))}`;
			}
		};
	}

	/** Words and icons trade places with a quick blur and scale. */
	function swapIn(_node: Element, { delay = 0 }: { delay?: number } = {}): TransitionConfig {
		if (prefersReducedMotion()) return { duration: durations.fast, css: (t) => `opacity: ${t}` };
		const spring = springs.snappy;
		return {
			delay,
			duration: spring.duration,
			css: (t) => {
				const s = spring.easing(t);
				return `opacity: ${easeOut(t)}; scale: ${0.25 + 0.75 * s}; filter: blur(${(1 - easeOut(t)) * 4}px)`;
			}
		};
	}

	function swapOut(node: Element): TransitionConfig {
		pin(node);
		if (prefersReducedMotion()) return { duration: durations.instant, css: (t) => `opacity: ${t}` };
		return {
			duration: durations.instant,
			easing: easeIn,
			css: (t, u) => `opacity: ${t}; scale: ${1 - u * 0.75}; filter: blur(${u * 4}px)`
		};
	}

	function subtitleIn(_node: Element): TransitionConfig {
		const rise = prefersReducedMotion() ? 0 : 3;
		return {
			duration: durations.base,
			easing: easeOut,
			css: (t, u) => `opacity: ${t}; translate: 0 ${u * rise}px; filter: blur(${u * 3}px)`
		};
	}

	function subtitleOut(node: Element): TransitionConfig {
		pin(node);
		return {
			duration: durations.instant,
			easing: easeIn,
			css: (t, u) => `opacity: ${t}; filter: blur(${u * 2}px)`
		};
	}

	const round =
		'focus-visible:ring-ring focus-visible:ring-offset-card grid size-11 shrink-0 touch-manipulation place-items-center rounded-full outline-none select-none transition-[scale,background-color,color] duration-(--duration-fast) ease-out focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.96] [&_svg]:size-5';

	const toggles = $derived([
		{ key: 'mute', label: 'Mute', on: muted, set: (value: boolean) => (muted = value) },
		{ key: 'speaker', label: 'Speaker', on: speaker, set: (value: boolean) => (speaker = value) }
	]);
</script>

<div
	{...restProps}
	bind:this={ref}
	role="group"
	aria-label={restProps['aria-label'] ?? `Call with ${name}`}
	data-phase={phase}
	class={cn(
		'bg-card relative flex w-fit max-w-full items-center gap-3 overflow-hidden rounded-full p-2 shadow-md transition-[width] duration-(--duration-spring) ease-(--ease-spring) motion-reduce:transition-none',
		className
	)}
>
	<!-- The caller stays put through every phase; only what is around them changes. -->
	<span class="relative size-11 shrink-0">
		{#if ringing}
			<span
				aria-hidden="true"
				class="call-ripple bg-foreground/15 absolute inset-0 rounded-full motion-reduce:hidden"
			></span>
			<span
				aria-hidden="true"
				class="call-ripple call-ripple-late bg-foreground/15 absolute inset-0 rounded-full motion-reduce:hidden"
			></span>
		{/if}
		<span
			class={cn(
				'bg-secondary text-foreground relative grid size-11 place-items-center overflow-hidden rounded-full text-sm font-medium transition-[opacity,filter] duration-(--duration-base) ease-out',
				over && 'opacity-50 grayscale'
			)}
		>
			{#if avatar}
				{@render avatar()}
			{:else}
				<span aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>
			{/if}
		</span>
	</span>

	<span bind:this={details} class="flex min-w-0 flex-1 flex-col pe-1">
		<span class="text-foreground truncate text-sm font-medium">{name}</span>
		<span class="text-muted-foreground relative grid text-xs tabular-nums">
			{#key over ? phase : ringing ? 'ringing' : 'call'}
				<span class="truncate whitespace-nowrap" in:subtitleIn out:subtitleOut>{subtitle}</span>
			{/key}
		</span>
	</span>

	<span class="sr-only" aria-live="polite">{announcement}</span>

	<!-- While the bar reshapes, this row absorbs the difference: new toggles are
	     revealed from behind the main button instead of squeezing the name. -->
	<div class="relative -my-1 flex min-w-0 items-center justify-end gap-2 overflow-hidden p-1">
		{#if ringing}
			<button
				type="button"
				aria-label="Decline"
				class={cn(round, 'bg-destructive text-destructive-foreground hover:opacity-90')}
				onclick={() => go('declined')}
				in:appear
				out:bowOut
			>
				<Phone aria-hidden="true" class="rotate-[135deg]" />
			</button>
		{/if}
		<!-- Keyed straight off the phase, so each toggle's own entrance plays. -->
		{#each inCall ? toggles : [] as toggle, index (toggle.key)}
			<button
				type="button"
				aria-label={toggle.label}
				aria-pressed={toggle.on}
				class={cn(
					round,
					toggle.on
						? 'bg-primary-muted text-primary'
						: 'bg-secondary text-secondary-foreground hover:bg-control'
				)}
				onclick={() => toggle.set(!toggle.on)}
				in:unfold={{ index, count: toggles.length }}
				out:bowOut={{ scale: 0.8 }}
			>
				{#if toggle.key === 'mute'}
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<rect x="9" y="2" width="6" height="12" rx="3" />
						<path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4" />
						<!-- A slash draws across the mic as it mutes, and back. -->
						<path
							d="M4 4l16 16"
							pathLength="1"
							class="call-slash"
							style:stroke-dashoffset={toggle.on ? 0 : 1}
							style:opacity={toggle.on ? 1 : 0}
						/>
					</svg>
				{:else}
					<Volume2 aria-hidden="true" />
				{/if}
			</button>
		{/each}

		<!-- One button throughout: accept becomes hang up becomes call again. It
		     never leaves the spot you pressed, it only changes what it is. -->
		<button
			bind:this={mainButton}
			type="button"
			aria-label={ringing ? 'Accept' : inCall ? 'End call' : undefined}
			data-main
			class={cn(
				'focus-visible:ring-ring focus-visible:ring-offset-card group/call relative z-10 grid h-11 shrink-0 touch-manipulation place-items-center overflow-hidden rounded-full outline-none select-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.96]',
				'bg-secondary transition-[width,padding,scale,color] duration-(--duration-spring) ease-(--ease-spring) motion-reduce:transition-none',
				over ? 'text-foreground px-4' : 'w-11',
				ringing && 'text-success-foreground',
				inCall && 'text-destructive-foreground w-14'
			)}
			onclick={() => go(ringing ? 'active' : inCall ? 'ended' : 'incoming')}
		>
			<!-- Colors never cross-fade: red over green would pass through brown.
			     The red wipes out from the center instead, and drains back into it
			     on hang up; the green underneath waits until it is covered. -->
			<span
				aria-hidden="true"
				class={cn(
					'bg-success absolute inset-0 transition-opacity ease-out',
					ringing
						? 'opacity-100 duration-(--duration-base)'
						: 'opacity-0 delay-(--duration-slow) duration-0'
				)}
			></span>
			<span
				aria-hidden="true"
				class={cn(
					'bg-destructive absolute inset-0 transition-[clip-path] motion-reduce:transition-none',
					inCall
						? 'duration-(--duration-slow) ease-out [clip-path:circle(75%_at_50%_50%)]'
						: 'duration-(--duration-fast) ease-in [clip-path:circle(0%_at_50%_50%)]'
				)}
			></span>
			<!-- Hover lightens with a veil of the icon color. -->
			<span
				aria-hidden="true"
				class="absolute inset-0 bg-current opacity-0 transition-opacity duration-(--duration-fast) ease-out group-hover/call:opacity-10"
			></span>
			{#key over}
				<span
					class="relative grid place-items-center"
					in:swapIn={{ delay: over ? durations.fast : 0 }}
					out:swapOut
				>
					{#if over}
						<span class="text-sm font-medium whitespace-nowrap">Call again</span>
					{:else}
						<!-- The handset tips over to hang up rather than swapping icons. -->
						<span
							class={cn(
								'grid transition-[rotate] duration-(--duration-spring) ease-(--ease-spring) motion-reduce:transition-none',
								inCall && 'rotate-[135deg]'
							)}
						>
							<span class={cn('grid [&_svg]:size-5', ringing && 'call-wiggle')}>
								<Phone aria-hidden="true" />
							</span>
						</span>
					{/if}
				</span>
			{/key}
		</button>
	</div>
</div>

<style>
	/* Rings spread and fade like sound leaving a phone. */
	.call-ripple {
		animation: call-ripple var(--duration-ambient) var(--ease-out) infinite;
	}
	.call-ripple-late {
		animation-delay: calc(var(--duration-ambient) / 2);
	}
	@keyframes call-ripple {
		from {
			scale: 1;
			opacity: 0.8;
		}
		to {
			scale: 1.3;
			opacity: 0;
		}
	}

	/* A short buzz with a long rest, so it nudges without nagging. */
	.call-wiggle {
		animation: call-wiggle calc(var(--duration-ambient) * 1.2) var(--ease-in-out) infinite;
	}
	@keyframes call-wiggle {
		0%,
		70%,
		90%,
		100% {
			rotate: 0deg;
		}
		74% {
			rotate: -14deg;
		}
		78% {
			rotate: 12deg;
		}
		82% {
			rotate: -9deg;
		}
		86% {
			rotate: 6deg;
		}
	}

	.call-slash {
		stroke-dasharray: 1;
		transition:
			stroke-dashoffset var(--duration-base) var(--ease-out),
			opacity var(--duration-fast) var(--ease-out);
	}

	@media (prefers-reduced-motion: reduce) {
		.call-ripple,
		.call-wiggle {
			animation: none;
		}
		.call-slash {
			transition: none;
		}
	}
</style>
