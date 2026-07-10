<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs';
	import CodeBlock from '$lib/site/code-block.svelte';
	import CopyCommand from '$lib/site/copy-command.svelte';
	import Seo from '$lib/site/seo.svelte';
	import { blockCategories, blocks, getBlock, type BlockCategory } from '$lib/site/blocks';
	import { siteConfig } from '$lib/site/config';
	import { cn } from '$lib/utils.js';

	let category = $state<BlockCategory>('Featured');
	const visible = $derived(blocks.filter((b) => b.category === category));
</script>

<Seo
	title="Blocks · {siteConfig.name}"
	description="Prebuilt AI screens and flows for SvelteKit: assistant chat, voice mode, agent dashboards and runs, an app shell, and auth. Every block ships its full source to copy and own."
/>

<div class="mx-auto w-full max-w-5xl px-5 py-12 sm:px-6">
	<header class="mx-auto max-w-2xl text-center">
		<h1 class="text-3xl font-semibold tracking-tight">Blocks</h1>
		<p class="mt-3 text-lg text-balance text-muted-foreground">
			Whole screens for AI products, assembled from the components and ready to ship. Open the
			code tab and copy everything.
		</p>
	</header>

	<nav class="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="Block categories">
		{#each blockCategories as c (c)}
			<button
				type="button"
				onclick={() => (category = c)}
				aria-pressed={category === c}
				class={cn(
					'rounded-full px-4 py-1.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
					category === c
						? 'bg-primary-muted font-medium text-primary'
						: 'bg-secondary text-muted-foreground hover:text-foreground'
				)}
			>
				{c}
			</button>
		{/each}
	</nav>

	<div class="mt-12 flex flex-col gap-16">
		{#each visible as block (block.slug)}
			{@const b = getBlock(block.slug)}
			<section id={block.slug}>
				<div class="mb-4 flex flex-wrap items-end justify-between gap-4">
					<div class="max-w-xl">
						<h2 class="text-xl font-semibold tracking-tight">{block.name}</h2>
						<p class="mt-1 text-sm leading-relaxed text-muted-foreground">{block.description}</p>
					</div>
					<CopyCommand
						command={`npx shadcn-svelte@latest add ${siteConfig.registryBase}/${block.slug}.json`}
						class="w-full max-w-xs"
					/>
				</div>
				<Tabs.Root value="preview">
					<Tabs.List>
						<Tabs.Trigger value="preview">Preview</Tabs.Trigger>
						<Tabs.Trigger value="code">Code</Tabs.Trigger>
					</Tabs.List>
					<Tabs.Content value="preview">
						<div class="rounded-3xl bg-secondary/50 p-4 [contain-intrinsic-size:auto_36rem] [content-visibility:auto] sm:p-10">
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
			</section>
		{/each}
	</div>
</div>
