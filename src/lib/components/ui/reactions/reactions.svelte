<script lang="ts" module>
	export type Reaction = {
		/** The emoji itself. It is the reaction's identity. */
		emoji: string;
		/** How many people reacted with it, including the reader. */
		count: number;
		/** Whether the reader is one of them. */
		mine: boolean;
	};

	export type ReactionChoice = {
		/** The emoji offered in the picker. */
		emoji: string;
		/** Its spoken name, such as "thumbs up". */
		label: string;
	};
</script>

<script lang="ts">
	import SmilePlus from '@lucide/svelte/icons/smile-plus';
	import { tick } from 'svelte';
	import { flip } from 'svelte/animate';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { TransitionConfig } from 'svelte/transition';
	import {
		duration,
		easeIn,
		easeOut,
		prefersReducedMotion,
		springs
	} from '$lib/components/ui/motion';
	import { NumberTicker } from '$lib/components/ui/number-ticker';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** The reactions on the message, in the order they were first added. Bindable. */
		reactions?: Reaction[];
		/** What the picker offers, with a spoken name for each. */
		choices: ReactionChoice[];
		/** Called after the reader adds or takes back a reaction. */
		onReact?: (emoji: string, mine: boolean) => void;
		/** Whether the picker is open. Bindable. */
		open?: boolean;
		/** Accessible name of the button that opens the picker. */
		label?: string;
		/** The row. */
		ref?: HTMLDivElement | null;
		/** Classes for the row. */
		class?: string;
	};

	let {
		reactions = $bindable([]),
		choices,
		onReact,
		open = $bindable(false),
		label = 'Add reaction',
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	const uid = $props.id();
	const pickerId = `${uid}-picker`;

	let add = $state<HTMLButtonElement | null>(null);
	let picker = $state<HTMLDivElement | null>(null);
	let origin = $state(0);
	let usingKeys = false;

	const names = $derived(new Map(choices.map((choice) => [choice.emoji, choice.label])));
	const nameOf = (emoji: string) => names.get(emoji) ?? emoji;

	/** Pills and the add button share one keyed list, so the button glides aside too. */
	const items = $derived([
		...reactions.map((reaction) => ({ key: reaction.emoji, reaction })),
		{ key: '', reaction: null }
	]);

	function toggle(emoji: string) {
		const found = reactions.find((r) => r.emoji === emoji);
		const mine = !found?.mine;
		reactions = found
			? reactions
					.map((r) => (r.emoji === emoji ? { ...r, mine, count: r.count + (mine ? 1 : -1) } : r))
					.filter((r) => r.count > 0)
			: [...reactions, { emoji, count: 1, mine: true }];
		onReact?.(emoji, mine);
	}

	/**
	 * The emoji glyph inside the pill for `emoji`. Matched by value rather than
	 * by a selector, which some emoji sequences do not survive.
	 */
	const glyphFor = (emoji: string) =>
		Array.from(ref?.querySelectorAll<HTMLElement>('[data-reaction]') ?? []).find(
			(node) => node.dataset.reaction === emoji
		);

	/**
	 * Toggles from a pill. When that empties the pill it folds away, so focus
	 * moves to the pill that takes its place, the one before it, or the add
	 * button, rather than falling back to the page.
	 */
	async function takeBack(emoji: string, source: HTMLButtonElement) {
		const index = reactions.findIndex((r) => r.emoji === emoji);
		const hadFocus = document.activeElement === source;
		toggle(emoji);
		if (!hadFocus || reactions.some((r) => r.emoji === emoji)) return;
		await tick();
		const neighbour = reactions[index] ?? reactions[index - 1];
		(neighbour ? glyphFor(neighbour.emoji)?.closest('button') : add)?.focus();
	}

	/**
	 * Picking flies the emoji from the picker into its pill. Picking one the
	 * reader already added takes it back, as tapping its pill would.
	 */
	async function pick(emoji: string, source: HTMLElement) {
		const from = source.getBoundingClientRect();
		setOpen(false, true);
		toggle(emoji);
		await tick();
		const target = glyphFor(emoji);
		if (!target?.animate || prefersReducedMotion()) return;
		const to = target.getBoundingClientRect();
		if (!to.width) return;
		const easing =
			getComputedStyle(target).getPropertyValue('--ease-spring-bouncy').trim() || 'ease-out';
		target.animate(
			[
				{
					translate: `${from.left + from.width / 2 - (to.left + to.width / 2)}px ${from.top + from.height / 2 - (to.top + to.height / 2)}px`,
					scale: from.height / to.height,
					easing
				},
				{ translate: '0 0', scale: 1 }
			],
			{ duration: springs.bouncy.duration }
		);
	}

	async function setOpen(next: boolean, restoreFocus = false) {
		if (next === open) return;
		if (next && add) origin = add.offsetLeft + add.offsetWidth / 2;
		open = next;
		await tick();
		if (next && usingKeys) picker?.querySelector<HTMLButtonElement>('button')?.focus();
		if (!next && restoreFocus && ref?.contains(document.activeElement)) add?.focus();
	}

	function onPickerKeydown(event: KeyboardEvent) {
		const buttons = Array.from(picker?.querySelectorAll<HTMLButtonElement>('button') ?? []);
		const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
		const moves: Record<string, number> = {
			ArrowRight: index + 1,
			ArrowDown: index + 1,
			ArrowLeft: index - 1,
			ArrowUp: index - 1,
			Home: 0,
			End: buttons.length - 1
		};
		if (!(event.key in moves)) return;
		event.preventDefault();
		buttons[(moves[event.key] + buttons.length) % buttons.length]?.focus();
	}

	// Closes on Escape, a press anywhere else, or focus leaving the row.
	$effect(() => {
		if (!open) return;
		const onpointerdown = (event: PointerEvent) => {
			if (!ref?.contains(event.target as Node)) setOpen(false);
		};
		const onkeydown = (event: KeyboardEvent) => {
			if (event.key !== 'Escape') return;
			event.preventDefault();
			setOpen(false);
			add?.focus();
		};
		document.addEventListener('pointerdown', onpointerdown);
		document.addEventListener('keydown', onkeydown);
		return () => {
			document.removeEventListener('pointerdown', onpointerdown);
			document.removeEventListener('keydown', onkeydown);
		};
	});

	/** A new pill opens where it lands; an emptied one folds away faster. */
	function pill(_node: Element, { exit = false } = {}): TransitionConfig {
		if (prefersReducedMotion()) return { duration: duration.fast, css: (t) => `opacity: ${t}` };
		if (exit) {
			return {
				duration: duration.fast,
				easing: easeIn,
				css: (t, u) => `opacity: ${t}; scale: ${0.6 + 0.4 * t}; filter: blur(${u * 4}px)`
			};
		}
		const { duration: settle, easing } = springs.smooth;
		return {
			duration: settle,
			css: (t, u) =>
				`opacity: ${easeOut(Math.min(1, t * 1.6))}; scale: ${0.6 + 0.4 * easing(t)}; filter: blur(${u * 4}px)`
		};
	}

	/** Opens just below the row and grows from the button that asked for it. */
	function unfold(_node: Element, { exit = false } = {}): TransitionConfig {
		if (prefersReducedMotion()) return { duration: duration.fast, css: (t) => `opacity: ${t}` };
		return {
			duration: exit ? duration.fast : duration.base,
			easing: exit ? easeIn : easeOut,
			css: (t, u) =>
				`opacity: ${t}; scale: ${exit ? 0.95 + 0.05 * t : 0.9 + 0.1 * t}; translate: 0 ${u * (exit ? -2 : -4)}px; filter: blur(${u * (exit ? 2 : 4)}px)`
		};
	}

	const layout = { duration: springs.smooth.duration, easing: springs.smooth.easing };
</script>

<div
	{...restProps}
	bind:this={ref}
	class={cn('relative flex flex-wrap items-center gap-1.5', className)}
	onpointerdowncapture={() => (usingKeys = false)}
	onkeydowncapture={() => (usingKeys = true)}
	onfocusout={(event) => {
		if (open && !ref?.contains(event.relatedTarget as Node | null)) setOpen(false);
	}}
>
	{#each items as { key, reaction } (key)}
		<div class="flex" animate:flip={layout} in:pill out:pill={{ exit: true }}>
			{#if reaction}
				<button
					type="button"
					aria-pressed={reaction.mine}
					aria-label="{nameOf(reaction.emoji)}, {reaction.count} {reaction.count === 1
						? 'person'
						: 'people'}{reaction.mine ? ', including you' : ''}"
					class={cn(
						'focus-visible:ring-ring focus-visible:ring-offset-background flex h-8 touch-manipulation items-center gap-1.5 rounded-full px-2.5 text-[0.8125rem] font-medium outline-none select-none focus-visible:ring-2 focus-visible:ring-offset-2',
						'transition-[background-color,color,scale] duration-(--duration-fast) ease-out active:scale-[0.96] motion-reduce:transition-[background-color,color]',
						reaction.mine
							? 'bg-primary-muted text-primary'
							: 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-control'
					)}
					onclick={(event) => takeBack(reaction.emoji, event.currentTarget)}
				>
					<span
						data-reaction={reaction.emoji}
						aria-hidden="true"
						class="text-[0.9375rem] leading-none"
					>
						{reaction.emoji}
					</span>
					<span aria-hidden="true">
						<NumberTicker value={reaction.count} />
					</span>
				</button>
			{:else}
				<button
					bind:this={add}
					type="button"
					aria-label={label}
					aria-expanded={open}
					aria-controls={open ? pickerId : undefined}
					class={cn(
						'text-muted-foreground hover:text-foreground focus-visible:ring-ring focus-visible:ring-offset-background hover:bg-secondary grid h-8 w-9 touch-manipulation place-items-center rounded-full outline-none select-none focus-visible:ring-2 focus-visible:ring-offset-2',
						'transition-[background-color,color,scale] duration-(--duration-fast) ease-out active:scale-[0.96] motion-reduce:transition-[background-color,color]',
						open && 'bg-secondary text-foreground'
					)}
					onclick={() => setOpen(!open)}
				>
					<SmilePlus aria-hidden="true" class="size-4" />
				</button>
			{/if}
		</div>
	{/each}

	{#if open}
		<!-- Below the row, in the clear rather than over the message, and aligned
		     to the row so it never runs off a narrow card. -->
		<div
			bind:this={picker}
			id={pickerId}
			role="group"
			aria-label="Pick a reaction"
			class="bg-popover text-popover-foreground absolute top-full left-0 z-10 mt-2 flex max-w-[calc(100vw-2rem)] flex-wrap gap-0.5 rounded-3xl p-1 shadow-lg"
			style:transform-origin="{origin}px 0%"
			in:unfold
			out:unfold={{ exit: true }}
		>
			{#each choices as choice (choice.emoji)}
				<button
					type="button"
					aria-label="React with {choice.label}"
					aria-pressed={reactions.some((r) => r.emoji === choice.emoji && r.mine)}
					class="hover:bg-secondary focus-visible:ring-ring aria-pressed:bg-primary-muted grid size-9 place-items-center rounded-full transition-[background-color,scale] duration-(--duration-fast) ease-out outline-none focus-visible:ring-2 focus-visible:ring-inset active:scale-90 motion-reduce:transition-[background-color]"
					onkeydown={onPickerKeydown}
					onclick={(event) =>
						pick(choice.emoji, event.currentTarget.firstElementChild as HTMLElement)}
				>
					<span aria-hidden="true" class="text-[1.1875rem] leading-none">{choice.emoji}</span>
				</button>
			{/each}
		</div>
	{/if}
</div>
