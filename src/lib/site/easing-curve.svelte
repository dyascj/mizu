<script lang="ts">
	import type { Easing } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	let {
		name,
		token,
		durationToken,
		easing,
		note,
		class: className
	}: {
		name: string;
		/** CSS custom property that holds the easing, without var(). */
		token: string;
		/** CSS custom property that holds the paired duration. */
		durationToken: string;
		/** JavaScript twin of the token, used to draw the curve. */
		easing: Easing;
		note: string;
		class?: string;
	} = $props();

	const size = 120;
	const pad = 14;
	// Springs overshoot, so leave headroom above the resting line.
	const top = 0.15;
	const path = $derived(
		Array.from({ length: 81 }, (_, i) => {
			const t = i / 80;
			const x = pad + t * (size - pad * 2);
			const y = size - pad - (easing(t) / (1 + top)) * (size - pad * 2);
			return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
		}).join(' ')
	);
	const rest = size - pad - (1 / (1 + top)) * (size - pad * 2);

	let played = $state(false);
</script>

<button
	type="button"
	onclick={() => (played = !played)}
	class={cn(
		'bg-card hover:bg-secondary/60 focus-visible:ring-ring group flex w-full flex-col gap-4 rounded-3xl p-5 text-left shadow-sm transition-colors outline-none focus-visible:ring-2',
		className
	)}
	aria-label="Play {name}"
>
	<svg viewBox="0 0 {size} {size}" class="text-foreground aspect-square w-full" aria-hidden="true">
		<line
			x1={pad}
			x2={size - pad}
			y1={rest}
			y2={rest}
			class="stroke-border"
			stroke-dasharray="2 3"
		/>
		<line x1={pad} x2={size - pad} y1={size - pad} y2={size - pad} class="stroke-border" />
		<path d={path} fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
	</svg>
	<div class="bg-secondary relative h-2 rounded-full">
		<span
			class="bg-foreground absolute top-1/2 left-0 size-4 -translate-y-1/2 rounded-full shadow-sm"
			style:left={played ? 'calc(100% - 1rem)' : '0'}
			style:transition-property="left"
			style:transition-duration="var({durationToken})"
			style:transition-timing-function="var({token})"
		></span>
	</div>
	<div>
		<p class="text-sm font-medium">{name}</p>
		<code class="text-muted-foreground mt-1 block text-xs">{token}</code>
		<p class="text-muted-foreground mt-2 text-sm leading-relaxed">{note}</p>
	</div>
</button>
