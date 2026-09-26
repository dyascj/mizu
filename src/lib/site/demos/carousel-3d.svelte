<script lang="ts">
	import { Carousel3d } from '$lib/components/ui/carousel-3d';

	const agents = [
		{ title: 'Deep research', description: 'Reads forty sources, cites every claim.' },
		{ title: 'Inbox triage', description: 'Sorts, drafts, and flags what needs you.' },
		{ title: 'Code review', description: 'Leaves comments on every pull request.' },
		{ title: 'Meeting notes', description: 'Decisions and owners, minutes after the call.' },
		{ title: 'Support replies', description: 'Answers from your help center, in your voice.' },
		{ title: 'Data cleanup', description: 'Dedupes rows and fixes broken dates.' },
		{ title: 'Release notes', description: 'Turns merged work into a changelog.' },
		{ title: 'Trip planner', description: 'Flights, stays, and a day by day plan.' }
	];
</script>

<div class="flex w-full flex-col items-center gap-3">
	<p class="text-muted-foreground text-sm">Pick an agent to start from</p>
	<Carousel3d items={agents} label="Agent templates" />
</div>
