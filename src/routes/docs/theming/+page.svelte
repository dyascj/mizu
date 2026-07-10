<script lang="ts">
	import CodeBlock from '$lib/site/code-block.svelte';
	import { siteConfig } from '$lib/site/config';
	import Seo from '$lib/site/seo.svelte';

	const ramp = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

	const tokenSnippet = `:root {
	--background: #ffffff;
	--foreground: #1c2b33;
	--card: #ffffff;
	--muted: #f2f4f7;
	--muted-foreground: #70767d;
	--primary: #00b2ff; /* the one accent */
	--primary-foreground: #ffffff;
	--border: #eceef1; /* hairlines everywhere */
	--ring: var(--primary);

	/* Soft ambient elevation — never bevels */
	--elevation-sm: 0 0 10px rgba(28, 43, 51, 0.06);
	--elevation-lg: 0 8px 24px rgba(28, 43, 51, 0.1);

	/* Pastel auras for AI moments */
	--orb-pink: radial-gradient(circle, rgba(253, 221, 222, 0.85) 0%, transparent 70%);
	--aurora: linear-gradient(135deg, #f4e7ff 0%, #fdddde 100%);
}

.dark {
	--background: #000000; /* pure black */
	--foreground: #f6f8f9;
	--card: #0c1116; /* slate lifted from the ink */
	--primary: #00b2ff;
	/* …each token gets a dark variant… */
}`;

	const utilities = [
		['glass / glass-subtle', 'Flat frosted translucency + backdrop blur, for floating panels.'],
		['orb-pink / -blue / -purple / -peach', 'Soft radial pastel auras. Pair with blur for glow.'],
		['aurora / -cool / -iris / -mint', 'Pastel linear washes for surfaces and art.'],
		['shadow-xs … shadow-xl / shadow-glow', 'Soft ambient elevation, plus a blue glow.']
	];
</script>

<Seo
	title="Theming — {siteConfig.name}"
	description="Theme Mizu with a handful of tokens. White surfaces, hairline borders, soft shadows, and pastel auras, with an airy light mode and a pure-black dark mode, built for Tailwind v4."
/>

<article class="max-w-2xl">
	<h1 class="text-3xl font-semibold">Theming</h1>
	<p class="mt-3 text-lg text-muted-foreground">
		One file drives everything. Mizu's look lives in CSS custom properties, mapped to Tailwind v4
		utilities. Recolor the system by changing a handful of tokens.
	</p>

	<h2 class="mt-10 mb-3 text-xl font-semibold">The token block</h2>
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

	<h2 class="mt-10 mb-3 text-xl font-semibold">The brand ramp</h2>
	<p class="mb-3 leading-relaxed text-muted-foreground">
		<code class="font-mono text-[0.85em]">mizu-50</code> through
		<code class="font-mono text-[0.85em]">mizu-950</code>. The accent is
		<code class="font-mono text-[0.85em]">mizu-500</code>. Swap these to re-tint the whole system.
	</p>
	<div class="mb-2 grid grid-cols-11 overflow-hidden rounded-xl border border-border shadow-xs">
		{#each ramp as step}
			<div class="h-12" style={`background-color: var(--color-mizu-${step})`}></div>
		{/each}
	</div>
	<div class="grid grid-cols-11 text-center font-mono text-[0.6rem] text-muted-foreground">
		{#each ramp as step}<span>{step}</span>{/each}
	</div>

	<h2 class="mt-10 mb-3 text-xl font-semibold">Material utilities</h2>
	<p class="mb-3 leading-relaxed text-muted-foreground">
		Beyond colors, Mizu adds a small set of surface utilities you can use anywhere.
	</p>
	<div class="overflow-hidden rounded-xl border border-border">
		{#each utilities as [name, desc], i}
			<div
				class={'flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:items-baseline sm:gap-4 ' +
					(i % 2 ? 'bg-muted/40' : '')}
			>
				<code class="shrink-0 font-mono text-sm text-primary sm:w-72">{name}</code>
				<span class="text-sm text-muted-foreground">{desc}</span>
			</div>
		{/each}
	</div>

	<h2 class="mt-10 mb-3 text-xl font-semibold">Dark mode</h2>
	<p class="mb-4 leading-relaxed text-muted-foreground">
		Mizu uses a class strategy: add <code
			class="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">dark</code
		>
		to <code class="font-mono text-[0.85em]">&lt;html&gt;</code>. The page goes pure black and
		surfaces lift to slate. The included theme store handles persistence and a no-flash inline
		script. Toggle it with the sun/moon button in the header.
	</p>
</article>
