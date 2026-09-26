<script lang="ts">
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import X from '@lucide/svelte/icons/x';
	import { tick } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { TransitionConfig } from 'svelte/transition';
	import {
		duration as durations,
		easeIn,
		easeOut,
		prefersReducedMotion,
		springs
	} from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Step = 'ask' | 'why' | 'done';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** The question on the pill. */
		question?: string;
		/** Placeholder and accessible name for the comment field that opens on "No". */
		placeholder?: string;
		/**
		 * Called when the reader answers: `true` right away for "Yes", or `false`
		 * with what was missing once they send a comment.
		 */
		onAnswer?: (helpful: boolean, note?: string) => void;
		/** Called when the reader takes their answer back with Undo. */
		onUndo?: () => void;
		/** Longest comment the field accepts, in characters. */
		maxLength?: number;
		/** Classes for the pill. */
		class?: string;
		/** The pill element. */
		ref?: HTMLDivElement | null;
	};

	let {
		question = 'Was this helpful?',
		placeholder = 'What was missing?',
		onAnswer,
		onUndo,
		maxLength = 200,
		class: className,
		ref = $bindable(null),
		...restProps
	}: Props = $props();

	const uid = $props.id();

	let step = $state<Step>('ask');
	let helpful = $state(true);
	let note = $state('');

	let yesButton = $state<HTMLButtonElement | null>(null);
	let noteInput = $state<HTMLInputElement | null>(null);
	let undoButton = $state<HTMLButtonElement | null>(null);

	// Focus follows the step only after someone acted, never on load. Saying no
	// always drops you into the field; the other steps take focus for keyboard
	// users only, so a mouse click never leaves a ring behind.
	let usingKeys = false;

	let settle: ReturnType<typeof setTimeout> | undefined;

	async function go(next: Step) {
		const moveFocus = next === 'why' || usingKeys;
		const pill = ref;
		const from = pill?.getBoundingClientRect().width;
		step = next;
		await tick();
		if (pill && from !== undefined) reshape(pill, from);
		if (!moveFocus) return;
		if (next === 'why') noteInput?.focus();
		else if (next === 'done') undoButton?.focus();
		else yesButton?.focus();
	}

	/**
	 * The pill reshapes around each step on a spring. The new step is laid out
	 * at its final width from the start and the pill grows or shrinks to meet
	 * it, clipping whatever has not been reached yet, so text never reflows
	 * mid-flight.
	 */
	function reshape(pill: HTMLElement, from: number) {
		const content = pill.querySelector<HTMLElement>('[data-content]:not([data-leaving])');
		clearTimeout(settle);
		pill.style.transition = 'none';
		pill.style.width = '';
		if (content) content.style.minWidth = '';
		const to = pill.getBoundingClientRect().width;
		pill.style.transition = '';
		if (prefersReducedMotion() || Math.abs(to - from) < 0.5) return;
		if (content) content.style.minWidth = `${to}px`;
		pill.style.transition = 'none';
		pill.style.width = `${from}px`;
		void pill.offsetWidth;
		pill.style.transition = '';
		pill.style.width = `${to}px`;
		settle = setTimeout(() => {
			pill.style.width = '';
			if (content) content.style.minWidth = '';
		}, springs.smooth.duration);
	}

	$effect(() => () => clearTimeout(settle));

	function answerYes() {
		helpful = true;
		go('done');
		onAnswer?.(true);
	}

	function send(event: SubmitEvent) {
		event.preventDefault();
		const text = note.trim();
		if (!text) return;
		helpful = false;
		go('done');
		onAnswer?.(false, text);
	}

	function undo() {
		note = '';
		go('ask');
		onUndo?.();
	}

	/** Each step resolves from a soft blur, a touch smaller. */
	function enter(_node: Element): TransitionConfig {
		if (prefersReducedMotion()) return { duration: durations.fast, css: (t) => `opacity: ${t}` };
		return {
			duration: durations.base,
			easing: easeOut,
			css: (t, u) => `opacity: ${t}; filter: blur(${u * 4}px); scale: ${1 - u * 0.02}`
		};
	}

	/**
	 * The old step lifts out of the flow where it stands, so the pill starts
	 * reshaping around the new one at once while the old one fades beneath.
	 */
	function leave(node: Element): TransitionConfig {
		const element = node as HTMLElement;
		element.dataset.leaving = '';
		element.style.position = 'absolute';
		element.style.left = '0';
		element.style.top = '0';
		element.style.pointerEvents = 'none';
		if (prefersReducedMotion()) return { duration: durations.instant, css: (t) => `opacity: ${t}` };
		return {
			duration: durations.instant,
			easing: easeIn,
			css: (t, u) => `opacity: ${t}; filter: blur(${u * 4}px); scale: ${1 - u * 0.02}`
		};
	}

	const control =
		'focus-visible:ring-ring inline-flex h-9 shrink-0 touch-manipulation items-center justify-center rounded-full outline-none select-none transition-[background-color,color,scale,opacity] duration-(--duration-fast) ease-out focus-visible:ring-2 active:scale-[0.96] disabled:pointer-events-none';
