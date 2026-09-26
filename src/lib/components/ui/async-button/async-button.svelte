<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { duration as durations, prefersReducedMotion } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Status = 'idle' | 'pending' | 'success' | 'error';

	type Props = Omit<HTMLButtonAttributes, 'children' | 'onclick'> & {
		/**
		 * The work behind the press. While its promise runs the pill shrinks into
		 * a spinner; it resolves into a check, or rejects into a shake and a
		 * retry label.
		 */
		action: () => Promise<unknown> | unknown;
		/** Called with the resolved value after the action succeeds. */
		onSuccess?: (result: unknown) => void;
		/** Called with the reason after the action fails. */
		onError?: (error: unknown) => void;
		/** Shown on the pill after a failure, and becomes the button's name. */
		retryLabel?: string;
		/** Announced while the action runs. */
		pendingLabel?: string;
		/** Announced when the action succeeds. */
		successLabel?: string;
		/** Announced when the action fails. */
		errorLabel?: string;
		/** How long the check shows before the label returns, in milliseconds. */
		timeout?: number;
		/** Colors of the resting pill. Failure always turns it destructive. */
		variant?: 'primary' | 'secondary';
		/** Pill height and label size. The working state is a circle of the same height. */
		size?: 'sm' | 'md' | 'lg';
		/** Blocks pressing. */
		disabled?: boolean;
		/** The button element. */
		ref?: HTMLButtonElement | null;
		/** Classes for the button. */
		class?: string;
		/** The label, such as "Save changes". */
		children: Snippet;
	};

	let {
		action,
		onSuccess,
		onError,
		retryLabel = 'Try again',
		pendingLabel = 'Working',
		successLabel = 'Done',
		errorLabel = "Couldn't finish. Try again.",
		timeout = 1500,
		variant = 'primary',
		size = 'md',
		disabled = false,
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: Props = $props();

	const tones = {
		primary: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover',
		secondary: 'bg-secondary text-secondary-foreground hover:bg-control'
	};
	const sizes = {
		sm: 'h-8 px-4 text-sm [&_svg]:size-4',
		md: 'h-10 px-5 text-sm [&_svg]:size-4',
		lg: 'h-12 px-6 text-base [&_svg]:size-5'
	};

	let status = $state<Status>('idle');
	let resetTimer: ReturnType<typeof setTimeout> | undefined;
	let shake: Animation | undefined;
	let attempt = 0;

	const busy = $derived(status === 'pending' || status === 'success');

	async function run() {
		if (busy || disabled) return;
		const id = ++attempt;
		clearTimeout(resetTimer);
		shake?.cancel();
		status = 'pending';
		try {
			const result = await action();
			if (id !== attempt) return;
			status = 'success';
			resetTimer = setTimeout(() => (status = 'idle'), timeout);
			onSuccess?.(result);
		} catch (error) {
			if (id !== attempt) return;
			status = 'error';
			onError?.(error);
			shakeNo();
		}
	}

	// Swings that die away, like a head shaking no. It waits for the width to
	// mostly open so it shakes the settled shape rather than one still growing.
	function shakeNo() {
		if (!ref || prefersReducedMotion() || typeof ref.animate !== 'function') return;
		const easing = getComputedStyle(ref).getPropertyValue('--ease-in-out').trim() || 'ease-in-out';
		shake = ref.animate(
			[
				{ translate: '0' },
				{ translate: '-6px' },
				{ translate: '5px' },
				{ translate: '-3px' },
				{ translate: '2px' },
				{ translate: '0' }
			],
			{ duration: durations.slow, delay: durations.fast, easing }
		);
	}

	// Width rather than scale, so the label is never squeezed. The pill measures
	// its natural width, pins it, and eases to the new one; once open again it
	// lets go so the label can size it.
	function morph(compact: boolean) {
		const node = ref;
		if (!node) return;
		const from = node.offsetWidth;
		node.style.width = '';
		const to = compact ? node.offsetHeight : node.offsetWidth;
		if (prefersReducedMotion() || from === to) {
			if (compact) node.style.width = `${to}px`;
			return;
		}
		node.style.width = `${from}px`;
		void node.offsetWidth;
		node.style.width = `${to}px`;
	}

	let morphed = false;
	$effect(() => {
		const compact = busy;
		if (!morphed && !compact) return;
		morphed = true;
		morph(compact);
	});

	$effect(() => () => {
		attempt++;
		clearTimeout(resetTimer);
		shake?.cancel();
	});

	// Text leaves quickly, before the closing width can clip it, and arrives
	// over a longer beat as the width opens. Icons spring without overshoot.
	const textShown =
		'opacity-100 blur-none transition-[opacity,filter] duration-(--duration-base) ease-out';
	const textHidden =
		'opacity-0 blur-[4px] transition-[opacity,filter] duration-(--duration-fast) ease-in';
	const iconShown =
		'scale-100 opacity-100 blur-none [transition:scale_var(--duration-spring-snappy)_var(--ease-spring-snappy),opacity_var(--duration-base)_var(--ease-out),filter_var(--duration-base)_var(--ease-out)]';
	const iconHidden =
		'scale-25 opacity-0 blur-[4px] transition-[scale,opacity,filter] duration-(--duration-fast) ease-in';
</script>

<button
	{...restProps}
	bind:this={ref}
	type="button"
	{disabled}
	aria-disabled={busy || undefined}
	aria-busy={status === 'pending' || undefined}
	data-status={status}
	onclick={run}
	ontransitionend={(event) => {
		if (event.currentTarget === event.target && event.propertyName === 'width' && !busy)
			event.currentTarget.style.width = '';
	}}
	class={cn(
		'focus-visible:ring-ring focus-visible:ring-offset-background relative inline-flex max-w-full shrink-0 touch-manipulation items-center justify-center overflow-hidden rounded-full font-medium whitespace-nowrap outline-none select-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
		'[transition:width_var(--duration-spring-snappy)_var(--ease-spring-snappy),scale_var(--duration-fast)_var(--ease-out),background-color_var(--duration-base)_var(--ease-out),color_var(--duration-base)_var(--ease-out)]',
		'active:scale-[0.96] aria-disabled:cursor-default aria-disabled:active:scale-100',
		status === 'error'
			? 'bg-destructive text-destructive-foreground shadow-sm hover:opacity-90'
			: tones[variant],
		sizes[size],
		className
	)}
>
	<!-- Every layer shares one grid cell, so the open width is the widest label.
	     In the circle the cell overflows both sides equally and the pill clips it. -->
	<span class="grid shrink-0 place-items-center">
		<span
			aria-hidden={status === 'error' || undefined}
			class={cn(
				'col-start-1 row-start-1 inline-flex items-center gap-2',
				status === 'idle' ? textShown : textHidden
			)}
		>
			{@render children()}
		</span>
		<span
			aria-hidden={status !== 'error' || undefined}
			class={cn('col-start-1 row-start-1', status === 'error' ? textShown : textHidden)}
		>
			{retryLabel}
		</span>
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2.5"
			stroke-linecap="round"
			aria-hidden="true"
			class={cn(
				'col-start-1 row-start-1',
				status === 'pending' ? cn(iconShown, 'animate-spin') : iconHidden
			)}
		>
			<circle cx="12" cy="12" r="9" class="opacity-25" />
			<path d="M21 12a9 9 0 0 0-9-9" />
		</svg>
		<!-- Heavier than usual: alone in the circle, the check is the whole message. -->
		<Check
			aria-hidden="true"
			stroke-width={2.5}
			class={cn('col-start-1 row-start-1', status === 'success' ? iconShown : iconHidden)}
		/>
	</span>
</button>
<span class="sr-only" aria-live="polite">
	{status === 'pending'
		? pendingLabel
		: status === 'success'
			? successLabel
			: status === 'error'
				? errorLabel
				: ''}
</span>
