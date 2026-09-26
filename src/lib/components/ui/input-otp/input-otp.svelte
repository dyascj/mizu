<script lang="ts">
	import { PinInput as PinInputPrimitive, type WithoutChildren } from 'bits-ui';
	import { untrack } from 'svelte';
	import { duration as durations, prefersReducedMotion } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';
	import { setInputOTPState, type InputOTPStatus } from './context.js';

	type Props = WithoutChildren<PinInputPrimitive.RootProps> & {
		/** Classes for the row of slots. */
		class?: string;
		/** Renders the slots from `cells`, with any groups and separators between them. */
		children: NonNullable<PinInputPrimitive.RootProps['children']>;
		/**
		 * Checks a finished code. While it runs the code is locked. A `false`
		 * result, or a thrown error, shakes the slots, marks them invalid, and
		 * clears the code a moment later so the next try starts fresh; `true`
		 * marks the code verified. Both results are announced.
		 */
		onVerify?: (code: string) => boolean | Promise<boolean>;
		/**
		 * Where the code stands. Bindable, so a form can show its own message.
		 * Set it to `'error'` when you verify elsewhere to get the same shake
		 * and reset.
		 */
		status?: InputOTPStatus;
		/** Announced when a code is refused. */
		errorText?: string;
		/** Announced when a code is accepted. */
		successText?: string;
	};

	let {
		ref = $bindable(null),
		inputRef = $bindable(null),
		value = $bindable(''),
		maxlength = 6,
		status = $bindable('idle'),
		onVerify,
		errorText = 'Wrong code, try again',
		successText = 'Code verified',
		onComplete,
		onValueChange,
		readonly,
		'aria-invalid': ariaInvalid,
		class: className,
		children: slots,
		...restProps
	}: Props = $props();

	/** Long enough to take in the shake and the red, short enough that retyping never feels blocked. */
	const errorHold = durations.slow * 2;

	setInputOTPState({
		get status() {
			return status;
		}
	});

	let attempt = 0;
	let clearTimer: ReturnType<typeof setTimeout> | undefined;
	let shake: Animation | undefined;
	let ring = $state<HTMLSpanElement | null>(null);
	/** The first and last selected slots, or -1 when no slot is active. */
	let span: [number, number] = [-1, -1];

	async function verify(code: string) {
		if (!onVerify) return;
		const id = ++attempt;
		status = 'checking';
		let ok = false;
		try {
			ok = await onVerify(code);
		} catch {
			// A failed check reads as a wrong code rather than a stuck field.
		}
		if (id !== attempt) return;
		status = ok ? 'success' : 'error';
	}

	function fail() {
		clearTimeout(clearTimer);
		if (ref?.animate && !prefersReducedMotion()) {
			shake?.cancel();
			const easing = getComputedStyle(ref).getPropertyValue('--ease-out').trim() || 'ease-out';
			shake = ref.animate(
				{ translate: ['0', '-6px', '5px', '-3px', '1.5px', '0'] },
				{ duration: durations.slow, easing }
			);
		}
		clearTimer = setTimeout(() => {
			value = '';
			onValueChange?.('');
			status = 'idle';
			inputRef?.focus();
		}, errorHold);
	}

	let previous: InputOTPStatus = untrack(() => status);
	$effect(() => {
		const next = status;
		untrack(() => {
			if (next === 'error' && previous !== 'error') fail();
			if (next !== 'error') clearTimeout(clearTimer);
			previous = next;
		});
	});

	/** One focus ring for the whole code, gliding from slot to slot as digits land. */
	function place(node: HTMLElement) {
		const [first, last] = span;
		const cells = ref?.querySelectorAll<HTMLElement>('[data-pin-input-cell]');
		const start = cells?.[first];
		const end = cells?.[last];
		// Hidden while the code is locked; a verified code stays editable, so it keeps its ring.
		if (!ref || !start || !end || status === 'checking' || status === 'error') {
			node.dataset.hidden = '';
			return;
		}
		const box = ref.getBoundingClientRect();
		const a = start.getBoundingClientRect();
		const b = end.getBoundingClientRect();
		// Appearing, it fades in where it belongs instead of sliding over from its last spot.
		const appearing = node.hasAttribute('data-hidden');
		if (appearing) node.style.transitionProperty = 'opacity, scale';
		node.style.translate = `${a.left - box.left}px ${a.top - box.top}px`;
		node.style.width = `${b.right - a.left}px`;
		node.style.height = `${a.height}px`;
		node.style.borderRadius = getComputedStyle(start).borderRadius;
		delete node.dataset.hidden;
		if (appearing) requestAnimationFrame(() => node.style.removeProperty('transition-property'));
	}

	function glide(first: number, last: number, _status: InputOTPStatus) {
		return (node: HTMLElement) => {
			span = [first, last];
			place(node);
		};
	}

	$effect(() => {
		if (!ref || typeof ResizeObserver === 'undefined') return;
		const observer = new ResizeObserver(() => ring && place(ring));
		observer.observe(ref);
		return () => observer.disconnect();
	});

	$effect(() => () => {
		attempt++;
		clearTimeout(clearTimer);
		shake?.cancel();
	});

	const locked = $derived(status === 'checking' || status === 'error');
</script>

<PinInputPrimitive.Root
	bind:ref
	bind:inputRef
	bind:value
	{maxlength}
	readonly={locked || readonly}
	aria-invalid={status === 'error' ? true : ariaInvalid}
	data-status={status}
	onComplete={(code: string) => {
		onComplete?.(code);
		verify(code);
	}}
	onValueChange={(next: string) => {
		onValueChange?.(next);
		if (status === 'success') status = 'idle';
	}}
	class={cn(
		'flex max-w-full items-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-50',
		className
	)}
	{...restProps}
>
	{#snippet children(state)}
		{@const first = state.cells.findIndex((cell) => cell.isActive)}
		{@const last = state.cells.findLastIndex((cell) => cell.isActive)}
		{@render slots(state)}
		<span
			bind:this={ring}
			aria-hidden="true"
			data-hidden=""
			{@attach glide(first, last, status)}
			class="ring-ring pointer-events-none absolute top-0 left-0 ring-2 transition-[translate,width,height,opacity,scale] duration-(--duration-base) ease-out data-hidden:scale-[0.96] data-hidden:opacity-0 data-hidden:duration-(--duration-fast) motion-reduce:transition-opacity"
		></span>
	{/snippet}
</PinInputPrimitive.Root>
<span class="sr-only" aria-live="polite">
	{status === 'error' ? errorText : status === 'success' ? successText : ''}
</span>
