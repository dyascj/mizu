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

	const clamped = $derived(Math.max(min, Math.min(max, value)));
	const pct = $derived(max > min ? ((clamped - min) / (max - min)) * 100 : 0);

	/* HTML <meter> zone algorithm. `low`/`high` carve the range into three bands;
	   `optimum` says which band is "good", which is sub-optimal, which is poor. */
	const zone = $derived.by(() => {
		const lo = low ?? min;
		const hi = high ?? max;
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

	const formatted = $derived(format ? format(value) : String(value));
</script>

<div class={cn('w-full', className)} {...rest}>
	{#if label || showValue}
		<div class="mb-1.5 flex items-center justify-between text-sm">
			{#if label}
				<span class="text-muted-foreground">{label}</span>
			{/if}
			{#if showValue}
				<span class="font-semibold tabular-nums text-foreground">{formatted}</span>
			{/if}
		</div>
	{/if}

	<div
		role="meter"
		aria-valuenow={value}
		aria-valuemin={min}
		aria-valuemax={max}
		aria-label={label}
		class="relative h-2.5 w-full overflow-hidden rounded-full bg-secondary"
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
