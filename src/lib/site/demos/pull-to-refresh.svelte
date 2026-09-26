<script lang="ts">
	import { PullToRefresh } from '$lib/components/ui/pull-to-refresh';
	import { blurIn, duration } from '$lib/components/ui/motion';
	import Bot from '@lucide/svelte/icons/bot';
	import Code from '@lucide/svelte/icons/code';
	import FileText from '@lucide/svelte/icons/file-text';
	import Search from '@lucide/svelte/icons/search';
	import Mail from '@lucide/svelte/icons/mail';
	import ChartLine from '@lucide/svelte/icons/chart-line';

	type Run = { id: string; agent: string; icon: typeof Bot; text: string; time: string };

	let runs = $state<Run[]>([
		{
			id: 'r1',
			agent: 'Research agent',
			icon: Search,
			text: 'Summarized 14 sources on onboarding drop-off.',
			time: '4m'
		},
		{
			id: 'r2',
			agent: 'Code review',
			icon: Code,
			text: 'Approved #482 with two small suggestions.',
			time: '12m'
		},
		{
			id: 'r3',
			agent: 'Inbox triage',
			icon: Mail,
			text: 'Sorted 38 emails and drafted 5 replies.',
			time: '26m'
		},
		{
			id: 'r4',
			agent: 'Metrics digest',
			icon: ChartLine,
			text: 'Weekly active teams up 6% since Monday.',
			time: '41m'
		},
		{
			id: 'r5',
			agent: 'Docs writer',
			icon: FileText,
			text: 'Drafted the changelog for release 0.5.',
			time: '1h'
		},
		{
			id: 'r6',
			agent: 'Support bot',
			icon: Bot,
			text: 'Resolved 112 tickets, escalated 3.',
			time: '2h'
		},
		{
			id: 'r7',
			agent: 'Research agent',
			icon: Search,
			text: 'Compared pricing pages of four competitors.',
			time: '3h'
		}
	]);

	const incoming: Omit<Run, 'id' | 'time'>[] = [
		{ agent: 'Code review', icon: Code, text: 'Flagged a missing null check in #486.' },
		{ agent: 'Support bot', icon: Bot, text: 'Answered 9 new tickets from the help center.' },
		{ agent: 'Metrics digest', icon: ChartLine, text: 'Signups crossed 2,000 for the week.' },
		{ agent: 'Docs writer', icon: FileText, text: 'Updated the API guide for streaming.' }
	];
	let next = 0;

	async function load() {
		// Stands in for a network round trip.
		await new Promise((resolve) => setTimeout(resolve, 1200));
		const fresh = [0, 1].map(() => {
			const n = next++;
			return { ...incoming[n % incoming.length], id: `new-${n}`, time: 'now' };
		});
		runs = [...fresh, ...runs].slice(0, 30);
		return `${fresh.length} new runs`;
	}
</script>

<div class="flex flex-col items-center gap-3">
	<!-- A phone: the bezel is a gray fill around the screen. -->
	<div class="bg-secondary h-[30rem] w-[min(20rem,100%)] rounded-[2.75rem] p-2.5 shadow-md">
		<div class="bg-background flex h-full flex-col overflow-hidden rounded-[2.125rem]">
			<div class="flex h-14 shrink-0 items-center px-5">
				<h3 class="text-[1.0625rem] font-semibold tracking-tight">Agent runs</h3>
			</div>
			<PullToRefresh onRefresh={load} label="Agent runs" class="flex-1">
				<ul class="divide-border divide-y">
					{#each runs as run (run.id)}
						{@const Icon = run.icon}
						<li
							class="flex gap-3 px-5 py-3.5"
							in:blurIn={{ blur: 4, y: 0, duration: duration.slow }}
						>
							<span
								class="bg-secondary text-muted-foreground grid size-9 shrink-0 place-items-center rounded-full"
							>
								<Icon class="size-4" aria-hidden="true" />
							</span>
							<div class="min-w-0">
								<p class="flex items-baseline gap-1.5 text-sm">
									<span class="truncate font-medium">{run.agent}</span>
									<span class="text-muted-foreground shrink-0 text-xs">{run.time}</span>
								</p>
								<p class="mt-0.5 text-sm leading-5 text-pretty">{run.text}</p>
							</div>
						</li>
					{/each}
				</ul>
			</PullToRefresh>
		</div>
	</div>
	<p class="text-muted-foreground text-sm">Drag the list down to refresh</p>
</div>
