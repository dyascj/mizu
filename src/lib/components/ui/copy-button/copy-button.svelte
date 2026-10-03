<script lang="ts">
	import X from '@lucide/svelte/icons/x';
	import type { TransitionConfig } from 'svelte/transition';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import {
		duration as durations,
		easeOut,
		prefersReducedMotion,
		stagger
	} from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLButtonAttributes, 'value' | 'children' | 'onclick'> & {
		/** The text written to the clipboard. */
		value: string;
		/**
		 * Accessible name for the button. In text mode the shown text follows it,
		 * so the name always contains what the button says.
		 */
		label?: string;
		/** How long the success or failure state shows, in milliseconds. */
		timeout?: number;
		/** Called with the copied text after the clipboard accepts it. */
		onCopy?: (value: string) => void;
		/** Resting fill: transparent until hover, or a quiet gray. */
		variant?: 'ghost' | 'secondary';
		/** Button diameter, or height in text mode. */
		size?: 'sm' | 'md';
		/**
		 * `icon` is a round icon button. `text` shows the value itself in mono,
		 * and on copy its letters flip, one after another, into the confirmation.
		 */
		mode?: 'icon' | 'text';
		/** What text mode shows at rest. Defaults to the value. */
		text?: string;
		/** What text mode flips to after a successful copy. */
		copiedText?: string;
		/** What text mode flips to when the clipboard refuses. Also announced. */
		failedText?: string;
		/** The button element. */
		ref?: HTMLButtonElement | null;
		/** Classes for the button. */
		class?: string;
	};

	let {
		value,
		label = 'Copy',
		timeout = 1600,
		onCopy,
		variant = 'ghost',
		size = 'md',
		mode = 'icon',
		text,
		copiedText = 'Copied',
		failedText = 'Copy failed',
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	let status = $state<'idle' | 'copied' | 'error'>('idle');
	let resetTimer: ReturnType<typeof setTimeout> | undefined;
	let attempt = 0;

	async function copy() {
		const id = ++attempt;
		clearTimeout(resetTimer);
		let next: typeof status;
		try {
			await navigator.clipboard.writeText(value);
			next = 'copied';
		} catch {
			next = 'error';
		}
		// A newer click owns the result; this one is already stale.
		if (id !== attempt) return;
		status = next;
		if (next === 'copied') onCopy?.(value);
		resetTimer = setTimeout(() => (status = 'idle'), timeout);
	}

	$effect(() => () => {
		attempt++;
		clearTimeout(resetTimer);
	});

	const resting = $derived(text ?? value);
	const shown = $derived(
		status === 'copied' ? copiedText : status === 'error' ? failedText : resting
	);
	/**
	 * Letters flip one by one only where each takes one monospace cell: Latin,
	 * Greek, Cyrillic, digits, and punctuation, without combining marks, emoji,
	 * or full-width forms. Anything else, such as Japanese or Arabic, whose
	 * glyphs are wider or join, flips as a whole word instead.
	 */
	const single = (text: string) =>
		/^[\p{Script=Latin}\p{Script=Greek}\p{Script=Cyrillic}\p{Script=Common}]*$/u.test(text) &&
		!/[\p{M}\p{Extended_Pictographic}\u3000-\u303f\uff00-\uffef]/u.test(text);
	const perLetter = $derived(single(resting) && single(copiedText) && single(failedText));
	const letters = $derived(Array.from(shown));
	// Every text shares these slots. Blank ones sit at the tail, clipped by the
	// animating width.
	const slots = $derived(
		Math.max(...[resting, copiedText, failedText].map((text) => Array.from(text).length))
	);
	/** Each letter starts a beat after the one before, so the change reads as a wave. */
	const letterStagger = stagger / 3;

	function flip(direction: 1 | -1) {
		return (_node: Element, { index }: { index: number }): TransitionConfig => {
			if (prefersReducedMotion()) {
				return { duration: durations.fast, css: (t) => `opacity: ${t}` };
			}
			return {
				delay: index * letterStagger,
				duration: durations.base,
				easing: easeOut,
				css: (t, u) => `transform: rotateX(${direction * 90 * u}deg); opacity: ${t}`
			};
		};
	}
	const flipIn = flip(-1);
	const flipOut = flip(1);

	// Entering icons spring in; leaving icons fall away faster on a plain curve.
	const shownIcon =
		'scale-100 opacity-100 blur-none [transition:scale_var(--duration-spring)_var(--ease-spring),opacity_var(--duration-fast)_var(--ease-out),filter_var(--duration-fast)_var(--ease-out)]';
	const hiddenIcon =
		'scale-50 opacity-0 blur-[2px] transition-[scale,opacity,filter] duration-(--duration-fast) ease-in';
</script>

{#snippet glyph()}
	<span class="grid shrink-0 place-items-center [&>svg]:col-start-1 [&>svg]:row-start-1">
		<!-- The copy icon acts the copy out: the front sheet slides onto the back
		     one until the two pages are one, and only then does that page give
		     way to a check that draws itself in. Returning, the page comes back
		     first and splits into two a beat later. -->
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
			class={cn(
				status === 'idle' ? shownIcon : hiddenIcon,
				status === 'copied' && 'delay-(--duration-instant)'
			)}
		>
			<path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
			<rect
				width="14"
				height="14"
				x="8"
				y="8"
				rx="2"
				ry="2"
				class={cn(
					'transition-[translate] duration-(--duration-instant) ease-in-out',
					status === 'copied' ? '[translate:-6px_-6px]' : 'delay-(--duration-instant)'
				)}
			/>
		</svg>
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
			class={cn(
				'text-success',
				status === 'copied'
					? 'opacity-100 transition-opacity delay-(--duration-instant) duration-(--duration-instant) ease-out'
					: 'opacity-0 transition-opacity duration-(--duration-fast) ease-in'
			)}
		>
			<!-- A pen stroke, fast off the mark and easing into the tip. It rewinds
			     only once invisible, ready for the next copy. -->
			<path
				d="M20 6 9 17l-5-5"
				pathLength="1"
				stroke-dasharray="1"
				class={cn(
					'motion-reduce:[stroke-dashoffset:0]',
					status === 'copied'
						? 'transition-[stroke-dashoffset] delay-(--duration-instant) duration-(--duration-base) ease-in-out [stroke-dashoffset:0]'
						: 'transition-[stroke-dashoffset] delay-(--duration-fast) duration-0 [stroke-dashoffset:1]'
				)}
			/>
		</svg>
		<X
			aria-hidden="true"
			class={cn('text-destructive', status === 'error' ? shownIcon : hiddenIcon)}
		/>
	</span>
{/snippet}

<button
	{...restProps}
	bind:this={ref}
	type="button"
	aria-label={mode === 'text' ? `${label} ${resting}` : label}
	data-status={status}
	data-mode={mode}
	onclick={copy}
	class={cn(
		'text-muted-foreground hover:text-foreground focus-visible:ring-ring focus-visible:ring-offset-background inline-flex shrink-0 items-center justify-center rounded-full transition-[background-color,color,scale] duration-(--duration-fast) ease-out outline-none select-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
		variant === 'ghost' ? 'hover:bg-foreground/8' : 'bg-secondary hover:bg-control',
		mode === 'icon'
			? cn(
					'active:scale-[0.92]',
					size === 'sm' ? 'size-8 [&_svg]:size-3.5' : 'size-10 [&_svg]:size-4'
				)
			: cn(
					'text-foreground max-w-full gap-2 font-mono active:scale-[0.97]',
					size === 'sm' ? 'h-8 px-3 text-xs [&_svg]:size-3.5' : 'h-10 px-4 text-sm [&_svg]:size-4'
				),
		className
	)}
>
	{#if mode === 'text'}
		{#if perLetter}
			<!-- Width, not scale, so the neighbours reflow as the text grows or shrinks.
			     Only left-to-right scripts flip per letter, so the cells keep that order. -->
			<span
				aria-hidden="true"
				dir="ltr"
				class="flex overflow-hidden whitespace-pre transition-[width] duration-(--duration-slow) ease-in-out [perspective:15rem]"
				style:width="{letters.length}ch"
			>
				{#each { length: slots } as _, index (index)}
					<span class="grid w-[1ch] shrink-0 [transform-style:preserve-3d]">
						{#key letters[index] ?? ' '}
							<span
								class="col-start-1 row-start-1 block origin-[50%_50%_-0.5em] backface-hidden"
								in:flipIn={{ index }}
								out:flipOut={{ index }}>{letters[index] ?? ' '}</span
							>
						{/key}
					</span>
				{/each}
			</span>
		{:else}
			<span aria-hidden="true" class="grid whitespace-pre [perspective:15rem]">
				{#key shown}
					<span
						data-word
						class="col-start-1 row-start-1 block origin-[50%_50%_-0.5em] backface-hidden"
						in:flipIn={{ index: 0 }}
						out:flipOut={{ index: 0 }}>{shown}</span
					>
				{/key}
			</span>
		{/if}
		<span class="text-muted-foreground">{@render glyph()}</span>
	{:else}
		{@render glyph()}
	{/if}
</button>
<span class="sr-only" aria-live="polite">
	{status === 'copied' ? copiedText : status === 'error' ? failedText : ''}
</span>
