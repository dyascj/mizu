<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** Overall height of the divider in px. */
		height?: number;
		/** Water colour. Defaults to the aqua brand token. */
		color?: string;
		/** Set false to freeze the surface (also frozen under reduced motion). */
		animated?: boolean;
		class?: string;
		ref?: HTMLDivElement | null;
	};

	let {
		height = 24,
		color = 'var(--primary)',
		animated = true,
		class: className,
		ref = $bindable(null),
		...rest
	}: Props = $props();

	// A wave built from cubic curves across a 0 → 800 span (four 200-unit
	// wavelengths inside the 800-wide viewBox). Crest sits at y=4, trough at
	// y=20, midline at y=12; the path then drops to the foot (y=24) to close a
	// fillable surface. Tiling this with a copy offset by 800 and animating a
	// shift of exactly one wavelength (200) loops with no visible seam.
	// prettier-ignore
	const wave =
		'M0 12 ' +
		'C 50 4, 150 4, 200 12 ' +
		'S 350 20, 400 12 ' +
		'S 550 4, 600 12 ' +
		'S 750 20, 800 12 ' +
		'L 800 24 L 0 24 Z';
</script>

<div
	bind:this={ref}
	role="separator"
	aria-orientation="horizontal"
	class={cn('mizu-liquid-divider relative w-full overflow-hidden', className)}
	style="height: {height}px; --wave-color: {color};"
	{...rest}
>
	<svg
		class="absolute inset-0 h-full w-full"
		viewBox="0 0 800 24"
		preserveAspectRatio="none"
		aria-hidden="true"
		focusable="false"
	>
		<defs>
			<linearGradient id="mizu-liquid-fill" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0%" stop-color="var(--wave-color)" stop-opacity="0.42" />
				<stop offset="55%" stop-color="var(--wave-color)" stop-opacity="0.26" />
				<stop offset="100%" stop-color="var(--wave-color)" stop-opacity="0.14" />
			</linearGradient>
		</defs>

		<!-- Back wave: deeper, slower, drifting left → a sense of depth. The CSS
		     animation drives the outer group's transform; any static offset lives
		     on an inner group so the two never collide. -->
		<g class="mizu-wave mizu-wave-back" class:mizu-paused={!animated}>
			<path d={wave} fill="url(#mizu-liquid-fill)" opacity="0.55" />
			<path d={wave} fill="url(#mizu-liquid-fill)" opacity="0.55" transform="translate(800 0)" />
		</g>

		<!-- Front wave: brighter, faster, drifting right, offset half a wavelength
		     (100 units) on an inner group so the animated transform stays clean. -->
		<g class="mizu-wave mizu-wave-front" class:mizu-paused={!animated}>
			<g transform="translate(-100 0)">
				<path d={wave} fill="url(#mizu-liquid-fill)" />
				<path d={wave} fill="url(#mizu-liquid-fill)" transform="translate(800 0)" />
				<!-- Crisp specular skin so it reads as a water surface, not a blob. -->
				<path
					d="M0 12 C 50 4, 150 4, 200 12 S 350 20, 400 12 S 550 4, 600 12 S 750 20, 800 12"
					fill="none"
					stroke="var(--wave-color)"
					stroke-opacity="0.5"
					stroke-width="1"
					vector-effect="non-scaling-stroke"
				/>
			</g>
		</g>
	</svg>
</div>

<style>
	/* Translate by exactly one wavelength (200 viewBox units) so the tiled paths
	   loop with no visible seam. `transform-box: view-box` makes these lengths
	   resolve in the SVG's own coordinate system rather than the group's bbox,
	   so the shift is precise regardless of element width. Opposing directions
	   read as a moving current. */
	@keyframes mizu-drift-left {
		from {
			transform: translateX(0);
		}
		to {
			transform: translateX(-200px);
		}
	}
	@keyframes mizu-drift-right {
		from {
			transform: translateX(-200px);
		}
		to {
			transform: translateX(0);
		}
	}

	.mizu-wave {
		transform-box: view-box;
		transform-origin: 0 0;
		will-change: transform;
	}
	.mizu-wave-back {
		animation: mizu-drift-left 9s linear infinite;
	}
	.mizu-wave-front {
		animation: mizu-drift-right 6s linear infinite;
	}

	/* `animated={false}` freezes the surface without removing the wave shape. */
	.mizu-paused {
		animation: none;
	}

	/* Self-contained reduced-motion guard so the wave freezes even when this file
	   is copied out without Mizu's global app.css reset. */
	@media (prefers-reduced-motion: reduce) {
		.mizu-wave-back,
		.mizu-wave-front {
			animation: none;
		}
	}
</style>
