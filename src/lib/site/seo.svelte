<script lang="ts">
	import { page } from '$app/state';
	import { siteConfig } from './config';

	// One place for every page's `<head>` SEO: title, description, canonical URL,
	// Open Graph, Twitter, and optional JSON-LD. Pages pass just a title (and
	// usually a description); the canonical/og:url are derived from the live URL
	// so they're always correct and never drift.
	let {
		title,
		description = siteConfig.description,
		image,
		imageAlt = `${siteConfig.name} · ${siteConfig.tagline}`,
		jsonLd
	}: {
		title: string;
		description?: string;
		image?: string;
		imageAlt?: string;
		/** Optional Schema.org object, serialized into a JSON-LD script. */
		jsonLd?: Record<string, unknown>;
	} = $props();

	const base = siteConfig.url.replace(/\/+$/, '');
	const canonical = $derived(base + page.url.pathname.replace(/\/+$/, ''));
	const ogImage = $derived(image ?? `${base}/og.png`);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />

	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:alt" content={imageAlt} />

	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={ogImage} />
	<meta name="twitter:image:alt" content={imageAlt} />

	{#if jsonLd}
		<!-- eslint-disable-next-line svelte/no-at-html-tags: static, app-generated JSON -->
		{@html `<script type="application/ld+json">${JSON.stringify(jsonLd)}<\/script>`}
	{/if}
</svelte:head>
