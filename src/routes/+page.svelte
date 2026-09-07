<script lang="ts">
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import { Button } from '$lib/components/ui/button';
	import LandingCards from '$lib/site/landing-cards.svelte';
	import CopyCommand from '$lib/site/copy-command.svelte';
	import OrbMark from '$lib/site/orb-mark.svelte';
	import { components } from '$lib/site/catalog';
	import Seo from '$lib/site/seo.svelte';
	import { registryPinnedBase, siteConfig } from '$lib/site/config';

	const installCmd = `npx shadcn-svelte@latest add ${registryPinnedBase}/button.json`;

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
	<section class="mx-auto max-w-6xl px-5 pt-20 pb-14 text-center sm:px-8 sm:pt-16 sm:pb-14">
		<p class="text-muted-foreground mb-6 text-sm">Open source · Svelte 5 · Tailwind v4</p>
		<h1
			class="mx-auto max-w-4xl text-[clamp(2.75rem,6.5vw,5.5rem)] leading-[1.02] font-semibold tracking-[-0.055em] text-balance"
		>
			Build a better<br />conversation.
		</h1>
		<p
			class="text-muted-foreground mx-auto mt-7 max-w-md text-base leading-relaxed text-balance sm:text-lg"
		>
			{components.length} components for thoughtful AI products.<br class="hidden sm:block" /> Copy the
			source. Make it your own.
		</p>
		<div class="mt-8 flex flex-wrap items-center justify-center gap-3">
			<Button
				href="/docs/installation"
				size="lg"
				class="bg-foreground text-background hover:bg-foreground/90 shadow-none"
				>Start building <ArrowRight class="size-4" /></Button
			>
			<Button href="/docs/components" variant="ghost" size="lg">Explore components</Button>
		</div>
		<CopyCommand
			command={installCmd}
			class="mx-auto mt-7 w-full max-w-md bg-transparent shadow-none"
		/>
	</section>
	<section aria-label="Interactive component examples" class="mx-auto max-w-6xl px-5 sm:px-8">
		<LandingCards />
	</section>
	<section
		class="mx-auto grid max-w-6xl gap-8 px-5 py-20 sm:px-8 sm:py-28 md:grid-cols-2 md:gap-20"
	>
		<div>
			<h2 class="max-w-sm text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
				Your product.<br />Down to the details.
			</h2>
			<p class="text-muted-foreground mt-5 max-w-md leading-relaxed">
				Compose a conversation, give an agent a workspace, or start with the essentials. Every
				component shares the same foundation.
			</p>
			<a
				href="/blocks"
				class="hover:text-primary mt-6 inline-flex items-center gap-2 text-sm font-medium transition-colors"
				>Explore complete screens <ArrowRight class="size-4" /></a
			>
		</div>
		<div class="grid gap-7 sm:grid-cols-2">
			<div>
				<h3 class="text-sm font-medium">Source you own</h3>
				<p class="text-muted-foreground mt-2 text-sm leading-relaxed">
					Install only what you need. Edit the component directly in your project.
				</p>
			</div>
			<div>
				<h3 class="text-sm font-medium">One visual language</h3>
				<p class="text-muted-foreground mt-2 text-sm leading-relaxed">
					Shared color, spacing, and motion across forms, conversations, and data.
				</p>
			</div>
			<div>
				<h3 class="text-sm font-medium">Light and dark</h3>
				<p class="text-muted-foreground mt-2 text-sm leading-relaxed">
					A full set of semantic tokens. Change the theme without restyling each component.
				</p>
			</div>
			<div>
				<h3 class="text-sm font-medium">Built for interaction</h3>
				<p class="text-muted-foreground mt-2 text-sm leading-relaxed">
					Keyboard controls, visible focus, and respect for reduced motion.
				</p>
			</div>
		</div>
	</section>
</main>
<footer class="bg-secondary/50">
	<div
		class="text-muted-foreground mx-auto flex max-w-6xl flex-col justify-between gap-5 px-5 py-8 text-sm sm:flex-row sm:items-center sm:px-8"
	>
		<a
			href={siteConfig.authorUrl}
			target="_blank"
			rel="noreferrer"
			class="hover:text-foreground flex items-center gap-2.5"
			><OrbMark class="size-5" /> Mizu · by CJ Dyas</a
		>
		<nav aria-label="Footer" class="flex flex-wrap items-center gap-6">
			<a href="/docs" class="hover:text-foreground">Docs</a>
			<a href="/docs/components" class="hover:text-foreground">Components</a>
			<a href={siteConfig.repo} target="_blank" rel="noreferrer" class="hover:text-foreground"
				>GitHub</a
			>
			<span class="text-xs">MIT licensed</span>
		</nav>
	</div>
</footer>
