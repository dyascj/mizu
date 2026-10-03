<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import type { TransitionConfig } from 'svelte/transition';
	import { flip, type AnimationConfig } from 'svelte/animate';
	import XIcon from '@lucide/svelte/icons/x';
	import {
		duration as durations,
		easeIn,
		pop,
		prefersReducedMotion,
		springs
	} from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> & {
		/** The tags. Bindable. */
		value?: string[];
		/** Shown in the empty field. */
		placeholder?: string;
		/** Blocks adding and removing tags. */
		disabled?: boolean;
		/** Maximum tags, rounded and clamped to the inclusive range 0 to 1000. */
		max?: number;
		/** Form field name. Renders one hidden input per tag. */
		name?: string;
		/** Refuses a tag that is already in the list, and nudges the one already there. */
		dedupe?: boolean;
		/** Return false to refuse a tag. */
		validate?: (tag: string) => boolean;
		/** Classes for the field. */
		class?: string;
		/** Called with the new list after each change. */
		onValueChange?: (value: string[]) => void;
	};

	let {
		value = $bindable([]),
		placeholder,
		disabled = false,
		max,
		name,
		dedupe = true,
		validate,
		class: className,
		onValueChange,
		...rest
	}: Props = $props();

	let draft = $state('');
	let inputEl = $state<HTMLInputElement | null>(null);
	let field = $state<HTMLDivElement | null>(null);
	/**
	 * The key of the tag just typed into the field, if any. It becomes a chip
	 * right where its letters already are: the words stay put and the chip
	 * forms around them, rather than the text vanishing and a chip popping in.
	 */
	let formed = $state<string | null>(null);
	let announcement = $state('');
	// Plain records: bookkeeping for the DOM, never read by the template.
	const chips: Record<string, HTMLElement> = {};
	const nudges: Record<string, Animation> = {};

	const normalizedMax = $derived(
		max == null
			? undefined
			: Math.min(1000, Math.max(0, Math.round(Number.isFinite(max) ? max : 1000)))
	);
	const atMax = $derived(normalizedMax != null && value.length >= normalizedMax);

	/** A stable key per tag, so chips keep their identity as neighbours come and go. */
	function keyAt(tags: string[], index: number) {
		let seen = 0;
		for (let i = 0; i < index; i++) if (tags[i] === tags[index]) seen++;
		return seen ? `${tags[index]}\u0000${seen}` : tags[index];
	}

	function setValue(next: string[]) {
		value = next;
		onValueChange?.(next);
	}

	/** Shakes the chip that already holds `tag`: here already, not an error. */
	function nudge(tag: string) {
		const chip = chips[tag];
		if (!chip?.animate) return;
		nudges[tag]?.cancel();
		const easing = getComputedStyle(chip).getPropertyValue('--ease-out').trim() || 'ease-out';
		nudges[tag] = prefersReducedMotion()
			? chip.animate({ opacity: [1, 0.4, 1] }, { duration: durations.slow })
			: chip.animate(
					{ translate: ['0', '-4px', '4px', '-3px', '2px', '0'] },
					{ duration: durations.slow, easing }
				);
	}

	/**
	 * Adds each part that passes the rules and returns the parts refused for
	 * something other than being a duplicate, so they can go back in the field.
	 * `typed` marks a single tag that was just typed, which forms in place.
	 */
	function addTags(parts: string[], typed = false) {
		if (disabled) return parts;
		const next = [...value];
		const added: string[] = [];
		const refused: string[] = [];
		for (const part of parts) {
			const tag = part.trim();
			if (!tag) continue;
			if (dedupe && next.includes(tag)) {
				nudge(tag);
				announcement = `${tag} is already added`;
				continue;
			}
			if ((normalizedMax != null && next.length >= normalizedMax) || (validate && !validate(tag))) {
				refused.push(tag);
				continue;
			}
			next.push(tag);
			added.push(tag);
		}
		if (added.length) {
			formed = typed && added.length === 1 ? keyAt(next, next.length - 1) : null;
			setValue(next);
			announcement = `Added ${added.join(', ')}`;
		}
		return refused;
	}

	function removeAt(index: number) {
		if (disabled) return;
		const tag = value[index];
		setValue(value.filter((_, i) => i !== index));
		announcement = `Removed ${tag}`;
	}

	function commitDraft() {
		if (!draft.trim()) return;
		const before = value.length;
		addTags([draft], true);
		if (value.length > before) draft = '';
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.isComposing) return;
		if (e.key === 'Enter' || e.key === ',') {
			e.preventDefault();
			commitDraft();
		} else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
			e.preventDefault();
			removeAt(value.length - 1);
		}
	}

	function oninput(e: Event & { currentTarget: HTMLInputElement }) {
		// Mobile keyboards often type a comma without a keydown for it.
		const text = e.currentTarget.value;
		if (!text.includes(',')) return;
		const parts = text.split(',');
		const rest = parts.pop() ?? '';
		const refused = addTags(parts, parts.length === 1);
		draft = [...refused, rest].filter(Boolean).join(', ');
	}

	function onpaste(e: ClipboardEvent & { currentTarget: HTMLInputElement }) {
		const text = e.clipboardData?.getData('text') ?? '';
		if (!/[,\n]/.test(text)) return;
		e.preventDefault();
		// The paste lands where a native one would: at the caret, over any selection.
		const input = e.currentTarget;
		const start = input.selectionStart ?? draft.length;
		const end = input.selectionEnd ?? start;
		const combined = draft.slice(0, start) + text + draft.slice(end);
		// Most chips from a pasted list land away from the caret, so they pop in.
		draft = addTags(combined.split(/[,\n]/)).join(', ');
	}

	/** Chips from anywhere but the field's own typing pop in; a typed one is already there. */
	function chipIn(node: Element, { key }: { key: string }): TransitionConfig {
		if (key === formed) return { duration: 0 };
		return pop(node, { scale: 0.9 });
	}

	/** Leaving is quicker than arriving, so a removal never holds the eye. */
	function chipOut(node: HTMLElement): TransitionConfig {
		// Svelte pins a leaving chip where it was on the page; keep it where it
		// was in the field instead, in case the field itself moved.
		const shift = fieldShift();
		if (shift.x || shift.y) node.style.translate = `${shift.x}px ${shift.y}px`;
		if (prefersReducedMotion()) return { duration: durations.fast, css: (t) => `opacity: ${t}` };
		return {
			duration: durations.fast,
			easing: easeIn,
			css: (t, u) => `opacity: ${t}; scale: ${1 - 0.1 * u}; filter: blur(${2 * u}px)`
		};
	}

	/**
	 * The row closes up without a bounce, so it reads as settled. Measured
	 * against the field, so a field that moves on the page as it grows or
	 * shrinks never drags its chips along.
	 */
	function slide(node: Element, { from, to }: { from: DOMRect; to: DOMRect }): AnimationConfig {
		if (prefersReducedMotion()) return { duration: 0 };
		const shift = fieldShift();
		const start = new DOMRect(from.x + shift.x, from.y + shift.y, from.width, from.height);
		return flip(node, { from: start, to }, springs.snappy);
	}

	/** How far the field itself moved on the page during the last update. */
	function fieldShift() {
		const now = field?.getBoundingClientRect();
		if (!boxFrom || !now) return { x: 0, y: 0 };
		return { x: now.left - boxFrom.left, y: now.top - boxFrom.top };
	}

	function register(key: string) {
		return (node: HTMLElement) => {
			chips[key] = node;
			return () => {
				if (chips[key] === node) delete chips[key];
			};
		};
	}

	// The field slides along with the chips instead of jumping to its new spot.
	let fieldFrom: DOMRect | null = null;
	let boxFrom: DOMRect | null = null;
	let fieldSlide: Animation | undefined;
	$effect.pre(() => {
		void value.length;
		fieldFrom = inputEl?.getBoundingClientRect() ?? null;
		boxFrom = field?.getBoundingClientRect() ?? null;
	});
	$effect(() => {
		void value.length;
		const from = fieldFrom;
		fieldFrom = null;
		if (!from || !inputEl?.animate || prefersReducedMotion()) return;
		const to = inputEl.getBoundingClientRect();
		const shift = fieldShift();
		const dx = from.left + shift.x - to.left;
		const dy = from.top + shift.y - to.top;
		if (!dx && !dy) return;
		fieldSlide?.cancel();
		const easing =
			getComputedStyle(inputEl).getPropertyValue('--ease-spring-snappy').trim() || 'ease-out';
		fieldSlide = inputEl.animate(
			{ translate: [`${dx}px ${dy}px`, '0 0'] },
			{ duration: springs.snappy.duration, easing }
		);
	});

	$effect(() => () => {
		fieldSlide?.cancel();
		for (const animation of Object.values(nudges)) animation.cancel();
	});
