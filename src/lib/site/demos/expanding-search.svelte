<script lang="ts">
	import Bot from '@lucide/svelte/icons/bot';
	import { ExpandingSearch } from '$lib/components/ui/expanding-search';
	import { Kbd } from '$lib/components/ui/kbd';
	import { cn } from '$lib/utils.js';

	const agents = [
		{ name: 'Research assistant', detail: 'Reads papers and drafts summaries' },
		{ name: 'Support triage', detail: 'Tags and routes incoming tickets' },
		{ name: 'Release notes writer', detail: 'Turns merged work into a changelog' },
		{ name: 'Meeting scribe', detail: 'Takes notes and lists action items' }
	];

	let open = $state(false);
	let query = $state('');
	const shown = $derived(
		agents.filter((agent) => agent.name.toLowerCase().includes(query.trim().toLowerCase()))
	);
</script>

<div class="flex w-full max-w-sm flex-col items-center gap-4">
	<div class="bg-card w-full rounded-2xl p-2 shadow-sm">
		<div class="relative flex h-10 items-center justify-end">
			<!-- Sits under the pill and fades as it opens, so the header keeps its
			     size and nothing moves. -->
			<span
				aria-hidden={open}
				class={cn(
					'pointer-events-none absolute left-3 text-sm font-semibold tracking-tight transition-opacity duration-(--duration-fast) ease-out',
					open && 'opacity-0'
				)}
			>
				Agents
			</span>
			<ExpandingSearch
				bind:open
				bind:value={query}
				label="Search agents"
				placeholder="Search agents"
				width={400}
			/>
		</div>
		<ul class="mt-1 flex flex-col">
			{#each shown as agent (agent.name)}
				<li class="flex items-center gap-3 rounded-xl px-2 py-2">
					<span
						class="bg-secondary text-muted-foreground grid size-8 shrink-0 place-items-center rounded-full"
					>
						<Bot class="size-4" aria-hidden="true" />
					</span>
					<span class="min-w-0">
						<span class="block truncate text-sm font-medium">{agent.name}</span>
						<span class="text-muted-foreground block truncate text-xs">{agent.detail}</span>
					</span>
				</li>
			{:else}
				<li class="text-muted-foreground px-3 py-6 text-center text-sm">No agents match</li>
			{/each}
		</ul>
	</div>
	<p class="text-muted-foreground text-xs">Press <Kbd match="/" /> to search</p>
</div>
