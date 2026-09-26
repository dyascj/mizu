<script lang="ts">
	import Hero from '$lib/site/landing/hero.svelte';
	import Playground from '$lib/site/landing/playground.svelte';
	import MotionBand from '$lib/site/landing/motion-band.svelte';
	import Surfaces from '$lib/site/landing/surfaces.svelte';
	import Closing from '$lib/site/landing/closing.svelte';
	import SiteFooter from '$lib/site/site-footer.svelte';
	import Seo from '$lib/site/seo.svelte';
	import { siteConfig } from '$lib/site/config';

	const softwareJsonLd = {
		'@context': 'https://schema.org',
		'@type': 'SoftwareApplication',
		name: siteConfig.name,
		applicationCategory: 'DeveloperApplication',
		applicationSubCategory: 'AI product design system',
		keywords: 'AI components, design system, chat UI, voice UI, Svelte, streaming text',
		operatingSystem: 'Web',
		description: siteConfig.description,
		url: siteConfig.url,
		image: `${siteConfig.url}/og.png`,
		softwareRequirements: 'SvelteKit, Svelte 5, Tailwind CSS v4',
		programmingLanguage: 'Svelte',
		license: `${siteConfig.repo}/blob/main/LICENSE`,
		isAccessibleForFree: true,
		offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
		author: { '@type': 'Person', name: siteConfig.author, url: siteConfig.authorUrl }
	};
</script>

<Seo
	title="{siteConfig.name} · {siteConfig.tagline}"
	description={siteConfig.description}
	jsonLd={softwareJsonLd}
/>

<main id="main-content" tabindex="-1">
	<Hero />
	<Playground />
	<Surfaces />
	<MotionBand />
	<Closing />
</main>
<SiteFooter />
