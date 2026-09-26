<script lang="ts">
	import { untrack } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { TransitionConfig } from 'svelte/transition';
	import {
		duration,
		easeIn,
		easeOut,
		prefersReducedMotion,
		springs
	} from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLButtonAttributes, 'children' | 'onclick' | 'value'> & {
		/** Whether the reader follows them. Bindable. */
		following?: boolean;
		/** Called with the new state each time the button toggles. */
		onFollowingChange?: (following: boolean) => void;
		/** Who or what is followed, such as a person or an agent. Completes the accessible name. */
		name?: string;
		/** The label before following, and the start of the accessible name. */
		label?: string;
		/** The label once followed. */
		followingLabel?: string;
		/**
		 * The label a pointer resting on a followed button sees, a beat after it
		 * arrives, so a press there reads as the undo it is.
		 */
		unfollowLabel?: string;
		/** Blocks toggling. */
		disabled?: boolean;
		/** The button element. */
		ref?: HTMLButtonElement | null;
		/** Classes for the button. */
		class?: string;
	};

	let {
		following = $bindable(false),
		onFollowingChange,
		name,
		label = 'Follow',
		followingLabel = 'Following',
		unfollowLabel = 'Unfollow',
		disabled = false,
		ref = $bindable(null),
		class: className,
		onpointerenter,
		onpointerleave,
		...restProps
	}: Props = $props();

	type Mode = 'follow' | 'following' | 'unfollow';

	// The glyph is two strokes that trade places: a plus, a check, or a cross.
	// The last number turns the whole glyph. A quarter turn leaves a plus looking
	// the same, so the plus seems to turn into the check rather than swap for it.
	const shapes: Record<Mode, number[]> = {
		follow: [12, 5, 12, 19, 5, 12, 19, 12, -90],
		following: [5.5, 12.5, 10, 17, 10, 17, 18.5, 7.5, 0],
		unfollow: [7, 7, 17, 17, 17, 7, 7, 17, 0]
	};

	/**
	 * Long enough that sweeping past a followed button never flashes the
	 * warning, short enough that someone aiming for it is not kept waiting.
	 * A hover-intent delay, not an animation.
	 */
	const warnAfter = 450;

	let warning = $state(false);
	// Right after following, the pointer is still on the button. It has to
	// leave and come back before the warning can show under it.
	let armed = true;
	/** A fine pointer is resting on the button. */
	let hovering = false;
	let timer: ReturnType<typeof setTimeout> | undefined;
	let widths = $state<Record<Mode, number>>({ follow: 0, following: 0, unfollow: 0 });

	const mode: Mode = $derived(!following ? 'follow' : warning ? 'unfollow' : 'following');
	const labels = $derived<Record<Mode, string>>({
		follow: label,
		following: followingLabel,
		unfollow: unfollowLabel
	});
	const measured = $derived(widths.follow > 0 && widths.following > 0 && widths.unfollow > 0);

	const start = untrack(() => shapes[following ? 'following' : 'follow']);
	let lines = $state<SVGLineElement[]>([]);
	let icon = $state<SVGSVGElement | null>(null);
	let shown = [...start];
	let frame = 0;

	function draw() {
		lines.forEach((line, i) => {
			line.setAttribute('x1', String(shown[i * 4]));
			line.setAttribute('y1', String(shown[i * 4 + 1]));
			line.setAttribute('x2', String(shown[i * 4 + 2]));
			line.setAttribute('y2', String(shown[i * 4 + 3]));
		});
		if (icon) icon.style.rotate = `${shown[8]}deg`;
	}

	/**
	 * Every number eases from wherever the glyph is now, so a change of mind
	 * halfway reshapes it from there. Written straight to the strokes, so no
	 * state churns per frame.
	 */
	function morph(to: number[]) {
		cancelAnimationFrame(frame);
		if (prefersReducedMotion() || typeof requestAnimationFrame === 'undefined') {
			shown = [...to];
			draw();
			return;
		}
		const from = [...shown];
		const { duration: settle, easing } = springs.smooth;
		let begin: number | undefined;
		const tick = (now: number) => {
			begin ??= now;
			const t = Math.min(1, (now - begin) / settle);
			const e = easing(t);
			shown = from.map((value, i) => value + (to[i] - value) * e);
			draw();
			frame = t < 1 ? requestAnimationFrame(tick) : 0;
		};
		frame = requestAnimationFrame(tick);
	}

	let drawn = untrack(() => mode);
	$effect(() => {
		const next = mode;
		if (next === drawn) return;
		drawn = next;
		untrack(() => morph(shapes[next]));
	});

	function cancelWarning() {
		clearTimeout(timer);
		warning = false;
	}

	$effect(() => {
		if (!following) untrack(cancelWarning);
	});

	$effect(() => () => {
		clearTimeout(timer);
		cancelAnimationFrame(frame);
	});

	function onclick() {
		if (disabled) return;
		cancelWarning();
		// Only a pointer already on the button has to leave first. A toggle from
		// the keyboard, with the pointer elsewhere, leaves the next hover armed.
		if (hovering) armed = false;
		following = !following;
		onFollowingChange?.(following);
	}

	type ButtonEvent = PointerEvent & { currentTarget: EventTarget & HTMLButtonElement };

	function handlePointerEnter(event: ButtonEvent) {
		onpointerenter?.(event);
		if (event.pointerType === 'touch') return;
		hovering = true;
		if (!following || !armed || disabled) return;
		clearTimeout(timer);
		timer = setTimeout(() => (warning = true), warnAfter);
	}

	function handlePointerLeave(event: ButtonEvent) {
		onpointerleave?.(event);
		if (event.pointerType === 'touch') return;
		hovering = false;
		armed = true;
		cancelWarning();
	}

	// Words arrive from a soft blur and leave in half the time, so the old word
	// is gone before the new one is legible.
	function wordIn(_node: Element): TransitionConfig {
		if (prefersReducedMotion()) return { duration: duration.fast, css: (t) => `opacity: ${t}` };
		return {
			duration: duration.base,
			easing: easeOut,
			css: (t, u) => `opacity: ${t}; translate: 0 ${u * 4}px; filter: blur(${u * 4}px)`
		};
	}

	function wordOut(_node: Element): TransitionConfig {
		if (prefersReducedMotion()) return { duration: duration.instant, css: (t) => `opacity: ${t}` };
		return {
			duration: duration.instant,
			easing: easeIn,
			css: (t, u) => `opacity: ${t}; translate: 0 ${u * -2}px; filter: blur(${u * 4}px)`
		};
	}
