<script lang="ts">
	import ArrowRight from 'phosphor-svelte/lib/ArrowRight';
	import Star from 'phosphor-svelte/lib/Star';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Bubbles } from '$lib/components/ui/bubbles';
	import LandingShowcase from '$lib/site/landing-showcase.svelte';
	import { siteConfig } from '$lib/site/config';
	import { components } from '$lib/site/catalog';
</script>

<svelte:head>
	<title>{siteConfig.name} — {siteConfig.tagline}</title>
	<meta name="description" content={siteConfig.description} />
</svelte:head>

<!-- Hero — a glossy 2008 daydream -->
<section class="relative overflow-hidden">
	<div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
		<div
			class="hero-bloom absolute top-[-16%] left-1/2 h-[560px] w-[920px] max-w-[160vw] -translate-x-1/2 rounded-full blur-3xl"
		></div>
		<span class="hero-bokeh hero-bokeh-1"></span>
		<span class="hero-bokeh hero-bokeh-2"></span>
		<span class="hero-bokeh hero-bokeh-3"></span>
		<Bubbles count={18} />
	</div>

	<div
		class="mx-auto flex max-w-3xl flex-col items-center gap-5 px-6 pt-14 pb-16 text-center sm:pt-20"
	>
		<div class="relative">
			<img
				src="/brand/mizu-icon.png"
				alt="Mizu"
				class="hero-orb relative z-10 h-32 w-auto drop-shadow-[0_18px_55px_color-mix(in_srgb,var(--primary)_50%,transparent)] sm:h-44"
			/>
			<div
				class="absolute inset-x-0 top-[80%] mx-auto h-6 w-2/3 rounded-[50%] bg-[color:var(--primary)] opacity-25 blur-xl"
			></div>
		</div>

		<Badge variant="secondary" class="gap-1.5">
			<span class="size-1.5 rounded-full bg-[color:var(--primary)]"></span>
			Frutiger Aero · Svelte 5 · {components.length} components
		</Badge>

		<h1
			class="hero-title font-display text-5xl leading-[0.95] font-extrabold tracking-tight text-balance sm:text-7xl"
		>
			Frutiger Aero is back.
		</h1>

		<p class="max-w-md text-balance text-muted-foreground sm:text-lg">
			Glossy, glassy components for Svelte — the optimism of 2008, rebuilt for Svelte 5 and Tailwind
			v4.
		</p>

		<div class="mt-1 flex flex-wrap items-center justify-center gap-3">
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
		<div class="flex items-center gap-2.5">
			<img src="/brand/mizu-side-by-side.png" alt="Mizu Design System" class="h-7 w-auto" />
			<span
				>· by <a
					href={siteConfig.authorUrl}
					target="_blank"
					rel="noreferrer"
					class="font-medium text-foreground transition-colors hover:text-[color:var(--primary)]"
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
	/* Bright aqua sky-bloom behind the orb. */
	.hero-bloom {
		background: radial-gradient(
			closest-side,
			color-mix(in oklab, var(--primary) 60%, white),
			color-mix(in oklab, var(--primary) 42%, transparent) 45%,
			transparent 72%
		);
		opacity: 0.5;
	}

	/* Drifting glossy bokeh orbs. */
	.hero-bokeh {
		position: absolute;
		border-radius: 9999px;
		background: radial-gradient(
			circle at 35% 30%,
			rgba(255, 255, 255, 0.95),
			color-mix(in oklab, var(--primary) 55%, transparent) 62%,
			transparent 78%
		);
		filter: blur(1px);
		will-change: transform;
	}
	.hero-bokeh-1 {
		width: 84px;
		height: 84px;
		left: 12%;
		top: 30%;
		opacity: 0.55;
		animation: hero-drift 14s ease-in-out infinite;
	}
	.hero-bokeh-2 {
		width: 46px;
		height: 46px;
		right: 17%;
		top: 22%;
		opacity: 0.5;
		animation: hero-drift 18s ease-in-out infinite 1.5s;
	}
	.hero-bokeh-3 {
		width: 120px;
		height: 120px;
		right: 8%;
		bottom: 12%;
		opacity: 0.32;
		animation: hero-drift 22s ease-in-out infinite 0.6s;
	}

	/* The brand orb floats. */
	.hero-orb {
		animation: hero-bob 6s ease-in-out infinite;
		will-change: transform;
	}

	/* Glossy, wet aqua title — gradient fill with a Web 2.0 bevel + glow. */
	.hero-title {
		background-image: linear-gradient(
			180deg,
			color-mix(in oklab, var(--primary) 52%, white),
			var(--primary) 52%,
			color-mix(in oklab, var(--primary) 74%, black)
		);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		padding-bottom: 0.08em;
		filter: drop-shadow(0 1px 0 rgba(255, 255, 255, 0.55))
			drop-shadow(0 8px 22px color-mix(in srgb, var(--primary) 30%, transparent));
	}

	@keyframes hero-bob {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-12px);
		}
	}
	@keyframes hero-drift {
		0%,
		100% {
			transform: translate(0, 0);
		}
		50% {
			transform: translate(-14px, -26px);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.hero-orb,
		.hero-bokeh {
			animation: none;
		}
	}
</style>
