<script lang="ts">
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import Undo2 from '@lucide/svelte/icons/undo-2';
	import { Button } from '$lib/components/ui/button';
	import { NumberTicker } from '$lib/components/ui/number-ticker';
	import { Progress } from '$lib/components/ui/progress';

	const limit = 250_000;
	const pricePerToken = 0.000_015;

	let runs = $state<number[]>([]);
	const tokens = $derived(18_420 + runs.reduce((sum, used) => sum + used, 0));
	const share = $derived(tokens / limit);

	function runPrompt() {
		const used = 2_000 + Math.round(Math.random() * 14_000);
		// A new cycle starts once the month's allowance runs out.
		runs = tokens + used > limit ? [] : [...runs, used];
	}
</script>

<div class="bg-card flex w-full max-w-sm flex-col gap-4 rounded-3xl p-5 shadow-sm">
	<div class="flex items-center justify-between gap-3 text-sm">
		<span class="text-muted-foreground">Tokens this month</span>
		<NumberTicker
			value={tokens * pricePerToken}
			locale="en-US"
			format={{ style: 'currency', currency: 'USD' }}
			class="text-muted-foreground"
		/>
	</div>
	<NumberTicker
		value={tokens}
		locale="en-US"
		class="font-display text-4xl font-semibold tracking-tight"
	/>
	<div class="flex flex-col gap-2">
		<Progress value={share * 100} aria-label="Monthly token limit used" class="h-1.5" />
		<p class="text-muted-foreground text-xs">
			<NumberTicker
				value={share}
				locale="en-US"
				format={{ style: 'percent', maximumFractionDigits: 1 }}
			/> of 250,000
		</p>
	</div>
	<div class="flex flex-wrap items-center gap-2">
		<Button variant="secondary" size="sm" onclick={runPrompt}>
			<Sparkles class="size-3.5" />
			Run a prompt
		</Button>
		<Button
			variant="ghost"
			size="sm"
			disabled={runs.length === 0}
			onclick={() => (runs = runs.slice(0, -1))}
		>
			<Undo2 class="size-3.5 rtl:-scale-x-100" />
			Undo
		</Button>
		<span class="text-muted-foreground ms-auto text-xs">
			Run <NumberTicker value={412 + runs.length} odometer={4} class="text-foreground" />
		</span>
	</div>
</div>
