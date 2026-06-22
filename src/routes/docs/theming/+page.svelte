<script lang="ts">
	import CodeBlock from '$lib/site/code-block.svelte';
	import { siteConfig } from '$lib/site/config';
	import Seo from '$lib/site/seo.svelte';

	const ramp = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

	const tokenSnippet = `:root {
	--background: #e9f2f8;
	--foreground: #14303f;
	--card: #ffffff;
	--muted: #d8e7f1;
	--muted-foreground: #587688;
	--primary: #01b2ff;          /* aqua hero */
	--primary-foreground: #ffffff;
	--border: #c3d9e7;
	--ring: #38bdf8;

	/* Glass + gloss materials */
	--glass: rgba(255, 255, 255, 0.6);
	--glass-border: rgba(255, 255, 255, 0.7);
	--sheen: rgba(255, 255, 255, 0.55);

	/* Glossy gradients + elevation (abbreviated) */
	--gradient-primary: linear-gradient(180deg, #5cd5ff, #01b2ff 48%, #0090d9);
	--elevation-aqua: inset 0 1px 0 rgba(255,255,255,.5), 0 4px 12px rgba(1,178,255,.35);
}

.dark {
	--background: #061520;       /* deep water */
	--foreground: #e3f1fa;
	--primary: #29c7ff;
	/* …each token gets a dark variant… */
}`;

	const utilities = [
		['glass / glass-strong', 'Frosted translucent surface + backdrop blur.'],
		['gloss', 'The wet top sheen (a ::before highlight). Needs relative + overflow-hidden.'],
		['gradient-primary / -surface / …', 'Glossy 180° gradients for fills.'],
		[
			'shadow-aqua / -glass / -bevel / -pressed',
			'Layered elevation, from cyan glow to recessed wells.'
		]
	];
</script>

<Seo
	title="Theming — {siteConfig.name}"
	description="Theme Mizu with a single token. Change --primary to recolor the entire Frutiger Aero system, with light and dark modes, glass materials, and glossy gradients built in for Tailwind v4."
/>

<article class="max-w-2xl">
	<h1 class="font-display text-3xl font-extrabold">Theming</h1>
	<p class="mt-3 text-lg text-muted-foreground">
		One file drives everything. Mizu's look lives in CSS custom properties, mapped to Tailwind v4
		utilities. Recolor the system by changing a handful of tokens.
	</p>

	<h2 class="mt-10 mb-3 font-display text-xl font-bold">The token block</h2>
	<p class="mb-3 leading-relaxed text-muted-foreground">
		Add this to <code class="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]"
			>src/app.css</code
		>
		after
		<code class="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]"
			>@import 'tailwindcss';</code
		>. Semantic tokens (<code class="font-mono text-[0.85em]">--background</code>,
		<code class="font-mono text-[0.85em]">--primary</code>, …) are mapped with
		<code class="font-mono text-[0.85em]">@theme inline</code> so utilities like
		<code class="font-mono text-[0.85em]">bg-primary</code> react to light and dark automatically.
	</p>
	<CodeBlock code={tokenSnippet} />

	<h2 class="mt-10 mb-3 font-display text-xl font-bold">The aqua ramp</h2>
	<p class="mb-3 leading-relaxed text-muted-foreground">
		<code class="font-mono text-[0.85em]">mizu-50</code> through
		<code class="font-mono text-[0.85em]">mizu-950</code>. The hero is
		<code class="font-mono text-[0.85em]">mizu-500</code>. Swap these to re-tint the whole system.
	</p>
	<div class="mb-2 grid grid-cols-11 overflow-hidden rounded-xl border border-border shadow-bevel">
		{#each ramp as step}
			<div class="h-12" style={`background-color: var(--color-mizu-${step})`}></div>
		{/each}
	</div>
	<div class="grid grid-cols-11 text-center font-mono text-[0.6rem] text-muted-foreground">
		{#each ramp as step}<span>{step}</span>{/each}
	</div>

	<h2 class="mt-10 mb-3 font-display text-xl font-bold">Material utilities</h2>
	<p class="mb-3 leading-relaxed text-muted-foreground">
		Beyond colors, Mizu adds a small set of Frutiger Aero surface utilities you can use anywhere.
	</p>
	<div class="overflow-hidden rounded-xl border border-border">
		{#each utilities as [name, desc], i}
			<div
				class={'flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:items-baseline sm:gap-4 ' +
					(i % 2 ? 'bg-muted/40' : '')}
			>
				<code class="shrink-0 font-mono text-sm text-[color:var(--primary)] sm:w-72">{name}</code>
				<span class="text-sm text-muted-foreground">{desc}</span>
			</div>
		{/each}
	</div>

	<h2 class="mt-10 mb-3 font-display text-xl font-bold">Dark mode</h2>
	<p class="mb-4 leading-relaxed text-muted-foreground">
		Mizu uses a class strategy: add <code
			class="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">dark</code
		>
		to <code class="font-mono text-[0.85em]">&lt;html&gt;</code>. The included theme store handles
		persistence and a no-flash inline script. Toggle it with the sun/moon button in the header.
	</p>
</article>
