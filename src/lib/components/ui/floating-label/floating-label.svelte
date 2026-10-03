<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { stagger } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLInputAttributes, 'value' | 'children' | 'class' | 'placeholder'> & {
		/** The label. It sits in the field like a placeholder and lifts out of the way letter by letter. */
		label: string;
		/** The value. Bindable. */
		value?: string;
		/** Text field types that suit a floating label. */
		type?: 'text' | 'email' | 'tel' | 'url' | 'search';
		/**
		 * Returns an error message, or null when the value is fine. It first runs
		 * when the field is left, then on every keystroke once an error has
		 * shown, so nobody is scolded for a half-typed value. A value that passes
		 * gets a check.
		 */
		validate?: (value: string) => string | null;
		/** An error from outside, such as the server. Shows until it changes. */
		error?: string | null;
		/** Called with every edit. */
		onValueChange?: (value: string) => void;
		/** The input element. */
		ref?: HTMLInputElement | null;
		/** Classes for the wrapper around the field and its message. */
		class?: string;
	};

	let {
		label,
		value = $bindable(''),
		type = 'text',
		validate,
		error = null,
		onValueChange,
		ref = $bindable(null),
		id,
		class: className,
		...restProps
	}: Props = $props();

	const uid = $props.id();
	const inputId = $derived(id ?? `${uid}-input`);
	const errorId = `${uid}-error`;

	/** Per letter: reads as a ripple without the end of a long label lagging. */
	const riseStagger = stagger / 4;
	/** Settling back is quicker: the field is being left, not entered. */
	const settleStagger = stagger / 8;
	/** Past this many letters, the rest move together. */
	const staggerCap = 8;

	let focused = $state(false);
	let autofilled = $state(false);
	let status = $state<'idle' | 'error' | 'valid'>('idle');
	/** Kept after the error clears, so the text never empties while its row closes. */
	let message = $state('');
	/** Validation follows every keystroke only once the user has seen an error. */
	let live = $state(false);

	const floated = $derived(focused || value !== '' || autofilled);
	const letters = $derived(Array.from(label));
	const shownError = $derived(error ?? (status === 'error' ? message : null));
	const invalid = $derived(!!shownError);

	$effect(() => {
		if (error) message = error;
	});

	function check(next: string) {
		const result = validate?.(next) ?? null;
		if (result) message = result;
		status = result ? 'error' : 'valid';
		return result;
	}

	function letterDelay(index: number) {
		return floated
			? Math.min(index, staggerCap) * riseStagger
			: Math.min(letters.length - 1 - index, staggerCap) * settleStagger;
	}
</script>

