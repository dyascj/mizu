<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import ComponentPreview from '$lib/site/component-preview.svelte';
	import CopyCommand from '$lib/site/copy-command.svelte';
	import CodeBlock from '$lib/site/code-block.svelte';
	import { getDemo } from '$lib/site/demos';
	import { getComponentApi, getComponentSource } from '$lib/site/component-api';
	import { siteConfig } from '$lib/site/config';
	import Seo from '$lib/site/seo.svelte';

	let { data } = $props();

	const meta = $derived(data.component);
	const demo = $derived(getDemo(meta.slug));
	const api = $derived(getComponentApi(meta.slug));
	const source = $derived(getComponentSource(meta.slug));
	const multiPart = $derived(api.length > 1);
	const installCmd = $derived(
		`npx shadcn-svelte@latest add ${siteConfig.registryBase}/${meta.slug}.json`
	);

	// Richer than the catalog blurb so search/social snippets read as a real
	// answer to "Svelte <component>" queries.
	const seoDescription = $derived(
		`${meta.description} A copy-paste ${meta.name} component for SvelteKit — accessible, themeable, and yours to own. Built with Svelte 5 and Tailwind v4.`
	);

	const jsonLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'SoftwareSourceCode',
		name: `${meta.name} — ${siteConfig.name}`,
		description: meta.description,
		url: `${siteConfig.url}/docs/components/${meta.slug}`,
		codeRepository: siteConfig.repo,
		programmingLanguage: 'Svelte',
		runtimePlatform: 'SvelteKit',
		isPartOf: { '@type': 'WebSite', name: siteConfig.name, url: siteConfig.url },
		author: { '@type': 'Person', name: siteConfig.author, url: siteConfig.authorUrl }
	});
</script>

<Seo title="{meta.name} — {siteConfig.name}" description={seoDescription} {jsonLd} />

<article class="max-w-3xl">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="font-display text-3xl font-extrabold">{meta.name}</h1>
		<Badge variant="outline">{meta.category}</Badge>
		{#if meta.bits}<Badge variant="secondary">bits-ui</Badge>{/if}
	</div>
	<p class="mt-3 text-lg text-muted-foreground">{meta.description}</p>

	<h2 class="mt-8 mb-4 font-display text-xl font-bold">Example</h2>
	{#if demo.Component}
		{@const Demo = demo.Component}
		<ComponentPreview code={demo.source}>
			<Demo />
		</ComponentPreview>
	{:else}
		<div
			class="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground"
		>
			A live demo for <span class="font-semibold text-foreground">{meta.name}</span> is coming soon.
		</div>
	{/if}

	{#if api.length}
		<h2 class="mt-10 mb-2 font-display text-xl font-bold">
			{multiPart ? 'API reference' : 'Props'}
		</h2>
		<p class="mb-4 text-sm text-muted-foreground">
			Generated from the component source — always in sync with what you install.
		</p>
		{#each api as part (part.title)}
			{#if multiPart}
				<h3 class="mt-6 mb-3 font-mono text-base font-semibold text-foreground">{part.title}</h3>
			{/if}
			{#if part.props.length}
				<div class="overflow-x-auto rounded-2xl border border-border glass">
					<table class="w-full border-collapse text-left text-sm">
						<thead>
							<tr class="border-b border-border text-muted-foreground">
								<th class="px-4 py-2.5 font-medium">Prop</th>
								<th class="px-4 py-2.5 font-medium">Type</th>
								<th class="px-4 py-2.5 font-medium">Default</th>
							</tr>
						</thead>
						<tbody>
							{#each part.props as p (p.name)}
								<tr class="border-b border-border last:border-0 align-top">
									<td class="px-4 py-2.5 whitespace-nowrap">
										<code class="font-mono text-foreground">{p.name}</code>
										{#if !p.optional}<span
												class="ml-1 text-[color:var(--destructive)]"
												title="Required">*</span
											>{/if}
										{#if p.bindable}<span
												class="ml-1.5 rounded bg-secondary px-1.5 py-0.5 font-mono text-[0.65rem] text-muted-foreground"
												title="Two-way bindable with bind:">bind</span
											>{/if}
									</td>
									<td class="px-4 py-2.5 font-mono text-[0.8125rem] text-primary"
										>{p.type || '—'}</td
									>
									<td class="px-4 py-2.5 font-mono text-[0.8125rem] text-muted-foreground"
										>{p.default ?? '—'}</td
									>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
			{#if part.extendsTypes.length}
				<p class="mt-2 text-sm text-muted-foreground">
					Also accepts {#each part.extendsTypes as t, i (t)}<code class="font-mono text-foreground"
							>{t}</code
						>{i < part.extendsTypes.length - 1 ? ', ' : ''}{/each} props (e.g. native attributes pass
					straight through).
				</p>
			{/if}
		{/each}
	{/if}

	<h2 class="mt-10 mb-3 font-display text-xl font-bold">Installation</h2>
	<CopyCommand command={installCmd} />

	{#if source.length}
		<h2 class="mt-10 mb-3 font-display text-xl font-bold">Source</h2>
		<p class="mb-4 text-sm text-muted-foreground">
			The full source you own once you copy it in — no black box.
		</p>
		<div class="flex flex-col gap-2">
			{#each source as f (f.file)}
				<details class="group rounded-2xl border border-border glass">
					<summary
						class="flex cursor-pointer items-center justify-between px-4 py-3 font-mono text-sm text-foreground select-none"
					>
						{f.file}
						<span class="text-xs text-muted-foreground group-open:hidden">Show</span>
						<span class="hidden text-xs text-muted-foreground group-open:inline">Hide</span>
					</summary>
					<div class="px-2 pb-2">
						<CodeBlock code={f.code} />
					</div>
				</details>
			{/each}
		</div>
	{/if}
</article>
