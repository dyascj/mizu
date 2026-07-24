<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = HTMLAttributes<HTMLDivElement> & {
		value: number;
		min?: number;
		max?: number;
		low?: number;
		high?: number;
		optimum?: number;
		label?: string;
		showValue?: boolean;
		format?: (v: number) => string;
		class?: string;
	};

	let {
		value,
		min = 0,
		max = 100,
		low,
		high,
		optimum,
		label,
		showValue = false,
		format,
		class: className,
		...rest
	}: Props = $props();

	const normalizedMin = $derived(Number.isFinite(min) ? min : 0);
	const normalizedMax = $derived(
		Number.isFinite(max) && max > normalizedMin ? max : normalizedMin + 1
	);
	const normalizedValue = $derived(Number.isFinite(value) ? value : normalizedMin);
	const clamped = $derived(Math.max(normalizedMin, Math.min(normalizedMax, normalizedValue)));
	const pct = $derived(((clamped - normalizedMin) / (normalizedMax - normalizedMin)) * 100);

	/* HTML <meter> zone algorithm. `low`/`high` carve the range into three bands;
	   `optimum` says which band is "good", which is sub-optimal, which is poor. */
	const zone = $derived.by(() => {
		const lo = low ?? normalizedMin;
		const hi = high ?? normalizedMax;
		if (optimum == null) return 'primary';

		if (optimum < lo) {
			// optimum sits in the low band: lower is better
			if (clamped <= lo) return 'success';
			if (clamped <= hi) return 'warning';
			return 'destructive';
		}
		if (optimum > hi) {
			// optimum sits in the high band: higher is better
			if (clamped >= hi) return 'success';
			if (clamped >= lo) return 'warning';
			return 'destructive';
		}
		// optimum sits in the middle band: the extremes are sub-optimal
		if (clamped >= lo && clamped <= hi) return 'success';
		return 'warning';
	});

	const fillGradient = $derived(
		{
			success: 'bg-success',
			warning: 'bg-warning',
			destructive: 'bg-destructive',
			primary: 'bg-primary'
		}[zone]
	);

	const formatted = $derived(format ? format(clamped) : String(clamped));
</script>

<div class={cn('w-full', className)} {...rest}>
	{#if label || showValue}
		<div class="mb-1.5 flex items-center justify-between text-sm">
			{#if label}
				<span class="text-muted-foreground">{label}</span>
			{/if}
			{#if showValue}
				<span class="text-foreground font-semibold tabular-nums">{formatted}</span>
			{/if}
		</div>
	{/if}

	<div
		role="meter"
		aria-valuenow={clamped}
		aria-valuemin={normalizedMin}
		aria-valuemax={normalizedMax}
		aria-label={label ?? 'Meter'}
		class="bg-secondary relative h-2.5 w-full overflow-hidden rounded-full"
	>
		<div
			class={cn(
				' relative h-full overflow-hidden rounded-full transition-[width] duration-300 ease-out',
				fillGradient
			)}
			style="width: {pct}%"
		></div>
	</div>
</div>
