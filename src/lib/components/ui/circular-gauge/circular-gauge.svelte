<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		value: number;
		size?: number;
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

	const clamped = $derived(Math.max(0, Math.min(100, value)));
	const radius = $derived((size - strokeWidth) / 2);
	const circumference = $derived(2 * Math.PI * radius);
	const dashOffset = $derived(circumference - (clamped / 100) * circumference);
	const center = $derived(size / 2);
</script>

<div
	bind:this={ref}
	role="meter"
	aria-valuenow={Math.round(clamped)}
	aria-valuemin={0}
	aria-valuemax={100}
	aria-label={label}
	class={cn('relative inline-flex items-center justify-center', className)}
	style="width: {size}px; height: {size}px;"
	{...rest}
>
	<svg width={size} height={size} viewBox="0 0 {size} {size}" class="-rotate-90" aria-hidden="true">
		<defs>
			<linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
				<stop offset="0%" stop-color="#5cd5ff" />
				<stop offset="100%" stop-color="#0090d9" />
			</linearGradient>
		</defs>
		<circle
			cx={center}
			cy={center}
			r={radius}
			fill="none"
			stroke="currentColor"
			class="text-muted-foreground/15"
			stroke-width={strokeWidth}
		/>
		<circle
			cx={center}
			cy={center}
			r={radius}
			fill="none"
			stroke="url(#{gradientId})"
			stroke-width={strokeWidth}
			stroke-linecap="round"
			stroke-dasharray={circumference}
			stroke-dashoffset={dashOffset}
			class="transition-[stroke-dashoffset] duration-700 ease-out [filter:drop-shadow(0_0_6px_rgba(1,178,255,0.5))]"
		/>
	</svg>
	<div
		class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5"
	>
		{@render children?.()}
		{#if showValue}
			<span class="font-display text-2xl leading-none font-semibold tabular-nums text-foreground">
				{Math.round(clamped)}
			</span>
		{/if}
		{#if label}
			<span
				class="text-[0.7rem] leading-none font-medium tracking-wide text-muted-foreground uppercase"
			>
				{label}
			</span>
		{/if}
	</div>
</div>
