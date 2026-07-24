<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		value: number;
		/** Diameter in pixels, clamped to the inclusive range 16 to 512. */
		size?: number;
		/** Stroke width in pixels, clamped between 1 and half the resolved size. */
		strokeWidth?: number;
		label?: string;
		showValue?: boolean;
		class?: string;
		ref?: HTMLDivElement | null;
		children?: Snippet;
	};

	let {
		value,
		size = 120,
		strokeWidth = 10,
		label,
		showValue = true,
		class: className,
		ref = $bindable(null),
		children,
		...rest
	}: Props = $props();

	// Deterministic unique id for the gradient so multiple gauges don't collide.
	const uid = $props.id();
	const gradientId = `mizu-gauge-${uid}`;

	const normalizedSize = $derived(Math.min(512, Math.max(16, Number.isFinite(size) ? size : 120)));
	const normalizedStroke = $derived(
		Math.min(normalizedSize / 2, Math.max(1, Number.isFinite(strokeWidth) ? strokeWidth : 10))
	);
	const clamped = $derived(Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0)));
	const radius = $derived((normalizedSize - normalizedStroke) / 2);
	const circumference = $derived(2 * Math.PI * radius);
	const dashOffset = $derived(circumference - (clamped / 100) * circumference);
	const center = $derived(normalizedSize / 2);
</script>

<div
	bind:this={ref}
	role="meter"
	aria-valuenow={Math.round(clamped)}
	aria-valuemin={0}
	aria-valuemax={100}
	aria-label={label ?? 'Progress'}
	class={cn('relative inline-flex items-center justify-center', className)}
	style="width: {normalizedSize}px; height: {normalizedSize}px;"
	{...rest}
>
	<svg
		width={normalizedSize}
		height={normalizedSize}
		viewBox="0 0 {normalizedSize} {normalizedSize}"
		class="-rotate-90"
		aria-hidden="true"
	>
		<defs>
			<linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
				<stop offset="0%" stop-color="color-mix(in oklab, var(--primary) 55%, white)" />
				<stop offset="100%" stop-color="var(--primary)" />
			</linearGradient>
		</defs>
		<circle
			cx={center}
			cy={center}
			r={radius}
			fill="none"
			stroke="currentColor"
			class="text-muted-foreground/15"
			stroke-width={normalizedStroke}
		/>
		<circle
			cx={center}
			cy={center}
			r={radius}
			fill="none"
			stroke="url(#{gradientId})"
			stroke-width={normalizedStroke}
			stroke-linecap="round"
			stroke-dasharray={circumference}
			stroke-dashoffset={dashOffset}
			class="transition-[stroke-dashoffset] duration-700 ease-out"
			style="filter: drop-shadow(0 0 6px color-mix(in oklab, var(--primary) 50%, transparent));"
		/>
	</svg>
	<div
		class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5"
	>
		{@render children?.()}
		{#if showValue}
			<span class="font-display text-foreground text-2xl leading-none font-semibold tabular-nums">
				{Math.round(clamped)}
			</span>
		{/if}
		{#if label}
			<span
				class="text-muted-foreground text-[0.7rem] leading-none font-medium tracking-wide uppercase"
			>
				{label}
			</span>
		{/if}
	</div>
</div>
