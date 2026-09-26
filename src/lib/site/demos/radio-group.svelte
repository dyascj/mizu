<script lang="ts">
	import * as RadioGroup from '$lib/components/ui/radio-group';

	const models = [
		{
			value: 'fast',
			title: 'Fast',
			description: 'Quick answers for everyday questions.',
			cost: '1×'
		},
		{
			value: 'balanced',
			title: 'Balanced',
			description: 'Stronger writing and code, still quick.',
			cost: '2×',
			badge: 'Default'
		},
		{
			value: 'deep',
			title: 'Deep reasoning',
			description: 'Thinks longer before it answers hard problems.',
			cost: '6×'
		}
	];

	let value = $state('balanced');
</script>

<div class="flex w-full max-w-md flex-col gap-3">
	<p id="model-label" class="text-sm font-medium">Model for this chat</p>
	<RadioGroup.Root bind:value aria-labelledby="model-label" class="auto-rows-fr gap-3">
		{#each models as model (model.value)}
			<RadioGroup.Card value={model.value}>
				<span class="flex min-w-0 flex-1 flex-col gap-0.5">
					<span class="flex flex-wrap items-center gap-x-2 gap-y-1">
						<span class="font-semibold tracking-tight">{model.title}</span>
						{#if model.badge}
							<span
								class="bg-secondary text-muted-foreground group-hover/card:bg-card rounded-full px-2 py-0.5 text-xs font-medium transition-[background-color] duration-(--duration-fast) ease-out"
							>
								{model.badge}
							</span>
						{/if}
					</span>
					<span class="text-muted-foreground text-sm text-pretty">{model.description}</span>
				</span>
				<span class="flex shrink-0 flex-col items-end">
					<span class="font-semibold tabular-nums">{model.cost}</span>
					<span class="text-muted-foreground text-xs">credits</span>
				</span>
			</RadioGroup.Card>
		{/each}
	</RadioGroup.Root>
</div>
