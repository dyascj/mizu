<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import SendHorizontal from '@lucide/svelte/icons/send-horizontal';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { duration as durations, easeIn, prefersReducedMotion } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLButtonAttributes, 'children' | 'onclick' | 'type'> & {
		/**
		 * Called when a press sends. In a form, use `type="submit"` and send from
		 * the form's submit handler instead; the flight plays either way.
		 */
		onSend?: () => void;
		/** Button type. Use `submit` inside a composer form so Enter sends too. */
		type?: 'button' | 'submit';
		/** The button's name, and its visible word unless `iconOnly`. */
		label?: string;
		/** The word that lands after the plane leaves. Also announced. */
		sentLabel?: string;
		/**
		 * A round icon button, sized to sit inside a chat composer. The plane
		 * then leaves through the edge of the circle instead of flying free.
		 */
		iconOnly?: boolean;
		/** Colors of the pill. */
		variant?: 'primary' | 'secondary';
		/** Height. `md` matches the send button inside ChatInput. */
		size?: 'sm' | 'md' | 'lg';
		/** How long "Sent" shows before the button is ready again, in milliseconds. */
		timeout?: number;
		/**
		 * Blocks sending, such as while the message is empty. Applied once the
		 * button is back at rest, so clearing the field mid-flight never dims it.
		 */
		disabled?: boolean;
		/** The button element. */
		ref?: HTMLButtonElement | null;
		/** Classes for the button. */
		class?: string;
	};

	let {
		onSend,
		type = 'button',
		label = 'Send',
		sentLabel = 'Sent',
		iconOnly = false,
		variant = 'primary',
		size = 'md',
		timeout = 1600,
		disabled = false,
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	const tones = {
		primary: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover',
		secondary: 'bg-secondary text-secondary-foreground hover:bg-control'
	};
	const sizes = {
		sm: { icon: 'size-8', text: 'h-8 gap-1.5 pr-4 pl-3 text-sm', svg: '[&_svg]:size-4' },
		md: { icon: 'size-9', text: 'h-9 gap-2 pr-4 pl-3.5 text-sm', svg: '[&_svg]:size-4' },
		lg: { icon: 'size-11', text: 'h-11 gap-2 pr-5 pl-4 text-base', svg: '[&_svg]:size-5' }
	};

	let status = $state<'idle' | 'sending' | 'sent'>('idle');
	/** True once the plane has left, so it can grow back at home. */
	let flown = $state(false);
	let plane = $state<HTMLElement | null>(null);
	let frame = 0;
	let timers: ReturnType<typeof setTimeout>[] = [];

	// A quadratic curve in pixels from where the plane rests. The first control
	// point sits level with the start so it leaves horizontally and never snaps
	// its nose on the first frame. In a circle the path shrinks to the edge.
	const path = $derived(
		iconOnly
			? { p1: { x: 16, y: 0 }, p2: { x: 38, y: -24 } }
			: { p1: { x: 36, y: 0 }, p2: { x: 84, y: -52 } }
	);

	function along(t: number) {
		const { p1, p2 } = path;
		return {
			x: 2 * (1 - t) * t * p1.x + t * t * p2.x,
			y: 2 * (1 - t) * t * p1.y + t * t * p2.y,
			// The curve's tangent, so the nose points where it is heading.
			angle:
				(Math.atan2(
					2 * (1 - t) * p1.y + 2 * t * (p2.y - p1.y),
					2 * (1 - t) * p1.x + 2 * t * (p2.x - p1.x)
				) *
					180) /
				Math.PI
		};
	}

	/** The flight is the confirmation itself, so it takes a deliberate beat. */
	const flight = durations.slow;
	/** The share of the flight spent crouching back before take off. */
	const crouch = 0.3;

	function fly() {
		const node = plane;
		if (!node) return;
		cancelAnimationFrame(frame);
		let start: number | undefined;
		const tick = (now: number) => {
			start ??= now;
			const p = Math.min(1, (now - start) / flight);
			// Accelerates away, as an exit should, after dipping back about 3px
			// (anticipation) so the plane gathers itself before it goes.
			const t = easeIn(p);
			const back = p < crouch ? -3 * Math.sin((Math.PI * p) / crouch) : 0;
			const { x, y, angle } = along(t);
			node.style.translate = `${x + back}px ${y}px`;
			node.style.rotate = `${angle}deg`;
			// Shrinks a little with distance, and fades over the last stretch.
			node.style.scale = `${1 - 0.25 * t}`;
			node.style.opacity = `${Math.min(1, (1 - p) / 0.45)}`;
			if (p < 1) frame = requestAnimationFrame(tick);
			else flown = true;
		};
		frame = requestAnimationFrame(tick);
	}

	function home() {
		cancelAnimationFrame(frame);
		for (const name of ['translate', 'rotate', 'scale', 'opacity'] as const) {
			plane?.style.removeProperty(name);
		}
	}

	function send(event: MouseEvent) {
		// Ignore repeat presses, and hold back a repeat form submission, until
		// the button is back at rest.
		if (status !== 'idle') {
			event.preventDefault();
			return;
		}
		if (disabled) return;
		onSend?.();
		status = 'sending';
		const reduce = prefersReducedMotion();
		if (reduce) flown = true;
		else fly();
		timers = [
			// "Sent" arrives while the plane is still fading up top, so the button
			// never sits empty and the hand off reads as one move.
			setTimeout(() => (status = 'sent'), reduce ? 0 : (flight * 2) / 3),
			setTimeout(() => {
				home();
				flown = false;
				status = 'idle';
			}, timeout)
		];
	}

	$effect(() => () => {
		cancelAnimationFrame(frame);
		timers.forEach(clearTimeout);
	});

	const shown =
		'scale-100 opacity-100 blur-none [transition:scale_var(--duration-spring-snappy)_var(--ease-spring-snappy),opacity_var(--duration-base)_var(--ease-out),filter_var(--duration-base)_var(--ease-out)]';
</script>

<button
	{...restProps}
	bind:this={ref}
	{type}
	aria-label={label}
	aria-disabled={status !== 'idle' || undefined}
	disabled={disabled && status === 'idle'}
	data-status={status}
	onclick={send}
	class={cn(
		'focus-visible:ring-ring focus-visible:ring-offset-background relative inline-flex shrink-0 touch-manipulation items-center justify-center rounded-full font-medium whitespace-nowrap transition-[background-color,scale,opacity] duration-(--duration-fast) ease-out outline-none select-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50 aria-disabled:cursor-default',
		tones[variant],
		iconOnly ? cn(sizes[size].icon, 'overflow-hidden') : sizes[size].text,
		sizes[size].svg,
		className
	)}
>
	<!-- The plane's mass sits left of its box center, so it gets a pixel of nudge. -->
	<span aria-hidden="true" class={cn('grid', iconOnly && 'translate-x-px')}>
		<span
			class={cn(
				'col-start-1 row-start-1 flex',
				flown ? 'scale-25 opacity-0 blur-[4px] transition-none' : shown
			)}
		>
			<span bind:this={plane} class="flex">
				<SendHorizontal />
			</span>
		</span>
		<!-- Slides in rightward, the way the plane left, so the check reads as the
		     same motion finishing. -->
		<span
			class={cn(
				'col-start-1 row-start-1 flex',
				status === 'sent'
					? 'translate-x-0 opacity-100 blur-none [transition:translate_var(--duration-spring-snappy)_var(--ease-spring-snappy),opacity_var(--duration-base)_var(--ease-out),filter_var(--duration-base)_var(--ease-out)]'
					: '-translate-x-2 opacity-0 blur-[4px] transition-[translate,opacity,filter] duration-(--duration-fast) ease-in'
			)}
		>
			<Check />
		</span>
	</span>
	{#if !iconOnly}
		<!-- A shared cell, so the pill keeps the longer word's width. -->
		<span aria-hidden="true" class="grid">
			<span
				class={cn(
					'col-start-1 row-start-1',
					status === 'idle'
						? 'translate-x-0 opacity-100 blur-none transition-[translate,opacity,filter] duration-(--duration-base) ease-out'
						: '-translate-x-1 opacity-0 blur-[4px] transition-[translate,opacity,filter] duration-(--duration-instant) ease-in'
				)}
			>
				{label}
			</span>
			<span
				class={cn(
					'col-start-1 row-start-1',
					status === 'sent'
						? 'translate-x-0 opacity-100 blur-none transition-[translate,opacity,filter] duration-(--duration-base) ease-out'
						: '-translate-x-1 opacity-0 blur-[4px] transition-[translate,opacity,filter] duration-(--duration-instant) ease-in'
				)}
			>
				{sentLabel}
			</span>
		</span>
	{/if}
</button>
<span class="sr-only" aria-live="polite">{status === 'sent' ? sentLabel : ''}</span>
