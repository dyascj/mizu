<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { TransitionConfig } from 'svelte/transition';
	import {
		duration as durations,
		easeIn,
		easeOut,
		prefersReducedMotion
	} from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/**
		 * The element that scrolls. Leave it out to follow the page itself. Pass
		 * `null` while the element has not mounted yet, such as a `bind:this`
		 * reference, and the bar waits for it.
		 */
		target?: HTMLElement | null;
		/**
		 * Words in the piece. Counted from the scroller's text when left out, or
		 * from the page's `article` or `main` element when following the page.
		 */
		words?: number;
		/** Reading speed used for the time left. */
		wordsPerMinute?: number;
		/** Formats the time left, such as "3 min left". */
		remainingLabel?: (minutes: number) => string;
		/** Shown once the reader reaches the end. */
		finishedLabel?: string;
		/** Hides the time left and keeps only the bar. */
		hideLabel?: boolean;
		/** The root element. */
		ref?: HTMLDivElement | null;
		/** Classes for the root. Make it sticky or fixed to pin it while reading. */
		class?: string;
		/** Leading content beside the time left, such as the section or piece name. */
		children?: Snippet;
	};

	let {
		target,
		words,
		wordsPerMinute = 220,
		remainingLabel = (minutes: number) => `${minutes} min left`,
		finishedLabel = 'Finished',
		hideLabel = false,
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: Props = $props();

	/** Scroll positions land a few pixels short of the end on some trackpads. */
	const END_SLACK = 4;

	let bar: HTMLDivElement | null = $state(null);
	let counted = $state<number | null>(null);
	let minutes = $state<number | null>(null);

	const scroller = $derived(target === undefined ? 'window' : target);
	const total = $derived(words ?? counted);
	const text = $derived(
		minutes === null ? '' : minutes === 0 ? finishedLabel : remainingLabel(minutes)
	);

	const countWords = (value: string) => value.split(/\s+/).filter(Boolean).length;

	$effect(() => {
		const source = scroller;
		if (!source || words !== undefined) return;
		const root =
			source === 'window'
				? (document.querySelector('article') ?? document.querySelector('main') ?? document.body)
				: source;
		counted = countWords(root.textContent ?? '');
	});

	// Batched to one read per frame. The bar is written straight to the DOM;
	// Svelte only hears about it when the rounded minutes change.
	$effect(() => {
		const source = scroller;
		const all = total;
		const pace = wordsPerMinute;
		if (!source) return;
		const el = source === 'window' ? undefined : source;
		let frame = 0;

		const update = () => {
			frame = 0;
			const top = el ? el.scrollTop : window.scrollY;
			const room = el
				? el.scrollHeight - el.clientHeight
				: document.documentElement.scrollHeight - window.innerHeight;
			const progress = room > 0 ? Math.min(1, Math.max(0, top / room)) : 1;
			if (bar) bar.style.scale = `${progress} 1`;
			if (all === null) return;
			const done = top >= room - END_SLACK;
			minutes = done ? 0 : Math.max(1, Math.ceil((all * (1 - progress)) / pace));
		};
		const onscroll = () => {
			frame ||= requestAnimationFrame(update);
		};

		update();
		const node = el ?? window;
		node.addEventListener('scroll', onscroll, { passive: true });
		window.addEventListener('resize', onscroll, { passive: true });
		return () => {
			cancelAnimationFrame(frame);
			node.removeEventListener('scroll', onscroll);
			window.removeEventListener('resize', onscroll);
		};
	});

	// The new time rises out of a soft blur while the old one lifts away
	// faster, so the two never read as overlapping text.
	function swap(_node: Element, { leaving }: { leaving: boolean }): TransitionConfig {
		if (prefersReducedMotion()) {
			return {
				duration: leaving ? durations.instant : durations.fast,
				css: (t) => `opacity: ${t}`
			};
		}
		return {
			duration: leaving ? durations.instant : durations.base,
			easing: leaving ? easeIn : easeOut,
			css: (t, u) =>
				`opacity: ${t}; filter: blur(${u * 4}px); translate: 0 ${u * (leaving ? -4 : 4)}px`
		};
	}
</script>

<div
	{...restProps}
	bind:this={ref}
	class={cn(
		'text-muted-foreground relative flex min-h-11 items-center justify-between gap-4 px-6 text-sm',
		className
	)}
>
	<div
		bind:this={bar}
		aria-hidden="true"
		class="bg-primary absolute inset-x-0 top-0 h-0.5 origin-left rtl:origin-right"
		style:scale="0 1"
	></div>
	{#if children}
		<span class="min-w-0 truncate">{@render children()}</span>
	{/if}
	{#if !hideLabel}
		<span class="ms-auto grid justify-items-end whitespace-nowrap tabular-nums">
			{#key text}
				<span
					class="col-start-1 row-start-1"
					in:swap={{ leaving: false }}
					out:swap={{ leaving: true }}
				>
					{text}
				</span>
			{/key}
		</span>
	{/if}
</div>