</script>

<div
	bind:this={field}
	class={cn(
		'bg-control focus-within:ring-ring relative flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-2xl p-1.5 text-sm transition-[box-shadow,border-color] duration-(--duration-base) outline-none focus-within:ring-2',
		!placeholder && !value.length && !draft && 'ring-input ring-1',
		disabled && 'cursor-not-allowed opacity-50',
		className
	)}
	onmousedown={(e) => {
		if (e.target === e.currentTarget) inputEl?.focus();
	}}
	{...rest}
>
	<ul class="contents">
		{#each value as tag, i (keyAt(value, i))}
			{@const key = keyAt(value, i)}
			{@const forming = key === formed}
			<li
				{@attach register(key)}
				data-forming={forming || undefined}
				class="relative inline-flex min-h-7 max-w-full items-center gap-1 rounded-full ps-2.5 pe-1"
				in:chipIn={{ key }}
				out:chipOut
				animate:slide
			>
				<!-- The chip's body, separate from its text, so a freshly typed tag can
				     grow a chip around words that never move. -->
				<span
					aria-hidden="true"
					class={cn('bg-primary absolute inset-0 rounded-full shadow-xs', forming && 'chip-body')}
				></span>
				<span
					class={cn(
						'text-primary-foreground relative min-w-0 text-base break-all sm:text-sm',
						forming && 'chip-ink'
					)}>{tag}</span
				>
				<button
					type="button"
					{disabled}
					onpointerdown={(e) => {
						// Keeps focus in the field, so typing carries straight on.
						if (e.pointerType === 'mouse') e.preventDefault();
					}}
					onclick={() => {
						removeAt(i);
						inputEl?.focus();
					}}
					class={cn(
						'text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/20 focus-visible:ring-primary-foreground/70 relative inline-grid size-6 shrink-0 place-items-center rounded-full transition-[background-color,color,scale] duration-(--duration-fast) ease-out outline-none focus-visible:ring-2 active:scale-[0.92] disabled:pointer-events-none',
						forming && 'chip-remove'
					)}
				>
					<XIcon class="size-3" />
					<span class="sr-only">Remove {tag}</span>
				</button>
			</li>
		{/each}
	</ul>

	<!-- Padded like a chip's text, so a typed tag becomes a chip without its
	     letters shifting. -->
	<input
		bind:this={inputEl}
		bind:value={draft}
		type="text"
		{disabled}
		placeholder={atMax ? undefined : placeholder}
		aria-label="Add a tag"
		readonly={atMax}
		autocomplete="off"
		enterkeyhint="enter"
		{onkeydown}
		{oninput}
		{onpaste}
		onblur={commitDraft}
		class="text-foreground placeholder:text-muted-foreground h-7 min-w-0 flex-1 basis-24 bg-transparent px-2.5 text-base outline-none disabled:cursor-not-allowed sm:text-sm"
	/>

	{#if name}
		{#each value as tag, i (tag + i)}
			<input type="hidden" {name} value={tag} />
		{/each}
	{/if}
</div>
<span class="sr-only" aria-live="polite">{announcement}</span>

<style>
	/* The body grows in around the letters; the ink turns as it lands; the
	   remove button arrives a beat later as the last piece of the chip. */
	.chip-body {
		animation:
			chip-grow var(--duration-spring) var(--ease-spring) both,
			chip-fade var(--duration-fast) var(--ease-out) both;
	}
	.chip-ink {
		animation: chip-ink var(--duration-fast) var(--ease-out) both;
	}
	.chip-remove {
		animation:
			chip-remove var(--duration-spring-snappy) var(--ease-spring-snappy) var(--stagger) both,
			chip-reveal var(--duration-fast) var(--ease-out) var(--stagger) both;
	}

	@keyframes chip-grow {
		from {
			scale: 0.9;
		}
	}
	@keyframes chip-fade {
		from {
			opacity: 0;
		}
	}
	@keyframes chip-ink {
		from {
			color: var(--foreground);
		}
	}
	@keyframes chip-remove {
		from {
			scale: 0.25;
		}
	}
	@keyframes chip-reveal {
		from {
			opacity: 0;
			filter: blur(4px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.chip-body,
		.chip-remove {
			animation: chip-fade var(--duration-fast) var(--ease-out) both;
		}
	}
</style>