</script>

<div
	{...restProps}
	bind:this={ref}
	role="group"
	aria-label={restProps['aria-label'] ?? 'Response feedback'}
	data-step={step}
	class={cn(
		'bg-card relative inline-flex h-12 max-w-full items-center overflow-hidden rounded-full shadow-sm transition-[width] duration-(--duration-spring) ease-(--ease-spring) motion-reduce:transition-none',
		className
	)}
	onpointerdowncapture={() => (usingKeys = false)}
	onkeydowncapture={() => (usingKeys = true)}
>
	{#key step}
		<div data-content class="flex h-12 max-w-full min-w-0 items-center" in:enter out:leave>
			{#if step === 'ask'}
				<div class="flex min-w-0 items-center gap-1 pr-1.5 pl-5">
					<span class="text-foreground mr-2 line-clamp-2 min-w-0 text-sm leading-tight"
						>{question}</span
					>
					<button
						bind:this={yesButton}
						type="button"
						class={cn(
							control,
							'bg-secondary text-secondary-foreground hover:bg-control px-4 text-sm font-medium'
						)}
						onclick={answerYes}
					>
						Yes
					</button>
					<button
						type="button"
						class={cn(
							control,
							'bg-secondary text-secondary-foreground hover:bg-control px-4 text-sm font-medium'
						)}
						onclick={() => go('why')}
					>
						No
					</button>
				</div>
			{:else if step === 'why'}
				<form class="flex min-w-0 items-center gap-1 pr-1.5 pl-5" onsubmit={send}>
					<label for="{uid}-note" class="sr-only">{placeholder}</label>
					<input
						bind:this={noteInput}
						bind:value={note}
						id="{uid}-note"
						{placeholder}
						autocomplete="off"
						maxlength={maxLength}
						onkeydown={(event) => {
							if (event.key === 'Escape') {
								event.preventDefault();
								go('ask');
							}
						}}
						class="text-foreground placeholder:text-muted-foreground h-9 w-[min(14rem,48vw)] min-w-0 bg-transparent text-base outline-none sm:text-sm"
					/>
					<button
						type="button"
						aria-label="Cancel"
						class={cn(
							control,
							'text-muted-foreground hover:text-foreground hover:bg-secondary size-9 [&_svg]:size-4'
						)}
						onclick={() => go('ask')}
					>
						<X aria-hidden="true" />
					</button>
					<button
						type="submit"
						aria-label="Send feedback"
						disabled={!note.trim()}
						class={cn(
							control,
							'bg-primary text-primary-foreground hover:bg-primary-hover size-9 disabled:opacity-30 [&_svg]:size-4'
						)}
					>
						<ArrowUp aria-hidden="true" />
					</button>
				</form>
			{:else}
				<div class="flex min-w-0 items-center gap-2 pr-1.5 pl-4">
					<svg
						viewBox="0 0 16 16"
						fill="none"
						aria-hidden="true"
						class="text-foreground size-4 shrink-0"
					>
						<path
							d="M3.5 8.5 6.5 11.5 12.5 4.5"
							pathLength="1"
							stroke="currentColor"
							stroke-width="1.8"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="feedback-check"
						/>
					</svg>
					<span class="text-foreground min-w-0 truncate text-sm">
						{helpful ? 'Thanks, glad it helped' : 'Thanks, noted'}
					</span>
					<button
						bind:this={undoButton}
						type="button"
						class={cn(
							control,
							'text-muted-foreground hover:text-foreground hover:bg-secondary ml-1 px-3 text-sm'
						)}
						onclick={undo}
					>
						Undo
					</button>
				</div>
			{/if}
		</div>
	{/key}
	<span class="sr-only" aria-live="polite">{step === 'done' ? 'Thanks for your feedback' : ''}</span
	>
</div>

<style>
	/* The check draws itself in once the pill has started to settle. */
	.feedback-check {
		stroke-dasharray: 1;
		stroke-dashoffset: 0;
		animation: feedback-check-draw var(--duration-slow) var(--ease-out) var(--duration-instant) both;
	}

	@keyframes feedback-check-draw {
		from {
			stroke-dashoffset: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.feedback-check {
			animation: none;
		}
	}
</style>
