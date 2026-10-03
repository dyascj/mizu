<script lang="ts">
	import Minus from '@lucide/svelte/icons/minus';
	import Plus from '@lucide/svelte/icons/plus';
	import { untrack } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { duration as durations, prefersReducedMotion } from '$lib/components/ui/motion';
	import { NumberTicker } from '$lib/components/ui/number-ticker';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onchange' | 'oninput'> & {
		/** The current number. Bindable. Defaults to `min` when it is finite, otherwise 0. */
		value?: number;
		/** Smallest allowed value. */
		min?: number;
		/** Largest allowed value. */
		max?: number;
		/** How far one press of a button or arrow key moves. Page Up and Page Down move ten steps. */
		step?: number;
		/**
		 * Accessible name for the field, also used to name the buttons ("Increase
		 * seats"). Omit it when a visible label points at `id`.
		 */
		label?: string;
		/** Id for the text field, so a `<label for>` can name it. */
		id?: string;
		/** Form field name. */
		name?: string;
		/** Blocks typing, stepping, and holding. */
		disabled?: boolean;
		/** BCP 47 locale for the displayed number. */
		locale?: string;
		/** Intl.NumberFormat options for the displayed number, such as currency or a unit. */
		format?: Intl.NumberFormatOptions;
		/** Pill height. */
		size?: 'sm' | 'md';
		/** Called with each new value, from a button, a key, or a typed entry. */
		onValueChange?: (value: number) => void;
		/** The pill that holds the buttons and the field. */
		ref?: HTMLDivElement | null;
		/** The text field. */
		inputRef?: HTMLInputElement | null;
		/** Classes for the pill. */
		class?: string;
	};

	let {
		min = 0,
		max = Infinity,
		value = $bindable(Number.isFinite(min) ? min : 0),
		step = 1,
		label,
		id,
		name,
		disabled = false,
		locale,
		format,
		size = 'md',
		onValueChange,
		ref = $bindable(null),
		inputRef = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	/** Holding waits this long before repeating, so a click never double-steps. */
	const holdDelay = 400;
	/** Repeats start this far apart and close in on every step, down to `fastest`. */
	const firstRepeat = 150;
	const acceleration = 0.85;
	const fastest = 40;

	const uid = $props.id();
	const inputId = $derived(id ?? `${uid}-input`);

	// Non-null only once someone types, so the rolling number stays in charge until then.
	let draft = $state<string | null>(null);
	let shell = $state<HTMLSpanElement | null>(null);
	let timer: ReturnType<typeof setTimeout> | undefined;
	let nudge: Animation | undefined;

	/** Enough decimals to keep `step` and `min` exact, so 0.1 + 0.2 lands on 0.3. */
	const decimals = $derived(
		Math.max(
			...[step, min].map((n) =>
				Number.isFinite(n) ? (String(n).split(/e-|\./)[1]?.length ?? 0) : 0
			)
		)
	);
	const formatter = $derived(new Intl.NumberFormat(locale, format));
	/** The locale's decimal mark, so "2,5" types as two and a half where that is how it is written. */
	const decimalMark = $derived(
		new Intl.NumberFormat(locale).formatToParts(1.1).find((part) => part.type === 'decimal')
			?.value ?? '.'
	);
	/** "Seats" reads as "Increase seats"; an acronym such as "API keys" keeps its case. */
	const named = $derived(
		label && /^\p{Lu}\p{Ll}/u.test(label) ? label.charAt(0).toLowerCase() + label.slice(1) : label
	);
	const atMin = $derived(value <= min);
	const atMax = $derived(value >= max);

	const sizes = {
		sm: { pill: 'h-8 p-0.5', button: 'size-7 [&_svg]:size-3.5', value: 'min-w-7 text-sm' },
		md: { pill: 'h-10 p-1', button: 'size-8 [&_svg]:size-4', value: 'min-w-9 text-sm' }
	};

	/** A nudge toward the wall the value hit: felt more than seen. */
	function bump(direction: 1 | -1) {
		if (!shell?.animate || prefersReducedMotion()) return;
		nudge?.cancel();
		const style = getComputedStyle(shell);
		const easing = style.getPropertyValue('--ease-out').trim() || 'ease-out';
		// Right to left, the increase button sits on the left.
		const x = direction * (style.direction === 'rtl' ? -3 : 3);
		nudge = shell.animate(
			{ translate: ['0', `${x}px`, '0'] },
			{ duration: durations.base, easing }
		);
	}

	/** Moves to `target`, clamped. Returns false when nothing changed. */
	function setTo(target: number, direction: 1 | -1) {
		if (disabled) return false;
		const rounded = Number(target.toFixed(decimals));
		const next = Math.min(max, Math.max(min, rounded));
		// Asked for more than the range allows, so it hit the wall. Rounding away
		// float noise (0.2 + 0.1) or a typed 3.7 on whole steps is not a wall.
		if (next !== rounded) bump(direction);
		if (next === value) return false;
		value = next;
		onValueChange?.(next);
		return true;
	}

	const stepBy = (delta: number) => setTo(value + delta, delta > 0 ? 1 : -1);

	function stop() {
		clearTimeout(timer);
	}

	/** Steps once now, then repeats faster and faster while the press lasts. */
	function hold(delta: number) {
		stop();
		if (!stepBy(delta)) return;
		let interval = firstRepeat;
		const repeat = () => {
			if (!stepBy(delta)) return;
			interval = Math.max(fastest, interval * acceleration);
			timer = setTimeout(repeat, interval);
		};
		timer = setTimeout(repeat, holdDelay);
	}

	function commit() {
		if (draft === null) return;
		const parsed = Number.parseFloat(draft.replaceAll(decimalMark, '.'));
		draft = null;
		if (Number.isNaN(parsed)) return;
		setTo(parsed, parsed > value ? 1 : -1);
	}

	function onkeydown(event: KeyboardEvent) {
		const moves: Record<string, number> = {
			ArrowUp: step,
			ArrowDown: -step,
			PageUp: step * 10,
			PageDown: -step * 10
		};
		if (event.key in moves) {
			event.preventDefault();
			draft = null;
			stepBy(moves[event.key]);
		} else if (event.key === 'Home' && Number.isFinite(min)) {
			event.preventDefault();
			draft = null;
			setTo(min, -1);
		} else if (event.key === 'End' && Number.isFinite(max)) {
			event.preventDefault();
			draft = null;
			setTo(max, 1);
		} else if (event.key === 'Enter') {
			commit();
		} else if (event.key === 'Escape' && draft !== null) {
			event.preventDefault();
			draft = null;
		}
	}

	$effect(() => {
		if (disabled) untrack(stop);
	});

	$effect(() => () => {
		stop();
		nudge?.cancel();
	});
</script>

{#snippet stepper(delta: number, atLimit: boolean, action: string, Icon: typeof Plus)}
	<button
		type="button"
		tabindex={-1}
		aria-label={named ? `${action} ${named}` : action}
		aria-controls={inputId}
		aria-disabled={atLimit || disabled || undefined}
		{disabled}
		class={cn(
			'text-foreground inline-grid shrink-0 touch-manipulation place-items-center rounded-full outline-none select-none',
			'hover:bg-foreground/8 transition-[scale,opacity,background-color] duration-(--duration-fast) ease-out active:scale-[0.92] motion-reduce:transition-[opacity,background-color]',
			'disabled:pointer-events-none',
			atLimit && 'opacity-40 hover:bg-transparent active:scale-100',
			sizes[size].button
		)}
		onpointerdown={(event) => {
			if (event.button !== 0) return;
			// Keeps focus where it was, so holding never steals it from the field.
			event.preventDefault();
			hold(delta);
		}}
		onpointerup={stop}
		onpointerleave={stop}
		onpointercancel={stop}
		oncontextmenu={(event) => event.preventDefault()}
		onclick={(event) => {
			// Pointer presses stepped on the way down; this is assistive technology.
			if (event.detail === 0) stepBy(delta);
		}}
	>
		<Icon aria-hidden="true" />
	</button>
{/snippet}

<div
	{...restProps}
	bind:this={ref}
	data-disabled={disabled || undefined}
	class={cn(
		'bg-control inline-flex items-center rounded-full',
		'has-[input:focus-visible]:ring-ring has-[input:focus-visible]:ring-offset-background has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-offset-2',
		'data-disabled:opacity-50',
		sizes[size].pill,
		className
	)}
>
	{@render stepper(-step, atMin, 'Decrease', Minus)}
	<span bind:this={shell} class={cn('relative grid place-items-center px-1', sizes[size].value)}>
		<input
			bind:this={inputRef}
			id={inputId}
			{name}
			type="text"
			role="spinbutton"
			inputmode={min < 0 ? 'text' : Number.isInteger(step) ? 'numeric' : 'decimal'}
			autocomplete="off"
			spellcheck={false}
			aria-label={label}
			aria-valuenow={value}
			aria-valuemin={Number.isFinite(min) ? min : undefined}
			aria-valuemax={Number.isFinite(max) ? max : undefined}
			aria-valuetext={formatter.format(value)}
			{disabled}
			value={draft ?? String(value)}
			oninput={(event) => {
				const typed = event.currentTarget.value;
				// Digits, a sign, a dot, and the locale's own decimal mark.
				const kept = Array.from(typed)
					.filter((character) => /[\d.-]/.test(character) || character === decimalMark)
					.join('');
				draft = kept;
				// Written back, so a stray letter never lingers on screen.
				if (kept !== typed) event.currentTarget.value = kept;
			}}
			onfocus={(event) => event.currentTarget.select()}
			onblur={commit}
			{onkeydown}
			class={cn(
				'caret-foreground absolute inset-0 size-full min-w-0 bg-transparent text-center font-medium tabular-nums outline-none',
				draft === null ? 'text-transparent' : 'text-foreground'
			)}
		/>
		<!-- Hidden at once when typing starts, never faded, and it keeps the width. -->
		<span
			aria-hidden="true"
			class={cn('pointer-events-none font-medium', draft !== null && 'invisible')}
		>
			<NumberTicker {value} {locale} {format} />
		</span>
	</span>
	{@render stepper(step, atMax, 'Increase', Plus)}
</div>
