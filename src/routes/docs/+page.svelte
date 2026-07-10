<script lang="ts">
	import { ArrowRight, Sparkles } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import { components } from '$lib/site/catalog';
	import { siteConfig } from '$lib/site/config';
	import MizuLogo from '$lib/site/mizu-logo.svelte';
	import Seo from '$lib/site/seo.svelte';
</script>

<Seo
	title="Introduction — {siteConfig.name}"
	description="Mizu is an open-source component library for SvelteKit — clean, airy, accessible components you copy into your project and own. Built on Svelte 5 runes, Tailwind v4, and bits-ui."
/>

<article class="max-w-2xl">
	<MizuLogo class="mb-8 scale-125" />
	<h1 class="text-3xl font-semibold">Introduction</h1>
	<p class="mt-3 text-lg text-muted-foreground">
		Mizu is a clean, airy design system for Svelte. White surfaces, hairline borders, soft
		shadows, and pill controls, built honestly for Svelte 5 and Tailwind v4.
	</p>

	<h2 class="mt-10 mb-3 text-xl font-semibold">The language</h2>
	<p class="mb-4 leading-relaxed text-muted-foreground">
		Interfaces built for AI deserve calm. Mizu (<span class="font-medium">水</span>, "water")
		keeps every surface quiet so the content and the intelligence can speak: white on white with
		hairline lines, shadows you feel more than see, one blue accent, and a soft pastel glow
		reserved for the moments where the AI is present. Nothing shines, nothing shouts.
	</p>

	<h2 class="mt-10 mb-3 text-xl font-semibold">Principles</h2>
	<ul class="mb-4 ml-5 list-disc space-y-2 text-muted-foreground">
		<li>
			<span class="font-semibold text-foreground">Quiet by default.</span> Hierarchy comes from
			space, hairlines, and type, not decoration. The accent is for what matters.
		</li>
		<li>
			<span class="font-semibold text-foreground">Accessible underneath.</span> Interactive
			components wrap
			<a
				href="https://bits-ui.com"
				class="font-medium text-primary underline-offset-4 hover:underline">bits-ui</a
			> primitives, so keyboard and screen-reader behavior is handled.
		</li>
		<li>
			<span class="font-semibold text-foreground">Yours to own.</span> Components are copied into your
			project as source. No black-box dependency, no version lock.
		</li>
		<li>
			<span class="font-semibold text-foreground">Tokens all the way down.</span> One theme file drives
			every surface, in an airy light mode and a pure-black dark mode.
		</li>
	</ul>

	<h2 class="mt-10 mb-3 text-xl font-semibold">How it ships</h2>
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
			<Sparkles class="size-4" />
			See the components
		</Button>
	</div>
</article>
