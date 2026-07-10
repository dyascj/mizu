<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs';
	import CodeBlock from '$lib/site/code-block.svelte';
	import Seo from '$lib/site/seo.svelte';
	import { blocks, getBlock } from '$lib/site/blocks';
	import { siteConfig } from '$lib/site/config';
</script>

<Seo
	title="Blocks · {siteConfig.name}"
	description="Prebuilt AI screens and flows for SvelteKit: an assistant chat, voice mode, an agent dashboard, and onboarding. Every block ships its full source to copy and own."
/>

<div class="mx-auto w-full max-w-5xl px-5 py-12 sm:px-6">
	<header class="mx-auto max-w-2xl text-center">
		<h1 class="text-3xl font-semibold tracking-tight">Blocks</h1>
		<p class="mt-3 text-lg text-balance text-muted-foreground">
			Whole screens for AI products, assembled from the components and ready to ship. Open the
			code tab and copy everything.
		</p>
	</header>

	<div class="mt-14 flex flex-col gap-16">
		{#each blocks as block (block.slug)}
			{@const b = getBlock(block.slug)}
			<section id={block.slug}>
				<div class="mb-4 max-w-2xl">
					<h2 class="text-xl font-semibold tracking-tight">{block.name}</h2>
					<p class="mt-1 text-sm leading-relaxed text-muted-foreground">{block.description}</p>
				</div>
				<Tabs.Root value="preview">
					<Tabs.List>
						<Tabs.Trigger value="preview">Preview</Tabs.Trigger>
						<Tabs.Trigger value="code">Code</Tabs.Trigger>
					</Tabs.List>
					<Tabs.Content value="preview">
						<div class="rounded-3xl bg-secondary/50 p-4 sm:p-10">
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
