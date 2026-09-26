<script lang="ts">
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import { MediaQuery } from 'svelte/reactivity';
	import { blurIn, duration } from '$lib/components/ui/motion';
	import * as Pagination from '$lib/components/ui/pagination';

	const perPage = 4;
	const count = 80;
	const tasks = [
		'Summarize support tickets',
		'Draft the weekly update',
		'Triage new bug reports',
		'Translate release notes',
		'Tag customer feedback',
		'Check links in the docs',
		'Answer billing questions'
	];

	// Deterministic, so the server and the browser agree.
	function run(n: number) {
		const seconds = ((n * 7919) % 290) + 20;
		return {
			id: `Run ${1000 + n}`,
			task: tasks[(n * 5) % tasks.length],
			time: `${Math.floor(seconds / 60)}m ${seconds % 60}s`,
			failed: n % 11 === 0
		};
	}

	// Seven places when there is room for them, five on a phone.
	const wide = new MediaQuery('(min-width: 480px)', true);

	let page = $state(1);
	const first = $derived((page - 1) * perPage + 1);
	const rows = $derived(Array.from({ length: perPage }, (_, i) => run(first + i)));

	const arrow = 'size-8 px-0 sm:size-9';
</script>

<div class="flex w-full max-w-md flex-col gap-4">
	<div class="bg-card rounded-2xl p-2 shadow-sm">
		<p class="text-muted-foreground px-3 pt-1.5 pb-2 text-sm tabular-nums" aria-live="polite">
			Runs {first} to {first + perPage - 1} of {count}
		</p>
		{#key page}
			<ul in:blurIn={{ duration: duration.base, blur: 4, y: 0 }}>
				{#each rows as row (row.id)}
					<li class="flex h-12 items-center gap-3 px-3">
						<span class="min-w-0 flex-1 truncate text-sm">{row.task}</span>
						<span class="text-muted-foreground hidden font-mono text-xs sm:inline">{row.id}</span>
						<span
							class="w-14 text-right text-sm tabular-nums {row.failed
								? 'text-destructive'
								: 'text-muted-foreground'}"
						>
							{row.failed ? 'Failed' : row.time}
						</span>
					</li>
				{/each}
			</ul>
		{/key}
	</div>

	<Pagination.Root {count} {perPage} bind:page aria-label="Run history pages">
		<Pagination.Content class="flex-nowrap gap-0.5 sm:gap-1">
			<Pagination.Item>
				<Pagination.PrevButton aria-label="Previous page" class={arrow}>
					<ChevronLeft class="size-4" aria-hidden="true" />
				</Pagination.PrevButton>
			</Pagination.Item>
			<Pagination.Pages slots={wide.current ? 7 : 5} />
			<Pagination.Item>
				<Pagination.NextButton aria-label="Next page" class={arrow}>
					<ChevronRight class="size-4" aria-hidden="true" />
				</Pagination.NextButton>
			</Pagination.Item>
		</Pagination.Content>
	</Pagination.Root>
</div>
