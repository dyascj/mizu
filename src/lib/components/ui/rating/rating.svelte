<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import DropletIcon from '@lucide/svelte/icons/droplet';
	import { SpringValue, springPresets, stagger } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> & {
		/** The committed score. Bindable. */
		value?: number;
		/** Number of rating marks, rounded and clamped to the inclusive range 1 to 100. */
		max?: number;
		/** Shows the score without taking input. */
		readonly?: boolean;
		/** Dims the marks and blocks input. */
		disabled?: boolean;
		/** Mark size in pixels, clamped to the inclusive range 8 to 128. */
		size?: number;
		/** Form field name. Renders a hidden input with the score. */
		name?: string;
		/** Lets the leading half of a mark (the left, or the right in right-to-left text) score a half point. */
		allowHalf?: boolean;
		/** Classes for the row of marks. */
		class?: string;
		/** Called with each newly committed score. */
		onValueChange?: (value: number) => void;
	};

	let {
		value = $bindable(0),
		max = 5,
		readonly = false,
		disabled = false,
		size = 24,
		name,
		allowHalf = false,
		class: className,
		onValueChange,
		...rest
	}: Props = $props();

	/** Kick for the mark that was chosen: it peaks near 115% and settles with one faint dip. */
	const popKick = 0.18;
	/** The marks behind it echo at about half strength, one after another. */
	const echoKick = 0.085;
	const echoStagger = stagger / 2;

	let hover = $state<number | null>(null);
	let marks: HTMLElement[] = $state([]);
	const pops: SpringValue[] = [];
	let echoTimers: ReturnType<typeof setTimeout>[] = [];

	const normalizedMax = $derived(
		Math.min(100, Math.max(1, Math.round(Number.isFinite(max) ? max : 5)))
	);
	const normalizedSize = $derived(Math.min(128, Math.max(8, Number.isFinite(size) ? size : 24)));
	const normalizedValue = $derived(Number.isFinite(value) ? (value ?? 0) : 0);
	const committed = $derived(Math.max(0, Math.min(normalizedMax, normalizedValue)));
	const interactive = $derived(!readonly && !disabled);
	const step = $derived(allowHalf ? 0.5 : 1);
	/* The score that actually paints: a live hover preview when interactive,
	   otherwise the committed value (clamped to range). */
	const display = $derived(hover ?? committed);
	/** Hovering somewhere other than the committed score only suggests it. */
	const previewing = $derived(hover !== null && hover !== committed);

	function clamp(v: number) {
		return Math.max(0, Math.min(normalizedMax, Math.round(v / step) * step));
	}

	/**
	 * The chosen mark springs up from a kick and settles. With `echo`, the marks
	 * behind it follow at half strength, nearest first, like a ripple running
	 * back along the row. A second pick mid-pop carries on from where each mark
	 * is instead of restarting.
	 */
	function pop(score: number, echo: boolean) {
		for (const timer of echoTimers) clearTimeout(timer);
		echoTimers = [];
		if (score <= 0) return;
		const last = Math.ceil(score) - 1;
		const first = echo ? 0 : last;
		for (let i = last; i >= first; i--) {
			const kick = () => {
				const spring = (pops[i] ??= new SpringValue(1, {
					preset: springPresets.bouncy,
					onUpdate: (scale) => {
						const mark = marks[i];
						if (mark) mark.style.transform = scale === 1 ? '' : `scale(${scale})`;
					}
				}));
				spring.set(1, { velocity: i === last ? popKick : echoKick });
			};
			if (i === last) kick();
			else echoTimers.push(setTimeout(kick, (last - i) * echoStagger));
		}
	}

	function commit(v: number, echo: boolean) {
		const next = clamp(v);
		pop(next, echo);
		if (next === value) return;
		value = next;
		onValueChange?.(next);
	}

	/* Fraction (0, 0.5, 1) filled for the droplet at 1-based position `i`. */
	function fillOf(i: number) {
		const d = display - (i - 1);
		if (d >= 1) return 1;
		if (d >= 0.5 && allowHalf) return 0.5;
		if (d > 0 && !allowHalf) return 1;
		return 0;
	}

	/* Resolve the droplet (and half, when enabled) under the pointer from a
	   container-level event, so the droplets themselves stay non-interactive
	   and never nest an interactive control inside the slider. */
	function valueFromEvent(e: MouseEvent): number | null {
		const el = (e.target as HTMLElement).closest<HTMLElement>('[data-rating-index]');
		if (!el) return null;
		const i = Number(el.dataset.ratingIndex);
		if (!allowHalf) return i;
		const { left, width } = el.getBoundingClientRect();
		// The row mirrors in right-to-left text, so the leading half is the right one.
		const leading =
			getComputedStyle(el).direction === 'rtl' ? left + width - e.clientX : e.clientX - left;
		return leading < width / 2 ? i - 0.5 : i;
	}

	function handleMove(e: PointerEvent) {
		// Touch has no hover; a tap goes straight to a commit.
		if (!interactive || e.pointerType === 'touch') return;
		const v = valueFromEvent(e);
		if (v !== null) hover = v;
	}

	function handleClick(e: MouseEvent) {
		if (!interactive) return;
		const v = valueFromEvent(e);
		if (v !== null) commit(v, true);
	}

	function onkeydown(e: KeyboardEvent) {
		if (!interactive) return;
		// The row mirrors in right-to-left text, so the arrows follow what they point at.
		const rtl = getComputedStyle(e.currentTarget as Element).direction === 'rtl';
		let next: number;
		switch (e.key) {
			case 'ArrowRight':
				next = committed + (rtl ? -step : step);
				break;
			case 'ArrowLeft':
				next = committed + (rtl ? step : -step);
				break;
			case 'ArrowUp':
				next = committed + step;
				break;
			case 'ArrowDown':
				next = committed - step;
				break;
			case 'PageUp':
				next = committed + 1;
				break;
			case 'PageDown':
				next = committed - 1;
				break;
			case 'Home':
				next = 0;
				break;
			case 'End':
				next = normalizedMax;
				break;
			default:
				return;
		}
		e.preventDefault();
		// Keys take over from the pointer, so the preview never disagrees with them.
		hover = null;
		// Arrows repeat while held, so only the mark that lands pops.
		commit(next, false);
	}

	$effect(() => () => {
		for (const timer of echoTimers) clearTimeout(timer);
		for (const spring of pops) spring?.stop();
	});
