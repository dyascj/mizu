<script lang="ts">
	import { ScrollSpine } from '$lib/components/ui/scroll-spine';

	let scroller = $state<HTMLElement | null>(null);
	const id = $props.id();

	const sections = [
		{
			heading: 'Where we are today',
			body: [
				'Embeddings live in a separate vector service that costs $1,900 a month and adds a network hop to every search. Queries average 180ms, and a third of that is the round trip.',
				'Every document also exists twice, once in Postgres and once in the vector store, so deletes and permission changes have to be written to both.'
			]
		},
		{
			heading: 'Why pgvector',
			body: [
				'Your corpus is 4.2 million chunks, well inside what a single Postgres instance with pgvector handles comfortably. Keeping vectors beside the rows they describe removes the second write entirely.',
				'Permissions become a plain WHERE clause on the same query, instead of a filter you have to keep in sync with another system.',
				'The trade is operational: index builds now happen on your primary, so they need a maintenance window the first time.',
				'After that, new rows index incrementally and nobody has to think about it.'
			]
		},
		{
			heading: 'Migration steps',
			body: [
				'Add a vector column, backfill it from the existing store in batches of ten thousand, and dual-write new embeddings while the backfill runs.',
				'Switch reads behind a flag once the counts match.'
			]
		},
		{
			heading: 'Index tuning',
			body: [
				'Start with an HNSW index at the defaults and measure recall against the current service on your last thousand real queries.',
				'If recall trails by more than a point, raise ef_search before touching the build parameters; it costs query time, not a rebuild.',
				'Expect p95 latency around 60ms once the index is warm.'
			]
		},
		{
			heading: 'Rollback plan',
			body: [
				'Keep the vector service running read-only for two weeks. Flipping the flag back is instant, and the dual writes mean nothing is lost either way.'
			]
		},
		{
			heading: 'What to watch',
			body: [
				'Track recall, p95 latency, and primary CPU during index builds. If CPU during builds is the only complaint, move them to a replica.',
				'Then cancel the vector service contract and enjoy the smaller bill.'
			]
		}
	];

	const items = sections.map((section, i) => ({ id: `${id}-${i}`, label: section.heading }));
</script>

<div
	class="bg-card @container flex h-[27.5rem] w-full max-w-2xl overflow-hidden rounded-2xl shadow-md"
>
	<!-- svelte-ignore a11y_no_noninteractive_tabindex (a scrolling region needs focus to scroll by keyboard) -->
	<div
		bind:this={scroller}
		tabindex="0"
		role="region"
		aria-label="Assistant answer"
		class="focus-visible:ring-ring min-w-0 flex-1 [scrollbar-width:none] overflow-y-auto overscroll-contain [mask-image:linear-gradient(to_bottom,black_calc(100%-3rem),transparent)] outline-none focus-visible:ring-2 focus-visible:ring-inset [&::-webkit-scrollbar]:hidden"
	>
		<article class="text-muted-foreground px-6 pt-6 pb-40 text-sm leading-relaxed text-pretty">
			<p class="text-xs">Assistant · 6 min read</p>
			<h2 class="text-foreground mt-1 text-xl font-semibold tracking-tight text-balance">
				Plan for moving search embeddings into Postgres
			</h2>
			{#each sections as section, i (i)}
				<section>
					<h3 id={items[i].id} class="text-foreground mt-7 scroll-mt-4 text-base font-medium">
						{section.heading}
					</h3>
					{#each section.body as paragraph (paragraph)}
						<p class="mt-3">{paragraph}</p>
					{/each}
				</section>
			{/each}
		</article>
	</div>
	<!-- Headings beside the bands when there is room; bands alone on a phone,
	     where each heading shows on hover or focus. -->
	<div
		class="flex w-12 shrink-0 flex-col items-center pt-6 @min-[32rem]:w-52 @min-[32rem]:items-stretch @min-[32rem]:pr-5 @min-[32rem]:pl-6"
	>
		<p class="text-muted-foreground mb-4 hidden text-xs font-medium @min-[32rem]:block">
			On this page
		</p>
		<ScrollSpine
			{items}
			target={scroller}
			height={340}
			class="w-5 [--scroll-spine-surface:var(--card)] @min-[32rem]:w-full"
		/>
	</div>
</div>
