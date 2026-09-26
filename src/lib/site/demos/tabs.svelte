<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs';

	const sections = [
		{
			value: 'summary',
			label: 'Summary',
			strong: 'Finished in 2 min 14 s.',
			rest: 'Read 38 support tickets and grouped them into five themes.'
		},
		{
			value: 'steps',
			label: 'Steps',
			strong: '12 steps,',
			rest: 'including two retries when the ticket export timed out.'
		},
		{
			value: 'sources',
			label: 'Sources',
			strong: '38 tickets',
			rest: 'from the last seven days, plus the refund policy doc.'
		},
		{
			value: 'tools',
			label: 'Tool calls',
			strong: 'search_tickets',
			rest: 'ran 4 times; summarize ran once per theme.'
		},
		{
			value: 'output',
			label: 'Output',
			strong: 'A one-page brief',
			rest: 'with the top complaint first: slow refunds for annual plans.'
		},
		{
			value: 'usage',
			label: 'Usage',
			strong: '84k input tokens,',
			rest: '6k output. About 9 cents at current rates.'
		},
		{
			value: 'logs',
			label: 'Logs',
			strong: 'No errors.',
			rest: 'Two warnings about tickets with empty bodies.'
		}
	];

	let tab = $state('summary');
</script>

<div class="bg-card flex h-60 w-full max-w-md min-w-0 flex-col rounded-2xl p-3 shadow-sm">
	<div class="px-3 pt-1 pb-2">
		<p class="text-sm font-semibold tracking-tight">Support digest</p>
		<p class="text-muted-foreground text-xs">Research agent · Run 42</p>
	</div>
	<Tabs.Root bind:value={tab} class="min-w-0">
		<Tabs.List variant="underline" overflow="scroll" aria-label="Run details">
			{#each sections as section (section.value)}
				<Tabs.Trigger value={section.value}>{section.label}</Tabs.Trigger>
			{/each}
		</Tabs.List>
		{#each sections as section (section.value)}
			<Tabs.Content value={section.value} class="px-3">
				<p class="text-muted-foreground text-sm leading-relaxed text-pretty">
					<span class="text-foreground">{section.strong}</span>
					{section.rest}
				</p>
			</Tabs.Content>
		{/each}
	</Tabs.Root>
</div>
