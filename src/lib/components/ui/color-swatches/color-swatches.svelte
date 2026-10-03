<script lang="ts" module>
	export type Swatch = {
		/** Names the color for screen readers and is the value when picked. */
		name: string;
		/** Any CSS color. The swatches are data, so literal colors belong here. */
		color: string;
		/**
		 * Color of the check drawn on the swatch. Defaults to near white on dark
		 * colors and near black on light ones.
		 */
		ink?: string;
	};

	/**
	 * The ink for a swatch: its own, or near white or near black depending on
	 * how light the color is, worked out by the browser from the color itself.
	 */
	export function swatchInk(swatch: Swatch) {
		return swatch.ink ?? `oklch(from ${swatch.color} clamp(0.22, (0.65 - l) * 1000, 0.99) 0 0)`;
	}
</script>

<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import type { HTMLAttributes } from 'svelte/elements';
	import { prefersReducedMotion } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** The colors to choose from, in order. */
		swatches: Swatch[];
		/** The picked swatch's name. Falls back to the first swatch. */
		value?: string;
		/** Called with the picked swatch's name. */
		onValueChange?: (name: string) => void;
		/** Accessible name for the group, such as "Accent color". */
		label?: string;
		/** Submits the picked name with a form under this field name. */
		name?: string;
		/** Blocks picking. */
		disabled?: boolean;
		/** The radio group element. */
		ref?: HTMLDivElement | null;
		/** Classes for the group. */
		class?: string;
	};

	let {
		swatches,
		value = $bindable(),
		onValueChange,
		label,
		name,
		disabled = false,
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	const selected = $derived(
		Math.max(
			swatches.findIndex((swatch) => swatch.name === value),
			0
		)
	);

	let buttons = $state<HTMLButtonElement[]>([]);
	/** The swatch that wore the ring last, so the next one knows where to glide from. */
	let ringHolder: HTMLElement | null = null;

	function pick(index: number) {
		const swatch = swatches[index];
		if (!swatch || disabled) return;
		if (swatch.name !== value) {
			value = swatch.name;
			onValueChange?.(swatch.name);
		}
	}

	// Radio pattern: arrows move focus and the choice together, wrapping at the ends.
	function onkeydown(event: KeyboardEvent) {
		const last = swatches.length - 1;
		const forward = selected === last ? 0 : selected + 1;
		const back = selected === 0 ? last : selected - 1;
		// The row mirrors in right-to-left text, so the arrows follow what is on screen.
		const rtl = getComputedStyle(event.currentTarget as Element).direction === 'rtl';
		const index = (
			{
				ArrowRight: rtl ? back : forward,
				ArrowDown: forward,
				ArrowLeft: rtl ? forward : back,
				ArrowUp: back,
				Home: 0,
				End: last
			} as Record<string, number>
		)[event.key];
		if (index === undefined) return;
		event.preventDefault();
		pick(index);
		buttons[index]?.focus();
	}

	/**
	 * The ring glides from the swatch that had it, on a critically damped
	 * spring: a ring that overshot would briefly circle the wrong color.
	 */
	function glide(ring: HTMLElement) {
		const swatch = ring.parentElement;
		const previous = ringHolder;
		ringHolder = swatch;
		if (!swatch || !previous || previous === swatch || !previous.isConnected) return;
		if (prefersReducedMotion()) return;
		const from = previous.getBoundingClientRect();
		const to = swatch.getBoundingClientRect();
		ring.style.transition = 'none';
		ring.style.translate = `${from.left - to.left}px ${from.top - to.top}px`;
		void ring.offsetWidth;
		ring.style.transition = '';
		ring.style.translate = '';
	}
</script>

<div
	{...restProps}
	bind:this={ref}
	role="radiogroup"
	aria-label={label ?? restProps['aria-label']}
	aria-disabled={disabled || undefined}
	data-slot="color-swatches"
	class={cn('flex flex-wrap items-center gap-3 p-1', className)}
	{onkeydown}
>
	{#each swatches as swatch, index (swatch.name)}
		{@const checked = index === selected}
		<button
			bind:this={buttons[index]}
			type="button"
			role="radio"
			aria-checked={checked}
			aria-label={swatch.name}
			tabindex={checked ? 0 : -1}
			{disabled}
			data-state={checked ? 'checked' : 'unchecked'}
			onclick={() => pick(index)}
			style:background-color={swatch.color}
			style:color={swatchInk(swatch)}
			class={cn(
				'relative grid size-8 shrink-0 touch-manipulation place-items-center rounded-full outline-none select-none',
				'transition-[scale] duration-(--duration-fast) ease-out active:scale-[0.96] motion-reduce:transition-none',
				// Keeps a light swatch's edge on a light page and a dark one's on a dark page.
				'ring-foreground/10 ring-1 ring-inset',
				// Clears the selection ring with a gap of its own.
				'focus-visible:outline-ring focus-visible:outline-2 focus-visible:outline-offset-[6px]',
				'disabled:pointer-events-none disabled:opacity-50',
				// Grows the hit area to 40px without growing the circle.
				'after:absolute after:-inset-1 after:rounded-full'
			)}
		>
			{#if checked}
				<!-- A 2px gap, then a 2px ring: a 32px swatch in a 40px ring. -->
				<span
					aria-hidden="true"
					data-slot="color-swatches-ring"
					class="border-primary pointer-events-none absolute -inset-1 rounded-full border-2 transition-[translate] duration-(--duration-spring-snappy) ease-(--ease-spring-snappy) motion-reduce:transition-none"
					{@attach glide}
				></span>
			{/if}
			<Check
				aria-hidden="true"
				strokeWidth={2.5}
				class={cn(
					'size-4',
					checked
						? 'scale-100 opacity-100 blur-none [transition:scale_var(--duration-spring-snappy)_var(--ease-spring-snappy),opacity_var(--duration-base)_var(--ease-out),filter_var(--duration-base)_var(--ease-out)]'
						: 'scale-25 opacity-0 blur-[4px] transition-[scale,opacity,filter] duration-(--duration-fast) ease-in motion-reduce:scale-100 motion-reduce:blur-none',
					'motion-reduce:transition-opacity'
				)}
			/>
		</button>
	{/each}
	{#if name}
		<input type="hidden" {name} value={swatches[selected]?.name ?? ''} />
	{/if}
</div>
