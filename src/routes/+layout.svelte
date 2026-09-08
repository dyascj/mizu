<script lang="ts">
	import '../app.css';
	import SiteHeader from '$lib/site/site-header.svelte';
	import { siteConfig } from '$lib/site/config';

	let { children } = $props();

	// Sitewide structured data (Schema.org). Page-specific titles/descriptions
	// and the homepage's SoftwareApplication node live in <Seo> on each route.
	const websiteJsonLd = {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: siteConfig.name,
		alternateName: `${siteConfig.name} · ${siteConfig.tagline}`,
		url: siteConfig.url,
		description: siteConfig.description,
		inLanguage: 'en',
		author: { '@type': 'Person', name: siteConfig.author, url: siteConfig.authorUrl }
	};
</script>

<svelte:head>
	<link rel="icon" href="/brand/mizu-icon.png" />
	<link rel="apple-touch-icon" href="/brand/mizu-icon.png" />
	<meta name="author" content={siteConfig.author} />

	<!-- Global Open Graph / Twitter. Per-page title, description, url, and image
	     are set by <Seo> on each route. -->
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={siteConfig.name} />
	<meta property="og:image:type" content="image/png" />
	<meta property="og:image:width" content="2400" />
	<meta property="og:image:height" content="1260" />
	<meta name="twitter:card" content="summary_large_image" />

	<!-- eslint-disable-next-line svelte/no-at-html-tags: static, app-generated JSON -->
	{@html `<script type="application/ld+json">${JSON.stringify(websiteJsonLd).replaceAll('<', '\\u003c')}<\/script>`}
</svelte:head>

<a
	href="#main-content"
	class="bg-foreground text-background fixed top-3 left-4 z-50 -translate-y-24 rounded-full px-5 py-3 text-sm font-medium focus:translate-y-0"
	>Skip to content</a
>
<div class="flex min-h-dvh flex-col">
	<SiteHeader />
	<div class="min-w-0 flex-1">{@render children()}</div>
</div>
