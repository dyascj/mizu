<script lang="ts">
	import X from '@lucide/svelte/icons/x';
	import { tick, untrack } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import type { TransitionConfig } from 'svelte/transition';
	import {
		duration as durations,
		easeIn,
		easeInOut,
		easeOut,
		prefersReducedMotion,
		springs,
		stagger
	} from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';
	import { changedRange, morphPlan, suggestEmail, type Glyph } from './suggest.js';

	type Props = Omit<HTMLInputAttributes, 'type' | 'value' | 'children' | 'class'> & {
		/** The address. Bindable. */
		value?: string;
		/** Called with every edit, including an accepted suggestion. */
		onValueChange?: (value: string) => void;
		/** A line under the field while there is nothing to suggest, such as where mail will go. */
		hint?: string;
		/** Domains to check against, most common first. Defaults to popular mail providers. */
		domains?: string[];
		/** Marks the field invalid. */
		invalid?: boolean;
		/** The input element. */
		ref?: HTMLInputElement | null;
		/** Classes for the wrapper around the field and its note. */
		class?: string;
	};

	let {
		value = $bindable(''),
		onValueChange,
		hint,
		domains,
		invalid = false,
		ref = $bindable(null),
		id,
		placeholder = 'you@company.com',
		class: className,
		...restProps
	}: Props = $props();

	const uid = $props.id();
	const inputId = $derived(id ?? `${uid}-input`);
	const noteId = `${uid}-note`;

	/** A pause in typing reads as "done with this bit". */
	const typingPause = durations.ambient / 2;
	/** The letters land, then the underline under the fix lingers and fades. */
	const morphSpan = durations.base + durations.deliberate * 2;
	const letterStagger = (stagger * 2) / 3;

	/**
	 * The last value looked at for typos. Typing moves ahead of it, so a
	 * half-typed "gmail.co" is never flagged mid-word. It starts equal to the
	 * value, so an address handed in prefilled is checked at once.
	 */
	let checked = $state(untrack(() => value));
	let dismissed = $state<string[]>([]);

	type Morph = { from: string; to: string; stage: 0 | 1; range: [number, number] };
	let morph = $state<Morph | null>(null);
	/** The caret hides only while letters are in flight, then comes back where they landed. */
	let moving = $state(false);
	let morphTimer: ReturnType<typeof setTimeout> | undefined;
	let landTimer: ReturnType<typeof setTimeout> | undefined;
	let frame = 0;

	// A paste, autofill, or a value replaced from outside lands several
	// letters at once: check it straight away. A keystroke only adds or
	// removes one.
	let previous = untrack(() => value);
	$effect.pre(() => {
		const next = value;
		untrack(() => {
			if (next === previous) return;
			const keystroke =
				Math.abs(next.length - previous.length) <= 1 &&
				(next.startsWith(previous) || previous.startsWith(next));
			previous = next;
			if (!keystroke) checked = next;
			// Replaced mid-morph: drop the overlay so it never paints an old address.
			if (morph && next !== morph.to) morph = null;
		});
	});

	$effect(() => {
		if (checked === value) return;
		const target = value;
		const timer = setTimeout(() => (checked = target), typingPause);
		return () => clearTimeout(timer);
	});

	const suggestion = $derived(
		checked === value && !dismissed.includes(value.toLowerCase())
			? suggestEmail(value.trim(), domains)
			: null
	);
	const fix = $derived(suggestion ? changedRange(value.trim(), suggestion) : ([0, 0] as const));

	function setValue(next: string) {
		value = next;
		onValueChange?.(next);
	}

	async function accept() {
		if (!suggestion) return;
		const input = ref;
		const from = value.trim();
		const to = suggestion;
		// Morph only when the whole address is visible; a scrolled field would
		// put the overlay's letters in the wrong place.
		const fits = input ? input.scrollWidth <= input.clientWidth : false;
		const range: [number, number] = [fix[0], fix[1]];
		setValue(to);
		checked = to;
		previous = to;
		clearTimeout(morphTimer);
		clearTimeout(landTimer);
		cancelAnimationFrame(frame);
		if (fits && !prefersReducedMotion()) {
			// First the overlay paints the old text exactly over the field's,
			// then the letters move.
			morph = { from, to, stage: 0, range };
			moving = true;
			const changed = morphPlan(from, to).after.filter((glyph) => glyph.kind !== 'keep').length;
			frame = requestAnimationFrame(() => {
				frame = requestAnimationFrame(() => {
					if (morph) morph = { ...morph, stage: 1 };
					// Once the last letter lands the caret returns, while the
					// underline lingers and fades on its own.
					landTimer = setTimeout(
						() => (moving = false),
						springs.snappy.duration + Math.max(0, changed - 1) * letterStagger
					);
				});
			});
			morphTimer = setTimeout(() => (morph = null), morphSpan);
		}
		await tick();
		input?.focus();
		input?.setSelectionRange(to.length, to.length);
	}

	function dismiss() {
		dismissed = [...dismissed, value.toLowerCase()];
		ref?.focus();
	}

	const glyphs = $derived.by(() => {
		if (!morph) return [] as (Glyph & { order: number })[];
		const plan = morphPlan(morph.from, morph.to);
		let changed = 0;
		return (morph.stage === 0 ? plan.before : plan.after).map((glyph) => ({
			...glyph,
			order: glyph.kind === 'keep' ? 0 : changed++
		}));
	});

	/** Kept letters hold still; a letter that only changed places hops over its neighbour. */
	function glide(
		_node: Element,
		{ from, to }: { from: DOMRect; to: DOMRect },
		{ kind }: { kind: Glyph['kind'] }
	) {
		const dx = from.left - to.left;
		if (!dx) return { duration: 0 };
		const { duration, easing } = springs.snappy;
		return {
			duration,
			css: (t: number) => {
				const shift = (1 - easing(t)) * dx;
				const hop = kind === 'move' ? -0.4 * Math.sin(Math.PI * easeInOut(t)) : 0;
				return `translate: ${shift}px ${hop}em`;
			}
		};
	}

	/** A new letter flips down into place, one after another. */
	function flipIn(_node: Element, { order }: { order: number }): TransitionConfig {
		const { duration, easing } = springs.snappy;
		return {
			delay: order * letterStagger,
			duration,
			css: (t) => {
				const u = 1 - easing(t);
				return `opacity: ${easeOut(t)}; transform: perspective(120px) rotateX(${-90 * u}deg); translate: 0 ${30 * u}%`;
			}
		};
	}

	/** A wrong letter flips up and away, faster than the new ones arrive. */
	function flipOut(_node: Element): TransitionConfig {
		return {
			duration: durations.fast,
			easing: easeIn,
			css: (t, u) =>
				`opacity: ${t}; transform: perspective(120px) rotateX(${90 * u}deg); translate: 0 ${-30 * u}%`
		};
	}

	/** The note swaps in from a soft blur; leaving, it simply fades. */
	function noteIn(_node: Element): TransitionConfig {
		if (prefersReducedMotion()) return { duration: durations.fast, css: (t) => `opacity: ${t}` };
		return {
			duration: durations.base,
			easing: easeOut,
			css: (t, u) => `opacity: ${t}; translate: 0 ${-4 * u}px; filter: blur(${4 * u}px)`
		};
	}

	function noteOut(_node: Element): TransitionConfig {
		return { duration: durations.instant, easing: easeIn, css: (t) => `opacity: ${t}` };
	}

	$effect(() => () => {
		clearTimeout(morphTimer);
		clearTimeout(landTimer);
		cancelAnimationFrame(frame);
	});

	const open = $derived(!!hint || !!suggestion);
	// Kerning and ligatures off, in the field and the overlay alike, so letters
	// set one span at a time land exactly where the field draws them.
	const type = 'text-base [font-kerning:none] [font-variant-ligatures:none] sm:text-sm';
