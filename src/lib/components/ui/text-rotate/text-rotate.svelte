<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import type { TransitionConfig } from 'svelte/transition';
	import { duration, easeIn, easeOut, springs } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
		/** Words to cycle through. Assistive technology reads the first one, or the last when `loop` is false. */
		words: string[];
		/** Milliseconds each word stays on screen. */
		interval?: number;
		/** Resolve from a soft blur, or slide up into place. */
		effect?: 'blur' | 'slide';
		/**
		 * Hold the current word. Rotation also pauses on hover, on focus, and in
		 * background tabs, and never starts for reduced motion. Offer a control
		 * bound to this prop when the rotation runs alongside other content,
		 * so readers can stop it (WCAG 2.2.2).
		 */
		paused?: boolean;
		/** Keep cycling. When false, rotation stops on the last word. */
		loop?: boolean;
		class?: string;
		ref?: HTMLSpanElement | null;
	};

	let {
		words,
		interval = 2400,
		effect: effectName = 'blur',
		paused = false,
		loop = true,
		class: className,
		ref = $bindable(null),
		...rest
	}: Props = $props();

	let index = $state(0);
	let hovered = $state(false);
	let focused = $state(false);
	let documentHidden = $state(false);
	let reducedMotion = $state(false);
	let width = $state<number>();
	let sizer = $state<HTMLSpanElement>();

	const word = $derived(words[index % Math.max(1, words.length)] ?? '');
	const running = $derived(
		words.length > 1 && !paused && !hovered && !focused && !documentHidden && !reducedMotion
	);

	$effect(() => {
		if (typeof window.matchMedia !== 'function') return;
		const media = window.matchMedia('(prefers-reduced-motion: reduce)');
		const sync = () => {
			reducedMotion = media.matches;
			// Hold still on the word assistive technology reads.
			if (media.matches) index = loop ? 0 : Math.max(0, words.length - 1);
		};
		sync();
		media.addEventListener('change', sync);
		return () => media.removeEventListener('change', sync);
	});

	$effect(() => {
		const sync = () => (documentHidden = document.hidden);
		sync();
		document.addEventListener('visibilitychange', sync);
		return () => document.removeEventListener('visibilitychange', sync);
	});

	$effect(() => {
		if (!running || (!loop && index >= words.length - 1)) return;
		const next = (index + 1) % words.length;
		const timer = setTimeout(() => (index = next), Math.max(duration.deliberate, interval));
		return () => clearTimeout(timer);
	});

	// The sizer holds the current word in flow, so the wrapper keeps the text
	// baseline. Its measured width drives the wrapper. The old word leaves first,
	// then the width and the new word move together, so words never collide
	// with the text beside them.
	$effect(() => {
		if (!sizer || typeof ResizeObserver === 'undefined') return;
		const observer = new ResizeObserver(([entry]) => {
			width = entry.borderBoxSize[0].inlineSize;
		});
		observer.observe(sizer);
		return () => observer.disconnect();
	});

	const offset = $derived(effectName === 'slide' ? 0.6 : 0.2);

	/** Opacity follows ease-out so it never overshoots; position rides the spring. */
	function enter(_node: Element): TransitionConfig {
		if (reducedMotion) return {};
		const blur = effectName === 'blur';
		return {
			delay: duration.fast,
			duration: springs.smooth.duration,
			css: (t) => {
				const u = 1 - springs.smooth.easing(t);
				return `opacity: ${easeOut(t)}; translate: 0 ${u * offset}em;${blur ? ` filter: blur(${(1 - easeOut(t)) * 0.2}em);` : ''}`;
			}
		};
	}

	function exit(_node: Element): TransitionConfig {
		if (reducedMotion) return {};
		const blur = effectName === 'blur';
		return {
			duration: duration.fast,
			easing: easeIn,
			css: (t, u) =>
				`opacity: ${t}; translate: 0 ${-u * offset}em;${blur ? ` filter: blur(${u * 0.2}em);` : ''}`
		};
	}
</script>

<span
	bind:this={ref}
	class={cn(
		'relative inline-block whitespace-nowrap transition-[width] delay-(--duration-fast) duration-(--duration-slow) ease-out',
		className
	)}
	style:width={width === undefined ? undefined : `${width}px`}
	onpointerenter={() => (hovered = true)}
	onpointerleave={() => (hovered = false)}
	onfocusin={() => (focused = true)}
	onfocusout={() => (focused = false)}
	{...rest}
>
	<span class="sr-only">{(loop ? words[0] : words.at(-1)) ?? ''}</span>
	<span bind:this={sizer} class="invisible inline-block" aria-hidden="true">{word}</span>
	{#key index}
		<span class="absolute top-0 left-0" aria-hidden="true" in:enter out:exit>{word}</span>
	{/key}
</span>
