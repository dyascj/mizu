<script lang="ts">
	import * as Carousel from '$lib/components/ui/carousel';
	import BookOpenText from '@lucide/svelte/icons/book-open-text';
	import CalendarCheck from '@lucide/svelte/icons/calendar-check';
	import ChartLine from '@lucide/svelte/icons/chart-line';
	import GitPullRequest from '@lucide/svelte/icons/git-pull-request';
	import Inbox from '@lucide/svelte/icons/inbox';
	import Plane from '@lucide/svelte/icons/plane';

	const agents = [
		{
			title: 'Research assistant',
			text: 'Reads the sources, then writes a cited brief.',
			icon: BookOpenText,
			working: 'Reading 14 sources'
		},
		{
			title: 'Meeting notes',
			text: 'Turns a call into decisions and owners.',
			icon: CalendarCheck
		},
		{
			title: 'Code review',
			text: 'Flags risky changes before a person looks.',
			icon: GitPullRequest,
			working: 'Checking 3 files'
		},
		{
			title: 'Inbox triage',
			text: 'Sorts mail by what needs you today.',
			icon: Inbox
		},
		{
			title: 'Trip planner',
			text: 'Books around your calendar, not over it.',
			icon: Plane
		},
		{
			title: 'Data analyst',
			text: 'Answers questions about your sheets in plain words.',
			icon: ChartLine,
			working: 'Charting Q3 revenue'
		}
	];
</script>

<Carousel.Root effect="focus" class="w-full max-w-lg" aria-label="Agent templates">
	<Carousel.Content>
		{#each agents as agent (agent.title)}
			<Carousel.Item class="basis-[min(17.5rem,85%)]">
				<div class="bg-card flex h-48 flex-col gap-1.5 rounded-2xl p-6 shadow-sm">
					<div class="mb-auto flex items-center justify-between gap-3">
						<span
							class="bg-secondary text-muted-foreground grid size-9 place-items-center rounded-full"
						>
							<agent.icon class="size-4" aria-hidden="true" />
						</span>
						{#if agent.working}
							<!-- A working state, so it shimmers; only the centered card plays. -->
							<span class="text-shimmer animate-shimmer text-xs font-medium">{agent.working}</span>
						{/if}
					</div>
					<p class="font-medium tracking-tight">{agent.title}</p>
					<p class="text-muted-foreground text-sm text-pretty">{agent.text}</p>
				</div>
			</Carousel.Item>
		{/each}
	</Carousel.Content>
	<div class="mt-4 flex justify-center gap-3">
		<Carousel.Previous class="static translate-y-0" />
		<Carousel.Next class="static translate-y-0" />
	</div>
</Carousel.Root>