</script>

<button
	{...restProps}
	bind:this={ref}
	type="button"
	aria-pressed={following}
	aria-label={name ? `${label} ${name}` : label}
	{disabled}
	data-state={mode}
	class={cn(
		'focus-visible:ring-ring focus-visible:ring-offset-background inline-flex h-9 shrink-0 touch-manipulation items-center gap-1.5 rounded-full pr-4 pl-3 text-sm font-medium outline-none select-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
		// Text color is left out on purpose: it flips with the word swap, which
		// the blur already covers, so a word never fades through a middle gray.
		'transition-[background-color,scale] duration-(--duration-fast) ease-out active:scale-[0.96] motion-reduce:transition-[background-color]',
		mode === 'follow' && 'bg-primary text-primary-foreground hover:bg-primary-hover',
		mode === 'following' && 'bg-secondary text-secondary-foreground hover:bg-control',
		// Faint on purpose: a warning, not an alarm.
		mode === 'unfollow' && 'bg-destructive/10 text-destructive',
		className
	)}
	{onclick}
	onpointerenter={handlePointerEnter}
	onpointerleave={handlePointerLeave}
>
	<svg
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		aria-hidden="true"
		class="size-4 shrink-0"
		style="rotate: {start[8]}deg"
		bind:this={icon}
	>
		<line bind:this={lines[0]} x1={start[0]} y1={start[1]} x2={start[2]} y2={start[3]} />
		<line bind:this={lines[1]} x1={start[4]} y1={start[5]} x2={start[6]} y2={start[7]} />
	</svg>
	<!-- Width, not scale, so the words never stretch. Every label is measured
	     once, so the button glides to the next width while the word changes. -->
	<span
		aria-hidden="true"
		class="relative grid h-5 overflow-hidden leading-5 transition-[width] duration-(--duration-base) ease-out motion-reduce:transition-none"
		style:width={measured ? `${widths[mode]}px` : undefined}
	>
		{#key mode}
			<span class="col-start-1 row-start-1 whitespace-nowrap" in:wordIn out:wordOut>
				{labels[mode]}
			</span>
		{/key}
		<span
			bind:offsetWidth={widths.follow}
			class="invisible absolute top-0 left-0 whitespace-nowrap"
		>
			{label}
		</span>
		<span
			bind:offsetWidth={widths.following}
			class="invisible absolute top-0 left-0 whitespace-nowrap"
		>
			{followingLabel}
		</span>
		<span
			bind:offsetWidth={widths.unfollow}
			class="invisible absolute top-0 left-0 whitespace-nowrap"
		>
			{unfollowLabel}
		</span>
	</span>
</button>
