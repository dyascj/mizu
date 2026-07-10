<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';
	import { getDockContext } from './context.js';

	type Props = {
		/** Optional caption shown in a floating bubble above the tile on hover/focus. */
		label?: string;
		/** Render as a link instead of a button. */
		href?: string;
		class?: string;
		ref?: HTMLElement | null;
		children?: Snippet;
	} & HTMLButtonAttributes &
		HTMLAnchorAttributes;

	let {
		label,
		href = undefined,
		class: className,
		ref = $bindable(null),
		children,
		...rest
	}: Props = $props();

	const dock = getDockContext();

	// Resting tile size; the lens scales up from this, never the layout box.
	const BASE = 44; // px, matches size-11

	// The tile's resting horizontal center, in viewport px. Measured at rest (on
	// mount + resize) so every item, not just the hovered one, has a stable
	// center and the whole row swells together. Measuring while scaled would
	// drift the center, so we never sample mid-magnify.
	let center = $state<number | null>(null);

	function measure() {
		if (!ref) return;
		const rect = ref.getBoundingClientRect();
		center = rect.left + rect.width / 2;
	}

	$effect(() => {
		// Runs only in the browser; SSR renders at rest (scale 1).
		measure();
		window.addEventListener('resize', measure);
		// Layout settles a tick after fonts/icons paint; catch that too.
		const id = requestAnimationFrame(measure);
		return () => {
			window.removeEventListener('resize', measure);
			cancelAnimationFrame(id);
		};
	});

	// Magnify factor in [1, magnification], falling off with a cosine curve so
	// neighbors ease up too and the row reads as one continuous swell, no jitter.
	const scale = $derived.by(() => {
		const x = dock.pointerX;
		if (x === null || center === null) return 1;
		const delta = Math.abs(x - center);
		if (delta >= dock.distance) return 1;
		// 1 at the cursor → 0 at the edge of the influence radius.
		const falloff = (Math.cos((delta / dock.distance) * Math.PI) + 1) / 2;
		return 1 + (dock.magnification - 1) * falloff;
	});

	// Lift the tile as it grows so the magnified row hugs the dock's top edge,
	// the way Aqua icons rise toward the cursor.
	const lift = $derived(-(scale - 1) * BASE * 0.45);

	const tileClass = $derived(
		cn(
			'mizu-dock-item group relative flex size-11 shrink-0 origin-bottom items-center justify-center rounded-xl text-foreground outline-none',
			// tile surface
			'bg-secondary shadow-lg',
			// springy settle when the pointer leaves; magnify itself stays pointer-reactive
			'transition-[scale,translate,box-shadow] duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]',
			'hover:shadow-sm active:scale-[0.96]',
			'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
			className
		)
	);
	const tileStyle = $derived(`scale: ${scale}; translate: 0 ${lift}px;`);
</script>

{#snippet inner()}
	<!-- icon, above the sheen -->
	<span class="relative z-10 flex items-center justify-center text-mizu-700 dark:text-mizu-100">
		{@render children?.()}
	</span>

	{#if label}
		<!-- caption bubble; appears on hover/focus, lifts with the tile -->
		<span
			class="mizu-dock-label bg-popover pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 translate-y-1 scale-95 rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap text-popover-foreground opacity-0 shadow-lg transition-[opacity,scale,translate] duration-150 ease-out group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:scale-100 group-focus-visible:opacity-100"
		>
			{label}
		</span>
	{/if}
{/snippet}

{#if href}
	<a
		bind:this={ref}
		{href}
		aria-label={label}
		onfocus={measure}
		class={tileClass}
		style={tileStyle}
		{...rest}
	>
		{@render inner()}
	</a>
{:else}
	<button
		bind:this={ref}
		type="button"
		aria-label={label}
		onfocus={measure}
		class={tileClass}
		style={tileStyle}
		{...rest}
	>
		{@render inner()}
	</button>
{/if}

<style>
	/* Self-contained reduced-motion guard: freeze the lens and bubble so the
	   dock is a static row, even when copied out without app.css. */
	@media (prefers-reduced-motion: reduce) {
		.mizu-dock-item {
			scale: 1 !important;
			translate: none !important;
			transition: none;
		}
		.mizu-dock-label {
			transition: opacity 0.001ms;
		}
	}
</style>
