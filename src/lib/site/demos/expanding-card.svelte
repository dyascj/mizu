<script lang="ts">
	import { ExpandingCard } from '$lib/components/ui/expanding-card';

	const briefs = [
		{
			title: 'Competitor pricing scan',
			meta: 'Sep 18',
			summary: 'Four rivals moved to usage-based plans this quarter.',
			detail:
				'The research agent read 38 pricing pages and changelogs. Three competitors now bill per seat plus metered tokens, and one dropped its free tier. Usage pricing correlates with a higher entry price, not a lower one.'
		},
		{
			title: 'Churn interviews',
			meta: 'Aug 30',
			summary: 'Onboarding, not price, drove most cancellations.',
			detail:
				'Summarised from 22 call transcripts. Two thirds of churned teams never connected a data source, and most of them left within the first week. Price came up in five calls, always after onboarding had stalled.'
		},
		{
			title: 'Model latency review',
			meta: 'Aug 12',
			summary: 'Streaming halves the wait people perceive.',
			detail:
				'Median time to first token is 420ms on the small model and 1.1s on the large one. With streaming on, satisfaction scores matched across both, so the large model can stay the default for long answers.'
		}
	];
</script>

<ul class="flex w-full max-w-sm flex-col gap-3">
	{#each briefs as brief (brief.title)}
		<li>
			<ExpandingCard title={brief.title} meta={brief.meta} summary={brief.summary}>
				<p>{brief.detail}</p>
			</ExpandingCard>
		</li>
	{/each}
</ul>