</script>

<div class={cn('flex w-full flex-col', className)}>
	<div class="relative">
		<!-- Text, not email: email inputs refuse setSelectionRange, and the caret
		     has to land at the end after a fix. -->
		<input
			{...restProps}
			bind:this={ref}
			bind:value
			id={inputId}
			type="text"
			inputmode="email"
			autocomplete={restProps.autocomplete ?? 'email'}
			autocapitalize="none"
			spellcheck={false}
			{placeholder}
			aria-invalid={invalid || restProps['aria-invalid'] || undefined}
			aria-describedby={[restProps['aria-describedby'], open && noteId].filter(Boolean).join(' ') ||
				undefined}
			oninput={(event) => {
				morph = null;
				onValueChange?.(event.currentTarget.value);
				restProps.oninput?.(event);
			}}
			onblur={(event) => {
				checked = value;
				restProps.onblur?.(event);
			}}
			class={cn(
				'bg-control text-foreground placeholder:text-muted-foreground focus-visible:ring-ring aria-invalid:ring-destructive flex h-10 w-full rounded-full px-4 transition-[box-shadow] duration-(--duration-base) outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-2',
				type,
				morph && 'text-transparent',
				morph && moving && 'caret-transparent'
			)}
		/>
		{#if morph}
			<span
				aria-hidden="true"
				class={cn(
					'text-foreground pointer-events-none absolute inset-0 flex items-center px-4 whitespace-pre',
					type
				)}
			>
				{#each glyphs as glyph, index (glyph.key)}
					<span
						class="relative inline-block"
						in:flipIn={{ order: glyph.order }}
						out:flipOut
						animate:glide={{ kind: glyph.kind }}
						>{glyph.char}{#if morph.stage === 1 && index >= morph.range[0] && index < morph.range[1]}<!-- The same underline the suggestion used, left under the stretch it fixed, then faded. --><span
								class="email-fixed bg-foreground/40 absolute inset-x-0 -bottom-[3px] h-0.5 rounded-full"
							></span>{/if}</span
					>
				{/each}
			</span>
		{/if}
	</div>

	<!-- Grid rows from 0fr to 1fr give a real height change without measuring. -->
	<div
		id={noteId}
		class={cn(
			'grid transition-[grid-template-rows] ease-out motion-reduce:transition-none',
			open
				? 'grid-rows-[1fr] duration-(--duration-base)'
				: 'grid-rows-[0fr] duration-(--duration-fast)'
		)}
	>
		<div class="min-h-0 overflow-hidden">
			<!-- The hint and the suggestion share one cell, so they cross without shifting. -->
			<div class="grid min-h-10 items-center pt-1">
				{#if hint}
					<p
						class={cn(
							'text-muted-foreground col-start-1 row-start-1 truncate pl-4 text-sm transition-opacity ease-out',
							suggestion
								? 'invisible opacity-0 duration-(--duration-instant)'
								: 'opacity-100 duration-(--duration-base)'
						)}
					>
						{hint}
					</p>
				{/if}
				{#if suggestion}
					<div
						class="col-start-1 row-start-1 flex min-w-0 items-center gap-1"
						in:noteIn
						out:noteOut
					>
						<button
							type="button"
							onclick={accept}
							class="text-muted-foreground hover:bg-foreground/8 focus-visible:ring-ring flex min-h-9 min-w-0 flex-1 items-center rounded-full px-4 py-1.5 text-left text-sm transition-[background-color,scale] duration-(--duration-fast) ease-out outline-none focus-visible:ring-2 active:scale-[0.98]"
						>
							<!-- Wraps on a phone rather than cutting off the one part that matters. -->
							<span class="[overflow-wrap:anywhere]">
								Did you mean <span class="text-foreground"
									>{suggestion.slice(0, fix[0])}<span
										class="decoration-foreground/40 font-semibold underline decoration-2 underline-offset-[3px]"
										>{suggestion.slice(fix[0], fix[1])}</span
									>{suggestion.slice(fix[1])}</span
								>?
							</span>
						</button>
						<button
							type="button"
							aria-label="No, keep {value.trim()}"
							onclick={dismiss}
							class="text-muted-foreground hover:text-foreground hover:bg-foreground/8 focus-visible:ring-ring inline-grid size-9 shrink-0 place-items-center rounded-full transition-[background-color,color,scale] duration-(--duration-fast) ease-out outline-none focus-visible:ring-2 active:scale-[0.92]"
						>
							<X class="size-3.5" aria-hidden="true" />
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
	<span class="sr-only" aria-live="polite">{suggestion ? `Did you mean ${suggestion}?` : ''}</span>
</div>

<style>
	.email-fixed {
		opacity: 0;
		animation: email-fixed calc(var(--duration-deliberate) * 2) var(--ease-out) var(--duration-base);
	}

	@keyframes email-fixed {
		25%,
		60% {
			opacity: 1;
		}
	}
</style>
