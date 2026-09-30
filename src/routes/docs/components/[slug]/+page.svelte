<script lang="ts">
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import { Badge } from '$lib/components/ui/badge';
	import ComponentPreview from '$lib/site/component-preview.svelte';
	import CopyCommand from '$lib/site/copy-command.svelte';
	import CodeBlock from '$lib/site/code-block.svelte';
	import { getDemo } from '$lib/site/demos';
	import { registryPinnedBase, siteConfig } from '$lib/site/config';
	import Seo from '$lib/site/seo.svelte';

	let { data } = $props();

	const meta = $derived(data.component);
	// The API module carries a lazy map of every component file, so it loads
	// in its own chunk instead of weighing down this page's.
	const componentDocs = $derived(
		Promise.all([
			getDemo(meta.slug),
			import('$lib/site/component-api').then((m) =>
				Promise.all([m.getComponentApi(meta.slug), m.getComponentSource(meta.slug)])
			)
		]).then(([demo, [api, source]]) => ({ demo, api, source }))
	);
	const installCmd = $derived(
		`npx shadcn-svelte@latest add ${registryPinnedBase}/${meta.slug}.json`
	);

	// Richer than the catalog blurb so search/social snippets read as a real
	// answer to "Svelte <component>" queries.
	const seoDescription = $derived(
		`${meta.description} A copy-paste ${meta.name} component for AI products on SvelteKit. Accessible, themeable, and yours to own. Built with Svelte 5 and Tailwind v4.`
	);

	const jsonLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'SoftwareSourceCode',
		name: `${meta.name} · ${siteConfig.name}`,
		description: meta.description,
		url: `${siteConfig.url}/docs/components/${meta.slug}`,
		codeRepository: siteConfig.repo,
		programmingLanguage: 'Svelte',
		runtimePlatform: 'SvelteKit',
		isPartOf: { '@type': 'WebSite', name: siteConfig.name, url: siteConfig.url },
		author: { '@type': 'Person', name: siteConfig.author, url: siteConfig.authorUrl }
	});
</script>

<Seo title="{meta.name} · {siteConfig.name}" description={seoDescription} {jsonLd} />

