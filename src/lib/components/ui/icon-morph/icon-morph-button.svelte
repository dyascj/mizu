<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';
	import IconMorph from './icon-morph.svelte';
	import type { MorphShape, MorphShapeName } from './shapes.js';

	type Props = Omit<HTMLButtonAttributes, 'children' | 'onclick' | 'value'> & {
		/** A built-in pair, such as `playPause`, or your own `{ off, on }` paths. */
		shape: MorphShapeName | MorphShape;
		/**
		 * The accessible name. It stays fixed while the pressed state carries the
		 * change, so a screen reader never hears a name and a state that disagree.
		 * Match the resting caption so voice control finds it.
		 */
		label: string;
		/** Visible words for the resting and pressed states, crossfaded under the icon. */
		captions?: [off: string, on: string];
		/** Whether the button is pressed and the icon morphed. Bindable. */
		pressed?: boolean;
		/** Called with the new state each time the button toggles. */
		onPressedChange?: (pressed: boolean) => void;
		/** A quiet gray circle, or transparent until hover for toolbars. */
		variant?: 'secondary' | 'ghost';
		/** Button diameter. */
		size?: 'sm' | 'md' | 'lg';
		/** Blocks toggling. */
		disabled?: boolean;
		/** The button element. */
		ref?: HTMLButtonElement | null;
		/** Classes for the button. */
		class?: string;
	};

	let {
		shape,
		label,
		captions,
		pressed = $bindable(false),
		onPressedChange,
		variant = 'secondary',
		size = 'md',
		disabled = false,
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	const sizes = {
		sm: 'size-8 [&_svg]:size-4',
		md: 'size-11 [&_svg]:size-5',
		lg: 'size-14 [&_svg]:size-6'
	};

	function onclick() {
		if (disabled) return;
		pressed = !pressed;
		onPressedChange?.(pressed);
	}
</script>

{#snippet button()}
	<button
		{...restProps}
		bind:this={ref}
		type="button"
		aria-label={label}
		aria-pressed={pressed}
		{disabled}
		data-state={pressed ? 'on' : 'off'}
		class={cn(
			'focus-visible:ring-ring focus-visible:ring-offset-background inline-grid shrink-0 touch-manipulation place-items-center rounded-full outline-none select-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
			'transition-[background-color,color,scale] duration-(--duration-fast) ease-out active:scale-[0.96] motion-reduce:transition-[background-color,color]',
			variant === 'ghost'
				? 'text-muted-foreground hover:text-foreground hover:bg-foreground/8'
				: 'bg-secondary text-secondary-foreground hover:bg-control',
			sizes[size],
			className
		)}
		{onclick}
	>
		<IconMorph {shape} morphed={pressed} />
	</button>
{/snippet}

{#if captions}
	<span class="inline-flex flex-col items-center gap-2">
		{@render button()}
		<!-- Both captions share one grid cell, so the column never changes width
		     as they swap. The old word leaves faster than the new one arrives. -->
		<span aria-hidden="true" class="text-muted-foreground grid text-xs font-medium">
			{#each captions as caption, i (i)}
				<span
					class={cn(
						'col-start-1 row-start-1 text-center whitespace-nowrap transition-[opacity,filter,translate] ease-out',
						pressed === (i === 1)
							? 'translate-y-0 opacity-100 blur-none duration-(--duration-base)'
							: 'translate-y-0.5 opacity-0 blur-[4px] duration-(--duration-instant) motion-reduce:translate-y-0 motion-reduce:blur-none'
					)}
				>
					{caption}
				</span>
			{/each}
		</span>
	</span>
{:else}
	{@render button()}
{/if}
