<script lang="ts">
	import ArrowRight from 'phosphor-svelte/lib/ArrowRight';
	import Star from 'phosphor-svelte/lib/Star';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Orb } from '$lib/components/ui/orb';
	import { Bubbles } from '$lib/components/ui/bubbles';
	import LandingShowcase from '$lib/site/landing-showcase.svelte';
	import { siteConfig } from '$lib/site/config';
	import { components } from '$lib/site/catalog';
</script>

<svelte:head>
	<title>{siteConfig.name} — {siteConfig.tagline}</title>
	<meta name="description" content={siteConfig.description} />
</svelte:head>

<!-- Hero -->
<section class="relative overflow-hidden">
	<div class="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
		<div class="absolute -top-32 left-1/2 -translate-x-1/2">
			<Orb size={500} />
		</div>
		<Bubbles count={12} />
	</div>

	<div class="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 pt-20 pb-12 text-center">
		<Badge variant="secondary" class="gap-1.5">
			<span class="size-1.5 rounded-full bg-[color:var(--primary)]"></span>
			Frutiger Aero · Svelte 5 · {components.length} components
		</Badge>

		<h1 class="font-display text-4xl leading-[1.04] font-extrabold sm:text-6xl">
			<span class="block">Glossy by default.</span>
			<span class="block text-muted-foreground">Customizable by design.</span>
		</h1>

		<p class="max-w-xl text-balance text-muted-foreground sm:text-lg">
			{siteConfig.description}
		</p>

		<div class="flex flex-wrap items-center justify-center gap-3">
			<Button href="/docs" size="lg">
				Get started
				<ArrowRight class="size-4" />
			</Button>
			<Button href="/docs/components" variant="secondary" size="lg">Browse components</Button>
		</div>

		<a
			href={siteConfig.repo}
			target="_blank"
			rel="noreferrer"
			class="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
		>
			<Star class="size-4 text-[color:var(--primary)]" />
			Open source on GitHub
		</a>
	</div>
</section>

<!-- Showcase: framed, tabbed, recolorable -->
<section class="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
	<LandingShowcase />
</section>

<footer class="border-t border-border">
	<div
		class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-7 text-sm text-muted-foreground sm:flex-row"
	>
		<p>
			<span class="font-display font-bold text-foreground">{siteConfig.name}</span>
			{siteConfig.wordmark} · A Frutiger Aero design system for Svelte. By
			<a
				href={siteConfig.authorUrl}
				target="_blank"
				rel="noreferrer"
				class="font-medium text-foreground transition-colors hover:text-[color:var(--primary)]"
			>
				{siteConfig.author}
			</a>.
		</p>
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
