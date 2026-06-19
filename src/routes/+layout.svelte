<script lang="ts">
	import '../app.css';
	import { afterNavigate } from '$app/navigation';
	import IconContext from 'phosphor-svelte/lib/IconContext';
	import SiteHeader from '$lib/site/site-header.svelte';
	import { siteConfig } from '$lib/site/config';

	let { children } = $props();
	let scroller = $state<HTMLDivElement | null>(null);

	// The app scrolls inside `scroller` (not the document), so we reset it to the
	// top on real page navigations. Hash links (in-page anchors) are left alone.
	afterNavigate((nav) => {
		if (scroller && (!nav.to || nav.to.url.hash === '')) {
			scroller.scrollTo({ top: 0 });
		}
	});
</script>

<svelte:head>
	<link rel="icon" href="/mizu-mark.svg" />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={siteConfig.name} />
	<meta property="og:title" content={`${siteConfig.name} — ${siteConfig.tagline}`} />
	<meta property="og:description" content={siteConfig.description} />
	<meta property="og:url" content={siteConfig.url} />
	<meta property="og:image" content={`${siteConfig.url}/og.png`} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={`${siteConfig.name} — ${siteConfig.tagline}`} />
	<meta name="twitter:description" content={siteConfig.description} />
	<meta name="twitter:image" content={`${siteConfig.url}/og.png`} />
</svelte:head>

<IconContext values={{ weight: 'fill' }}>
	<div bind:this={scroller} class="h-dvh overflow-y-auto [overscroll-behavior:none]">
		<div class="flex min-h-dvh flex-col">
			<SiteHeader />
			<div class="flex-1">
				{@render children()}
			</div>
		</div>
	</div>
</IconContext>

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
