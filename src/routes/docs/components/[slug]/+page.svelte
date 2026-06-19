<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import ComponentPreview from '$lib/site/component-preview.svelte';
	import CopyCommand from '$lib/site/copy-command.svelte';
	import { getDemo } from '$lib/site/demos';
	import { siteConfig } from '$lib/site/config';

	let { data } = $props();

	const meta = $derived(data.component);
	const demo = $derived(getDemo(meta.slug));
	const installCmd = $derived(
		`npx shadcn-svelte@latest add ${siteConfig.registryBase}/${meta.slug}.json`
	);
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

	<h2 class="mt-10 mb-3 font-display text-xl font-bold">Installation</h2>
	<CopyCommand command={installCmd} />
</article>
