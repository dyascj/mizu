<script lang="ts">
	import { ArrowRight, Droplets } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import { components } from '$lib/site/catalog';
	import { siteConfig } from '$lib/site/config';
</script>

<svelte:head>
	<title>Introduction — {siteConfig.name}</title>
</svelte:head>

<article class="max-w-2xl">
	<img
		src="/brand/mizu-side-by-side.png"
		alt="Mizu — Design System"
		class="mb-8 h-12 w-auto sm:h-14"
	/>
	<h1 class="font-display text-3xl font-extrabold">Introduction</h1>
	<p class="mt-3 text-lg text-muted-foreground">
		Mizu is a Frutiger Aero design system for Svelte. Glossy, glassy, gorgeously rounded components
		that bring back the optimism of early-2000s UI, built honestly for Svelte 5 and Tailwind v4.
	</p>

	<h2 class="mt-10 mb-3 font-display text-xl font-bold">Why Frutiger Aero</h2>
	<p class="mb-4 leading-relaxed text-muted-foreground">
		The aesthetic of clear skies, water droplets, and wet glass had a confidence we lost somewhere
		in the flat years. Mizu (<span class="font-display">水</span>, "water") leans all the way in:
		frosted glass, a real top sheen, layered light, bright aqua, and generous rounding, applied with
		restraint so it feels polished instead of busy.
	</p>

	<h2 class="mt-10 mb-3 font-display text-xl font-bold">Principles</h2>
	<ul class="mb-4 ml-5 list-disc space-y-2 text-muted-foreground">
		<li>
			<span class="font-semibold text-foreground">Physically honest.</span> Gloss, glass, and glow come
			from real CSS, never baked-in screenshots.
		</li>
		<li>
			<span class="font-semibold text-foreground">Accessible underneath.</span> Interactive
			components wrap
			<a
				href="https://bits-ui.com"
				class="font-medium text-[color:var(--primary)] underline-offset-4 hover:underline"
				>bits-ui</a
			> primitives, so keyboard and screen-reader behavior is handled.
		</li>
		<li>
			<span class="font-semibold text-foreground">Yours to own.</span> Components are copied into your
			project as source. No black-box dependency, no version lock.
		</li>
		<li>
			<span class="font-semibold text-foreground">Tokens all the way down.</span> One theme file drives
			every surface, in a sunlit light mode and a deep-water dark mode.
		</li>
	</ul>

	<h2 class="mt-10 mb-3 font-display text-xl font-bold">How it ships</h2>
	<p class="mb-4 leading-relaxed text-muted-foreground">
		Mizu is distributed as a <span
			class="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground"
			>shadcn-svelte</span
		>-compatible registry. Real developers install components with tooling they already know; AI
		agents get clean per-component JSON; and every component page here shows the full source to copy
		by hand. {components.length} components are ready today.
	</p>

	<div class="mt-8 flex flex-wrap gap-3">
		<Button href="/docs/installation">
			Install Mizu
			<ArrowRight class="size-4" />
		</Button>
		<Button href="/docs/components/button" variant="secondary">
			<Droplets class="size-4" />
			See the components
		</Button>
	</div>
</article>