</script>

<div
	role="slider"
	aria-valuemin={0}
	aria-valuemax={normalizedMax}
	aria-valuenow={committed}
	aria-label={rest['aria-label'] ?? `Rating, ${committed} of ${normalizedMax}`}
	aria-readonly={readonly || undefined}
	aria-disabled={disabled || undefined}
	tabindex={interactive ? 0 : -1}
	{onkeydown}
	onpointermove={handleMove}
	onclick={handleClick}
	onpointerleave={() => (hover = null)}
	class={cn(
		'focus-visible:ring-ring focus-visible:ring-offset-background inline-flex max-w-full touch-manipulation flex-wrap items-center gap-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
		interactive && 'cursor-pointer',
		disabled && 'pointer-events-none opacity-50',
		className
	)}
	{...rest}
>
	{#each { length: normalizedMax } as _, idx (idx)}
		{@const i = idx + 1}
		{@const fill = fillOf(i)}
		<span
			bind:this={marks[idx]}
			data-rating-index={i}
			aria-hidden="true"
			class={cn(
				'ease-spring-bouncy relative inline-grid place-items-center transition-[scale] duration-(--duration-spring-bouncy)',
				interactive && 'hover:scale-110 active:scale-[0.96]'
			)}
			style="width: {normalizedSize}px; height: {normalizedSize}px;"
		>
			<!-- Empty outline base -->
			<DropletIcon
				class="text-muted-foreground/40 absolute inset-0 m-auto"
				size={normalizedSize}
				strokeWidth={1.75}
			/>
			<!-- Filled overlay, clipped to the fill fraction. It glides rather than
			     snaps, so sweeping across the marks fills them like a pour, and a
			     fast sweep retargets mid-flight instead of lagging. The inner icon
			     keeps the full droplet's position so a half clip reveals its leading
			     half. A preview reads lighter than a committed score. -->
			<span
				class="absolute start-0 top-0 h-full overflow-hidden transition-[width] duration-(--duration-base) ease-out motion-reduce:transition-none"
				style="width: {fill * normalizedSize}px;"
				aria-hidden="true"
			>
				<DropletIcon
					class={cn(
						'absolute start-0 top-0 transition-colors duration-(--duration-fast) ease-out',
						previewing ? 'text-primary/55' : 'text-primary'
					)}
					size={normalizedSize}
					fill="currentColor"
					strokeWidth={1.75}
				/>
			</span>
		</span>
	{/each}

	{#if name}
		<input type="hidden" {name} value={value ?? 0} />
	{/if}
</div>
