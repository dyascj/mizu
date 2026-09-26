<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { duration, prefersReducedMotion } from '$lib/components/ui/motion';
	import { NumberTicker } from '$lib/components/ui/number-ticker';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLButtonAttributes, 'children' | 'onclick' | 'value'> & {
		/** Whether the reader has saved it. Bindable. */
		saved?: boolean;
		/** Called with the new state each time the button toggles. */
		onSavedChange?: (saved: boolean) => void;
		/**
		 * A running total, including the reader's own save, shown in place of the
		 * label. Omit it to show the label.
		 */
		count?: number;
		/** The label before saving, and the button's accessible name. */
		label?: string;
		/** The label once saved. */
		savedLabel?: string;
		/** BCP 47 locale for the count. */
		locale?: string;
		/** Intl.NumberFormat options for the count, such as compact notation. */
		format?: Intl.NumberFormatOptions;
		/** A quiet gray pill, or transparent until hover for rows of message actions. */
		variant?: 'secondary' | 'ghost';
		/** Blocks toggling. */
		disabled?: boolean;
		/** The button element. */
		ref?: HTMLButtonElement | null;
		/** Classes for the button. */
		class?: string;
	};

	let {
		saved = $bindable(false),
		onSavedChange,
		count,
		label = 'Save',
		savedLabel = 'Saved',
		locale,
		format,
		variant = 'secondary',
		disabled = false,
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	/** A rounded ribbon; its shape spans 12% to 85% of the box, top to bottom. */
	const ribbon =
		'M6.5 4.75A1.75 1.75 0 0 1 8.25 3h7.5a1.75 1.75 0 0 1 1.75 1.75v15.07a.5.5 0 0 1-.79.41L12 16.75l-4.71 3.48a.5.5 0 0 1-.79-.41Z';

	let glyph = $state<HTMLSpanElement | null>(null);
	let restWidth = $state(0);
	let savedWidth = $state(0);
	let hop: Animation | undefined;

	/** A motion token as a Web Animations easing string. */
	const token = (name: string) =>
		(glyph && getComputedStyle(glyph).getPropertyValue(name).trim()) || 'ease-out';

	function land() {
		if (!glyph?.animate || prefersReducedMotion()) return;
		hop?.cancel();
		// The ribbon lifts and stretches a touch, then lands with a squash as the
		// fill tops out. Kept within 0.95 and 1.05 so it reads as weight, not rubber.
		hop = glyph.animate(
			[
				{ translate: '0 0', scale: '1 1', easing: token('--ease-out') },
				{ translate: '0 -2px', scale: '0.97 1.04', offset: 0.35, easing: token('--ease-in') },
				{ translate: '0 1px', scale: '1.04 0.95', offset: 0.65, easing: token('--ease-out') },
				{ translate: '0 0', scale: '1 1' }
			],
			{ duration: duration.slow }
		);
	}

	function settle() {
		if (!hop || hop.playState !== 'running' || !glyph?.animate) return;
		// Unsaving cuts any bounce still in flight short and settles fast.
		const { translate, scale } = getComputedStyle(glyph);
		hop.cancel();
		hop = glyph.animate(
			[
				{ translate, scale },
				{ translate: '0 0', scale: '1 1' }
			],
			{ duration: duration.fast, easing: token('--ease-out') }
		);
	}

	function onclick() {
		if (disabled) return;
		saved = !saved;
		onSavedChange?.(saved);
		if (saved) land();
		else settle();
	}

	$effect(() => () => hop?.cancel());

	const labelClass = (visible: boolean) =>
		cn(
			'col-start-1 row-start-1 text-left whitespace-nowrap transition-[opacity,filter,translate] ease-out',
			visible
				? 'translate-y-0 opacity-100 blur-none duration-(--duration-base)'
				: 'translate-y-0.5 opacity-0 blur-[4px] duration-(--duration-instant) motion-reduce:translate-y-0 motion-reduce:blur-none'
		);
</script>

<button
	{...restProps}
	bind:this={ref}
	type="button"
	aria-pressed={saved}
	{disabled}
	data-state={saved ? 'on' : 'off'}
	class={cn(
		'focus-visible:ring-ring focus-visible:ring-offset-background inline-flex h-9 shrink-0 touch-manipulation items-center gap-1.5 rounded-full pr-3.5 pl-2.5 text-sm font-medium outline-none select-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
		'transition-[background-color,color,scale] duration-(--duration-fast) ease-out active:scale-[0.96] motion-reduce:transition-[background-color,color]',
		saved
			? 'bg-primary-muted text-primary'
			: variant === 'ghost'
				? 'text-muted-foreground hover:text-foreground hover:bg-foreground/8'
				: 'bg-secondary text-secondary-foreground hover:bg-control',
		className
	)}
	{onclick}
>
	<!-- Squashes from its base, like something landing. -->
	<span bind:this={glyph} aria-hidden="true" class="grid origin-bottom">
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="1.75"
			stroke-linejoin="round"
			class="col-start-1 row-start-1 size-5"
		>
			<path d={ribbon} />
		</svg>
		<!-- The fill rises from the bottom. The clip runs between the ribbon's own
		     edges, so no part of the change is spent on empty space. Filling takes
		     its time; emptying is quicker. -->
		<svg
			viewBox="0 0 24 24"
			fill="currentColor"
			data-slot="bookmark-fill"
			class={cn(
				'col-start-1 row-start-1 size-5 transition-[clip-path]',
				saved
					? 'duration-(--duration-base) ease-out [clip-path:inset(12%_0_0_0)]'
					: 'duration-(--duration-fast) ease-in [clip-path:inset(85%_0_0_0)]'
			)}
		>
			<path d={ribbon} />
		</svg>
	</span>
	<span class="sr-only">{label}</span>
	{#if count !== undefined}
		<NumberTicker value={count} {locale} {format} />
	{:else}
		<!-- Glides to the word's own width, so "Save" never sits beside a gap kept
		     for a longer saved label. Width rather than scale, so letters never
		     stretch. The old word leaves before the new one is legible. -->
		<span
			aria-hidden="true"
			class="relative grid overflow-hidden transition-[width] duration-(--duration-base) ease-out motion-reduce:transition-none"
			style:width={restWidth && savedWidth ? `${saved ? savedWidth : restWidth}px` : undefined}
		>
			<span class={labelClass(!saved)}>{label}</span>
			<span class={labelClass(saved)}>{savedLabel}</span>
			<span bind:offsetWidth={restWidth} class="invisible absolute top-0 left-0 whitespace-nowrap">
				{label}
			</span>
			<span bind:offsetWidth={savedWidth} class="invisible absolute top-0 left-0 whitespace-nowrap">
				{savedLabel}
			</span>
		</span>
	{/if}
</button>
