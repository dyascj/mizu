<script lang="ts">
	import { components, componentsByCategory } from '$lib/site/catalog';
	import { getDemo } from '$lib/site/demos';
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
	<p class="mt-3 text-lg text-muted-foreground">
		{components.length} clean, accessible components. Pick a color up in the header and the whole set
		recolors live.
	</p>

	{#each groups as group (group.category)}
		<section class="mt-10">
			<h2 class="mb-4 font-display text-xl font-semibold">{group.category}</h2>
			<div class="grid gap-4 sm:grid-cols-2">
				{#each group.items as c (c.slug)}
					{@const demo = getDemo(c.slug)}
					<a
						href={`/docs/components/${c.slug}`}
						class="group block focus-visible:outline-none"
						aria-label={c.name}
					>
						<div
							class="relative flex h-40 items-center justify-center overflow-hidden rounded-2xl bg-card p-5 shadow-sm transition-[transform,box-shadow] duration-200 group-hover:-translate-y-0.5 group-hover:shadow-lg group-focus-visible:ring-2 group-focus-visible:ring-ring"
							data-no-toc
						>
							<div class="pointer-events-none flex w-full scale-90 items-center justify-center">
								{#if demo.Component}
									{@const Demo = demo.Component}
									<Demo />
								{:else}
									<span class="text-sm text-muted-foreground">{c.name}</span>
								{/if}
							</div>
						</div>
						<div class="mt-2.5 flex items-center justify-between gap-2">
							<span class="font-semibold transition-colors group-hover:text-[color:var(--primary)]">
								{c.name}
							</span>
							{#if c.bits}
								<span class="text-xs text-muted-foreground">bits-ui</span>
							{/if}
						</div>
					</a>
				{/each}
			</div>
		</section>
	{/each}
</div>
