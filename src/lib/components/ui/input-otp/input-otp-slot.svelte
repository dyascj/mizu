<script lang="ts">
	import { PinInput as PinInputPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import { duration as durations, rise } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';
	import { getInputOTPState } from './context.js';

	let {
		ref = $bindable(null),
		cell,
		class: className,
		...restProps
	}: WithoutChildrenOrChild<PinInputPrimitive.CellProps> & { class?: string } = $props();

	const otp = getInputOTPState();
</script>

<PinInputPrimitive.Cell
	bind:ref
	{cell}
	data-status={otp.status}
	class={cn(
		'bg-control border-input text-foreground relative flex h-11 w-9 min-w-0 items-center justify-center rounded-md border text-lg tabular-nums transition-[border-color,color] duration-(--duration-base) ease-out outline-none sm:w-11',
		otp.status === 'error' && 'border-destructive text-destructive',
		otp.status === 'checking' && 'text-muted-foreground',
		otp.status === 'success' && 'border-success',
		className
	)}
	{...restProps}
>
	{#if cell.char !== null && cell.char !== undefined}
		<!-- Keyed by the digit, so a replaced digit lifts in again. Deleting
		     removes it with no exit, the way a caret erases. -->
		{#key cell.char}
			<span in:rise|global={{ y: 4, duration: durations.fast }}>{cell.char}</span>
		{/key}
	{/if}
	{#if cell.hasFakeCaret}
		<!-- Moving to the next slot on every keystroke restarts the blink solid,
		     like a native caret. -->
		<div class="pointer-events-none absolute inset-0 flex items-center justify-center">
			<div class="otp-caret bg-foreground h-5 w-px"></div>
		</div>
	{/if}
</PinInputPrimitive.Cell>

<style>
	.otp-caret {
		animation: otp-caret calc(var(--duration-ambient) / 2) steps(1, end) infinite;
	}

	@keyframes otp-caret {
		50%,
		100% {
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.otp-caret {
			animation: none;
		}
	}
</style>