<div class={cn('flex w-full flex-col', className)}>
	<div class="relative">
		<input
			{...restProps}
			bind:this={ref}
			bind:value
			id={inputId}
			{type}
			spellcheck={restProps.spellcheck ?? false}
			aria-invalid={invalid || restProps['aria-invalid'] || undefined}
			aria-describedby={[restProps['aria-describedby'], invalid && errorId]
				.filter(Boolean)
				.join(' ') || undefined}
			onfocus={(event) => {
				focused = true;
				restProps.onfocus?.(event);
			}}
			oninput={(event) => {
				const next = event.currentTarget.value;
				autofilled = false;
				onValueChange?.(next);
				restProps.oninput?.(event);
				if (!validate) return;
				if (live) check(next);
				// A passing field stops claiming so the moment it isn't, but only
				// turns red again on blur.
				else if (status === 'valid' && validate(next)) status = 'idle';
			}}
			onblur={(event) => {
				focused = false;
				restProps.onblur?.(event);
				if (!validate) return;
				const next = event.currentTarget.value;
				// Tabbing past an untouched field is not a mistake.
				if (next === '' && !live) return;
				if (check(next)) live = true;
			}}
			onanimationstart={(event) => {
				// Browsers fire this for autofill before any input event arrives.
				if (event.animationName.includes('autofill')) autofilled = true;
			}}
			class={cn(
				// The top padding clears the floated label, so typed text and label
				// never share a pixel. A fixed line height keeps that math
				// independent of the page's leading.
				'peer bg-control text-foreground focus-visible:ring-ring floating-autofill h-13 w-full rounded-full ps-5 pe-11 pt-[1.4375rem] pb-[0.5625rem] text-base/5 transition-[box-shadow] duration-(--duration-base) outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm/5',
				invalid && 'ring-destructive focus-visible:ring-destructive ring-2'
			)}
		/>
		<!-- The label peels off the line one letter at a time, first letter first,
		     and settles back last letter first, like a sticker lifted from its
		     corner. The word scales from its top corner on the reading side while
		     each letter rises on its own delay, so nothing reflows. -->
		<label
			for={inputId}
			data-floated={floated || undefined}
			class={cn(
				'group/label pointer-events-none absolute start-5 top-4 origin-top-left text-base/5 whitespace-nowrap select-none sm:text-sm/5 rtl:origin-top-right',
				'transition-[scale,color] duration-(--duration-fast) ease-out motion-reduce:transition-colors',
				'data-floated:scale-[0.8] data-floated:duration-(--duration-base)',
				invalid ? 'text-destructive' : 'text-muted-foreground peer-focus:text-foreground'
			)}
		>
			<span class="sr-only">{label}</span>
			<span aria-hidden="true">
				{#each letters as letter, index (index)}
					<span
						style:transition-delay="{letterDelay(index)}ms"
						class="inline-block whitespace-pre transition-[translate] duration-(--duration-fast) ease-out group-data-floated/label:-translate-y-[0.7rem] group-data-floated/label:duration-(--duration-base) motion-reduce:transition-none"
						>{letter}</span
					>
				{/each}
			</span>
		</label>
		<Check
			aria-hidden="true"
			class={cn(
				'text-foreground pointer-events-none absolute end-4 top-1/2 size-4 -translate-y-1/2',
				status === 'valid' && !invalid
					? 'scale-100 opacity-100 blur-none [transition:scale_var(--duration-spring-snappy)_var(--ease-spring-snappy),opacity_var(--duration-fast)_var(--ease-out),filter_var(--duration-fast)_var(--ease-out)]'
					: 'scale-25 opacity-0 blur-[4px] transition-[scale,opacity,filter] duration-(--duration-instant) ease-in motion-reduce:scale-100 motion-reduce:blur-none'
			)}
		/>
	</div>

	<!-- Grid rows from 0fr to 1fr give a real height change without measuring. -->
	<div
		class={cn(
			'grid transition-[grid-template-rows] ease-out motion-reduce:transition-none',
			invalid
				? 'grid-rows-[1fr] duration-(--duration-base)'
				: 'grid-rows-[0fr] duration-(--duration-fast)'
		)}
	>
		<div class="min-h-0 overflow-hidden">
			<p
				id={errorId}
				aria-hidden={!invalid}
				class={cn(
					'text-destructive ps-5 pt-1.5 text-sm transition-[opacity,translate] ease-out motion-reduce:transition-opacity',
					invalid
						? 'translate-y-0 opacity-100 duration-(--duration-base)'
						: '-translate-y-1 opacity-0 duration-(--duration-fast) motion-reduce:translate-y-0'
				)}
			>
				<!-- The live error first, so a server-rendered error shows before
				     any effect runs; the kept message covers the row closing. -->
				{shownError ?? message}
			</p>
		</div>
	</div>
	<!-- Leaving the field moves focus away, so the error needs its own announcement. -->
	<span class="sr-only" aria-live="polite">{shownError ?? ''}</span>
</div>

<style>
	/* A named animation on autofill lets the label float before any input event. */
	:global(.floating-autofill:-webkit-autofill) {
		animation: floating-autofill-start var(--duration-instant);
	}
	:global(.floating-autofill:autofill) {
		animation: floating-autofill-start var(--duration-instant);
	}
	@keyframes -global-floating-autofill-start {
		from {
			opacity: 1;
		}
	}
</style>
