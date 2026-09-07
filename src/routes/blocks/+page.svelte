<script lang="ts">
	import { page } from '$app/state';
	import * as Tabs from '$lib/components/ui/tabs';
	import CodeBlock from '$lib/site/code-block.svelte';
	import CopyCommand from '$lib/site/copy-command.svelte';
	import Seo from '$lib/site/seo.svelte';
	import { blockCategories, blocks, getBlock } from '$lib/site/blocks';
	import { registryPinnedBase, siteConfig } from '$lib/site/config';
	import { cn } from '$lib/utils.js';

	const category = $derived(
		blockCategories.find(
			(item) => item.toLowerCase().replaceAll(' ', '-') === page.url.searchParams.get('category')
		) ?? 'Featured'
	);
	const visible = $derived(blocks.filter((b) => b.category === category));
</script>

<Seo
	title="Blocks · {siteConfig.name}"
	description="Prebuilt AI screens and flows for SvelteKit: assistant chat, voice mode, agent dashboards and runs, an app shell, and auth. Every block ships its full source to copy and own."
/>

<main id="main-content" tabindex="-1" class="mx-auto w-full max-w-5xl px-5 py-12 sm:px-6">
	<header class="mx-auto max-w-2xl text-center">
		<h1 class="text-4xl font-semibold tracking-tight sm:text-5xl">Blocks</h1>
		<p class="text-muted-foreground mt-3 text-lg text-balance">
			Conversation screens, agent workflows, and account forms. Try each preview, then copy the
			source and connect your services.
		</p>
	</header>

	<nav class="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="Block categories">
		{#each blockCategories as c (c)}
			<a
				href={`?category=${c.toLowerCase().replaceAll(' ', '-')}`}
				data-sveltekit-noscroll
				aria-current={category === c ? 'page' : undefined}
				class={cn(
					'focus-visible:ring-ring rounded-full px-4 py-1.5 text-sm transition-colors outline-none focus-visible:ring-2',
					category === c
						? 'bg-primary-muted text-primary font-medium'
						: 'bg-secondary text-muted-foreground hover:text-foreground'
				)}
			>
				{c}
			</a>
		{/each}
	</nav>

	<div class="mt-12 flex flex-col gap-16">
		{#each visible as block (block.slug)}
			{@const blockPromise = getBlock(block.slug)}
			<section id={block.slug}>
				<div class="mb-4 flex flex-wrap items-end justify-between gap-4">
					<div class="max-w-xl">
						<h2 class="text-xl font-semibold tracking-tight">{block.name}</h2>
						<p class="text-muted-foreground mt-1 text-sm leading-relaxed">{block.description}</p>
					</div>
					<CopyCommand
						command={`npx shadcn-svelte@latest add ${registryPinnedBase}/${block.slug}.json`}
						class="w-full max-w-xs"
					/>
				</div>
				{#await blockPromise}
					<div class="bg-secondary/50 h-96 animate-pulse rounded-3xl" aria-hidden="true"></div>
				{:then b}
					<Tabs.Root value="preview">
						<Tabs.List>
							<Tabs.Trigger value="preview">Preview</Tabs.Trigger>
							<Tabs.Trigger value="code">Code</Tabs.Trigger>
						</Tabs.List>
						<Tabs.Content value="preview">
							<div
								class="bg-secondary/50 rounded-3xl p-4 [contain-intrinsic-size:auto_36rem] [content-visibility:auto] sm:p-10"
							>
								{#if b.Component}
									{@const Block = b.Component}
									<Block />
								{/if}
							</div>
						</Tabs.Content>
						<Tabs.Content value="code">
							<CodeBlock code={b.source} class="max-h-[32rem] overflow-y-auto" />
						</Tabs.Content>
					</Tabs.Root>
				{/await}
			</section>
		{/each}
	</div>
</main>