<article class="max-w-3xl">
	<nav aria-label="Breadcrumb" class="text-muted-foreground mb-4 text-sm">
		<ol class="flex items-center gap-1.5">
			<li>
				<a href="/docs/components" class="hover:text-foreground transition-colors">Components</a>
			</li>
			<li aria-hidden="true"><ChevronRight class="size-3.5" /></li>
			<li class="text-foreground" aria-current="page">{meta.name}</li>
		</ol>
	</nav>
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-4xl font-semibold tracking-tight sm:text-[2.75rem]">{meta.name}</h1>
		<Badge variant="outline">{meta.category}</Badge>
		{#if meta.bits}<Badge variant="secondary">bits-ui</Badge>{/if}
	</div>
	<p class="text-muted-foreground mt-3 text-lg">{meta.description}</p>
	<CopyCommand class="mt-5" command={installCmd} />

	<h2 class="sr-only">Preview</h2>
	{#await componentDocs}
		<div
			class="bg-secondary/40 mt-8 h-[30rem] animate-pulse rounded-[1.75rem]"
			aria-hidden="true"
		></div>
	{:then docs}
		{@const demo = docs.demo}
		{@const api = docs.api}
		{@const source = docs.source}
		{#if demo.Component}
			{@const Demo = demo.Component}
			<ComponentPreview class="mt-8" code={demo.source} filename="{meta.slug}-demo.svelte">
				<Demo />
			</ComponentPreview>
		{:else}
			<div
				class="border-border text-muted-foreground mt-8 rounded-[1.75rem] border border-dashed p-10 text-center text-sm"
			>
				A live demo for <span class="text-foreground font-semibold">{meta.name}</span> is coming soon.
			</div>
		{/if}

		{#if api.length}
			<h2 class="mt-14 mb-2 text-2xl font-semibold tracking-tight">API reference</h2>
			<p class="text-muted-foreground mb-2 text-sm">Properties, defaults, and supported values.</p>
			{#each api as part (part.title)}
				<h3 class="text-foreground mt-6 mb-3 font-mono text-base font-medium">{part.title}</h3>
				{#if part.props.length}
					<div
						role="table"
						aria-label={`${part.title} properties`}
						class="border-border overflow-hidden rounded-[1.25rem] border text-sm"
					>
						<div
							role="row"
							class="border-border bg-secondary/50 text-muted-foreground hidden grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)] gap-4 border-b px-5 py-2.5 text-[0.8125rem] font-medium sm:grid"
						>
							<span role="columnheader">Prop</span>
							<span role="columnheader">Type</span>
							<span role="columnheader">Default</span>
						</div>
						{#each part.props as p (p.name)}
							<div
								role="row"
								class="border-border grid gap-2 border-b px-5 py-4 last:border-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)] sm:gap-4 sm:py-3"
							>
								<span role="cell" class="min-w-0">
									<code class="text-foreground font-mono font-medium [overflow-wrap:anywhere]"
										>{p.name}</code
									>{#if !p.optional}<span
											class="ml-1 text-[color:var(--destructive)]"
											title="Required">*</span
										>{/if}
									{#if p.bindable}<span
											class="bg-secondary text-muted-foreground ml-1.5 rounded px-1.5 py-0.5 font-mono text-xs"
											title="Two-way bindable with bind:">bind</span
										>{/if}
								</span>
								<span role="cell" class="flex min-w-0 items-baseline gap-3">
									<span class="text-muted-foreground w-14 shrink-0 sm:hidden">Type</span>
									<code
										class="bg-secondary/70 text-foreground min-w-0 rounded-md px-1.5 py-0.5 font-mono text-[0.8125rem] [overflow-wrap:anywhere]"
										>{p.type || '·'}</code
									>
								</span>
								<span role="cell" class="flex min-w-0 items-baseline gap-3">
									<span class="text-muted-foreground w-14 shrink-0 sm:hidden">Default</span>
									{#if p.default}<code
											class="bg-secondary/70 text-foreground min-w-0 rounded-md px-1.5 py-0.5 font-mono text-[0.8125rem] [overflow-wrap:anywhere]"
											>{p.default}</code
										>{:else}<span class="text-muted-foreground">–</span>{/if}
								</span>
							</div>
						{/each}
					</div>
				{/if}
				{#if part.extendsTypes.length}
					<p class="text-muted-foreground mt-2 text-sm">
						Also accepts {#each part.extendsTypes as t, i (t)}<code
								class="text-foreground font-mono break-all">{t}</code
							>{i < part.extendsTypes.length - 1 ? ', ' : ''}{/each} props (e.g. native attributes pass
						straight through).
					</p>
				{/if}
			{/each}
		{/if}

		<h2 class="mt-14 mb-3 text-2xl font-semibold tracking-tight">Installation</h2>
		<CopyCommand command={installCmd} />

		{#if source.length}
			<h2 class="mt-14 mb-3 text-2xl font-semibold tracking-tight">Source</h2>
			<p class="text-muted-foreground mb-4 text-sm">
				Copy the source into your project and adapt it to your product.
			</p>
			<div class="flex flex-col gap-2">
				{#each source as f (f.file)}
					<details class="group border-border glass rounded-2xl border">
						<summary
							class="text-foreground flex cursor-pointer items-center justify-between px-4 py-3 font-mono text-sm select-none"
						>
							<span class="min-w-0 break-all">{f.file}</span>
							<span class="text-muted-foreground text-xs group-open:hidden">Show</span>
							<span class="text-muted-foreground hidden text-xs group-open:inline">Hide</span>
						</summary>
						<div class="px-2 pb-2">
							<CodeBlock code={f.code} />
						</div>
					</details>
				{/each}
			</div>
		{/if}
	{/await}
</article>
