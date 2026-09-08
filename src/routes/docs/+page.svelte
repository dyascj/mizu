<script lang="ts">
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import { Button } from '$lib/components/ui/button';
	import { components } from '$lib/site/catalog';
	import { siteConfig } from '$lib/site/config';
	import MizuLogo from '$lib/site/mizu-logo.svelte';
	import Seo from '$lib/site/seo.svelte';
</script>

<Seo
	title="Introduction · {siteConfig.name}"
	description="Mizu is an open-source design system for AI products. Clean, airy, accessible components for chat, voice, and reasoning that you copy into your project and own. Built on Svelte 5 runes, Tailwind v4, and bits-ui."
/>

<article class="max-w-2xl">
	<MizuLogo class="mb-8 scale-125" />
	<h1 class="text-4xl font-semibold tracking-tight sm:text-5xl">Introduction</h1>
	<p class="text-muted-foreground mt-3 text-lg">
		Mizu is a Svelte 5 component library for AI products. Build conversations, voice interfaces, and
		agent workflows with source you can copy into your project and customize.
	</p>

	<h2 class="mt-10 mb-3 text-xl font-semibold">The language</h2>
	<p class="text-muted-foreground mb-4 leading-relaxed">
		Black, white, and neutral grays give the interface its structure. Color marks status and AI
		activity. Controls remain distinct on each surface, with visible focus and readable labels in
		light and dark themes.
	</p>

	<h2 class="mt-10 mb-3 text-xl font-semibold">Principles</h2>
	<ul class="text-muted-foreground mb-4 ml-5 list-disc space-y-2">
		<li>
			<span class="text-foreground font-semibold">Quiet by default.</span> Hierarchy comes from space,
			tonal fills, and type, not decoration. The accent is for what matters.
		</li>
		<li>
			<span class="text-foreground font-semibold">Accessible underneath.</span> Interactive
			components wrap
			<a
				href="https://bits-ui.com"
				class="text-primary font-medium underline-offset-4 hover:underline">bits-ui</a
			> primitives for established keyboard and screen-reader behavior. Supply meaningful labels and test
			the completed flow in your app.
		</li>
		<li>
			<span class="text-foreground font-semibold">Yours to own.</span> Components are copied into your
			project as source. No black-box dependency, no version lock.
		</li>
		<li>
			<span class="text-foreground font-semibold">Tokens all the way down.</span> One theme file drives
			every surface, in a neutral light mode and a pure-black dark mode.
		</li>
	</ul>

	<h2 class="mt-10 mb-3 text-xl font-semibold">How it ships</h2>
	<p class="text-muted-foreground mb-4 leading-relaxed">
		Every component is source you copy into your project and own. Add one with a single command
		using the CLI you already have, point an AI agent at the clean per-component JSON, or copy the
		code straight from any component page. {components.length} components are ready today.
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
