<script lang="ts">
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import { Button } from '$lib/components/ui/button';
	import { NumberTicker } from '$lib/components/ui/number-ticker';
	import { Progress } from '$lib/components/ui/progress';

	const limit = 250_000;
	const pricePerToken = 0.000_015;

	let tokens = $state(18_420);
	const share = $derived(tokens / limit);

	function runPrompt() {
		const used = 2_000 + Math.round(Math.random() * 14_000);
		tokens = tokens + used > limit ? used : tokens + used;
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
	<Button variant="secondary" size="sm" class="self-start" onclick={runPrompt}>
		<Sparkles class="size-3.5" />
		Run a prompt
	</Button>
</div>
