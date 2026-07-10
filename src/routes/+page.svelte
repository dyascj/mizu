<script lang="ts">
	import ArrowRight from 'phosphor-svelte/lib/ArrowRight';
	import { Button } from '$lib/components/ui/button';
	import LandingCards from '$lib/site/landing-cards.svelte';
	import CopyCommand from '$lib/site/copy-command.svelte';
	import OrbMark from '$lib/site/orb-mark.svelte';
	import Seo from '$lib/site/seo.svelte';
	import { siteConfig } from '$lib/site/config';

	const installCmd = `npx shadcn-svelte@latest add ${siteConfig.registryBase}/button.json`;

	const softwareJsonLd = {
		'@context': 'https://schema.org',
		'@type': 'SoftwareApplication',
		name: siteConfig.name,
		applicationCategory: 'DeveloperApplication',
		applicationSubCategory: 'UI component library',
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
	title="{siteConfig.name} — {siteConfig.tagline}"
	description={siteConfig.description}
	jsonLd={softwareJsonLd}
/>

<!-- Hero: a quiet white field lit by pastel auras, the orb at its center -->
<section class="relative overflow-hidden">
	<div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
		<div class="hero-aura orb-pink absolute top-[-22%] left-[8%] size-[520px]"></div>
		<div class="hero-aura orb-purple absolute top-[-14%] right-[6%] size-[560px]"></div>
		<div class="hero-aura orb-blue absolute top-[24%] left-1/2 size-[640px] -translate-x-1/2"></div>
	</div>

	<div
		class="mx-auto flex max-w-3xl flex-col items-center gap-5 px-6 pt-16 pb-16 text-center sm:pt-24"
	>
		<div class="hero-orb relative">
			<OrbMark class="size-28 sm:size-36" />
		</div>

		<h1 class="max-w-xl text-5xl leading-[1.02] font-semibold tracking-tight text-balance sm:text-6xl">
			Interfaces that feel light.
		</h1>

		<p class="max-w-md text-balance text-muted-foreground sm:text-lg">
			Clean, airy components for Svelte 5 and Tailwind v4. White surfaces, soft shadows, and a
			glow where intelligence lives.
		</p>

		<div class="mt-1 flex flex-wrap items-center justify-center gap-3">
			<Button href="/docs" size="lg">
				Get started
				<ArrowRight class="size-4" />
			</Button>
			<Button href="/docs/components" variant="outline" size="lg">Browse components</Button>
		</div>

		<CopyCommand command={installCmd} class="mt-1 w-full max-w-sm" />
	</div>
</section>

<!-- The components: a shadcn-style wall of real, interactive cards that
     dissolves into the footer at the bottom -->
<section class="mx-auto max-w-6xl px-4 pb-0 sm:px-6">
	<div class="cards-fade">
		<LandingCards />
	</div>
</section>

<footer class="-mt-4">
	<div
		class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-7 text-sm text-muted-foreground sm:flex-row"
	>
		<div class="flex items-center gap-2.5">
			<OrbMark class="size-5" />
			<span
				>Mizu · by <a
					href={siteConfig.authorUrl}
					target="_blank"
					rel="noreferrer"
					class="font-medium text-foreground transition-colors hover:text-primary"
					>{siteConfig.author}</a
				></span
			>
		</div>
		<div class="flex items-center gap-5">
			<a href="/docs" class="transition-colors hover:text-foreground">Docs</a>
			<a href="/docs/components" class="transition-colors hover:text-foreground">Components</a>
			<a
				href={siteConfig.repo}
				target="_blank"
				rel="noreferrer"
				class="transition-colors hover:text-foreground"
			>
				GitHub
			</a>
		</div>
	</div>
</footer>

<style>
	/* The masonry dissolves into the footer: balanced columns fade to transparent
	   over the last stretch, revealing the page background beneath. */
	.cards-fade {
		-webkit-mask-image: linear-gradient(to bottom, #000 calc(100% - 180px), transparent 100%);
		mask-image: linear-gradient(to bottom, #000 calc(100% - 180px), transparent 100%);
	}

	/* Big soft pastel washes behind the hero; the orb utilities supply the color. */
	.hero-aura {
		border-radius: 9999px;
		filter: blur(40px);
	}

	/* The orb floats, barely. */
	.hero-orb {
		animation: hero-bob 7s ease-in-out infinite;
		will-change: transform;
	}

	@keyframes hero-bob {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-8px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.hero-orb {
			animation: none;
		}
	}
</style>
