<script lang="ts">
	import { components, componentsByCategory } from '$lib/site/catalog';
	import LazyDemo from '$lib/site/lazy-demo.svelte';
	import { siteConfig } from '$lib/site/config';
	import Seo from '$lib/site/seo.svelte';

	const groups = componentsByCategory();
</script>

<Seo
	title="Components · {siteConfig.name}"
	description={`Browse all ${components.length} Mizu components for AI products: streaming text, chat, voice orbs, reasoning, plus buttons, dialogs, and data tables. Each has a live demo, props table, and copy-paste source.`}
/>

<div>
	<h1 class="font-display text-3xl font-semibold">Components</h1>
	<p class="text-muted-foreground mt-3 text-lg">
		{components.length} components for interfaces with intelligence. Explore the previews, then open a
		component for its API and source.
	</p>

	{#each groups as group (group.category)}
		<section class="mt-10">
			<h2 class="font-display mb-4 text-xl font-semibold">{group.category}</h2>
			<div class="grid gap-4 sm:grid-cols-2">
				{#each group.items as c (c.slug)}
					<article class="group relative">
						<div
							class="bg-background group-focus-within:ring-ring relative flex h-52 items-center justify-center overflow-hidden rounded-2xl p-5 shadow-sm transition-[transform,box-shadow] duration-200 group-focus-within:ring-2 group-hover:-translate-y-0.5 group-hover:shadow-lg"
							data-no-toc
						>
							<div
								inert
								aria-hidden="true"
								class="pointer-events-none flex w-full scale-90 items-center justify-center"
							>
								<LazyDemo slug={c.slug} />
							</div>
						</div>
						<div class="mt-2.5 flex items-center justify-between gap-2">
							<a
								href={`/docs/components/${c.slug}`}
								class="font-semibold transition-colors after:absolute after:inset-0 hover:text-[color:var(--primary)] focus-visible:outline-none"
								aria-label={c.name}
							>
								{c.name}
							</a>
							{#if c.bits}
								<span class="text-muted-foreground text-xs">bits-ui</span>
							{/if}
						</div>
					</article>
				{/each}
			</div>
		</section>
	{/each}
</div>
