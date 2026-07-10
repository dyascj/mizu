<script lang="ts">
	import '../app.css';
	import { afterNavigate } from '$app/navigation';
	import SiteHeader from '$lib/site/site-header.svelte';
	import { siteConfig } from '$lib/site/config';

	let { children } = $props();
	let scroller = $state<HTMLDivElement | null>(null);

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

	// The app scrolls inside `scroller` (not the document), so we reset it to the
	// top on real page navigations. Hash links (in-page anchors) are left alone.
	afterNavigate((nav) => {
		if (nav.to?.url.hash) return;
		scroller?.scrollTo({ top: 0, left: 0 });
		// Fallback in case the document itself is the scroll container.
		window.scrollTo(0, 0);
	});
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
	{@html `<script type="application/ld+json">${JSON.stringify(websiteJsonLd)}<\/script>`}
</svelte:head>

	<div bind:this={scroller} class="h-dvh overflow-y-auto [overscroll-behavior:none]">
		<div class="flex min-h-dvh flex-col">
			<SiteHeader />
			<div class="flex-1">
				{@render children()}
			</div>
		</div>
	</div>

<style>
	/* App-shell: the document itself doesn't scroll; the wrapper above does, so
	   overscroll-behavior fully removes the rubber-band bounce. Kept here (not in
	   app.css) so the theme file stays portable for anyone installing Mizu. */
	:global(html),
	:global(body) {
		height: 100%;
	}
	:global(body) {
		overflow: hidden;
	}
</style>
