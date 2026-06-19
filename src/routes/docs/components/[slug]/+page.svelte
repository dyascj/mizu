<script lang="ts">
	import { ArrowLeft, ArrowRight } from '@lucide/svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import ComponentPreview from '$lib/site/component-preview.svelte';
	import CopyCommand from '$lib/site/copy-command.svelte';
	import { getDemo } from '$lib/site/demos';
	import { components } from '$lib/site/catalog';
	import { siteConfig } from '$lib/site/config';

	let { data } = $props();

	const meta = $derived(data.component);
	const demo = $derived(getDemo(meta.slug));
	const installCmd = $derived(
		`npx shadcn-svelte@latest add ${siteConfig.registryBase}/${meta.slug}.json`
	);

	const index = $derived(components.findIndex((c) => c.slug === meta.slug));
	const prev = $derived(index > 0 ? components[index - 1] : null);
	const next = $derived(index < components.length - 1 ? components[index + 1] : null);
</script>

<svelte:head>
	<title>{meta.name} — {siteConfig.name}</title>
	<meta name="description" content={meta.description} />
</svelte:head>

<article class="max-w-3xl">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="font-display text-3xl font-extrabold">{meta.name}</h1>
		<Badge variant="outline">{meta.category}</Badge>
		{#if meta.bits}<Badge variant="secondary">bits-ui</Badge>{/if}
	</div>
	<p class="mt-3 text-lg text-muted-foreground">{meta.description}</p>

	<div class="mt-8">
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
	</div>

	<h2 class="mt-10 mb-3 font-display text-xl font-bold">Installation</h2>
	<CopyCommand command={installCmd} />

	<nav class="mt-12 flex items-center justify-between gap-3 border-t border-border pt-6">
		{#if prev}
			<Button href={`/docs/components/${prev.slug}`} variant="ghost" size="sm">
				<ArrowLeft class="size-4" />
				{prev.name}
			</Button>
		{:else}
			<span></span>
		{/if}
		{#if next}
			<Button href={`/docs/components/${next.slug}`} variant="ghost" size="sm">
				{next.name}
				<ArrowRight class="size-4" />
			</Button>
		{/if}
	</nav>
</article>
