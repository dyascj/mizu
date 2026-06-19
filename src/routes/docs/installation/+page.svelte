<script lang="ts">
	import CodeBlock from '$lib/site/code-block.svelte';
	import CopyCommand from '$lib/site/copy-command.svelte';
	import * as Alert from '$lib/components/ui/alert';
	import Info from 'phosphor-svelte/lib/Info';
	import { siteConfig } from '$lib/site/config';

	const base = siteConfig.registryBase;
	const deps = 'pnpm add bits-ui phosphor-svelte clsx tailwind-merge tailwind-variants';
	const addOne = `npx shadcn-svelte@latest add ${base}/button.json`;
	const addMany = `npx shadcn-svelte@latest add ${base}/dialog.json ${base}/card.json`;

	const registriesJson = `{
  "$schema": "https://shadcn-svelte.com/schema.json",
  "registries": {
    "@mizu": "${base}/{name}.json"
  }
}`;
</script>

<svelte:head>
	<title>Installation — {siteConfig.name}</title>
</svelte:head>

<article class="max-w-2xl">
	<h1 class="font-display text-3xl font-extrabold">Installation</h1>
	<p class="mt-3 text-lg text-muted-foreground">
		Mizu is a shadcn-svelte-compatible registry. Add any component with a single command, the source
		lands in your project and is yours to edit.
	</p>

	<h2 class="mt-10 mb-3 font-display text-xl font-bold">The one-liner</h2>
	<p class="mb-3 leading-relaxed text-muted-foreground">
		Inside a SvelteKit + Tailwind v4 project, this pulls the Button, installs its npm dependencies,
		and adds the shared <code class="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]"
			>cn</code
		>
		helper automatically:
	</p>
	<CopyCommand command={addOne} />
	<p class="mt-3 mb-3 leading-relaxed text-muted-foreground">Add several at once:</p>
	<CopyCommand command={addMany} />

	<Alert.Root variant="info" class="mt-6">
		<Info />
		<Alert.Title>Set your registry URL</Alert.Title>
		<Alert.Description>
			The URL above points at this project's repo via jsDelivr, so it works the moment the repo is
			public on GitHub, no separate host needed. Set <code class="font-mono">repo</code> and
			<code class="font-mono">registryBase</code> in
			<code class="font-mono">src/lib/site/config.ts</code>, then re-run
			<code class="font-mono">pnpm registry:build</code>.
		</Alert.Description>
	</Alert.Root>

	<h2 class="mt-10 mb-3 font-display text-xl font-bold">First-time setup</h2>
	<p class="mb-3 leading-relaxed text-muted-foreground">A new project needs three quick things.</p>

	<h3 class="mt-6 mb-2 font-display text-base font-bold">1. A SvelteKit + Tailwind v4 app</h3>
	<div class="flex flex-col gap-2">
		<CopyCommand command="npx sv create my-app" />
		<CopyCommand command="npx sv add tailwindcss" />
	</div>

	<h3 class="mt-6 mb-2 font-display text-base font-bold">2. The theme</h3>
	<p class="mb-3 leading-relaxed text-muted-foreground">
		Paste the Mizu theme into your <code
			class="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">src/app.css</code
		>, right after <code class="font-mono text-[0.85em]">@import 'tailwindcss';</code>. It is one
		portable file (copy it from this repo's
		<code class="font-mono text-[0.85em]">src/app.css</code>, or grab the token block from the
		<a
			href="/docs/theming"
			class="font-medium text-[color:var(--primary)] underline-offset-4 hover:underline">Theming</a
		> page). It defines the palette, glass and gloss utilities, gradients, elevation, and fonts.
	</p>

	<h3 class="mt-6 mb-2 font-display text-base font-bold">3. Dependencies</h3>
	<p class="mb-3 leading-relaxed text-muted-foreground">
		The CLI installs these per-component, but you can add them upfront:
	</p>
	<CopyCommand command={deps} />

	<h2 class="mt-10 mb-3 font-display text-xl font-bold">Use a registry namespace</h2>
	<p class="mb-3 leading-relaxed text-muted-foreground">
		Prefer short names? Register Mizu once in your <code
			class="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">components.json</code
		>:
	</p>
	<CodeBlock code={registriesJson} />
	<p class="mt-4 mb-3 leading-relaxed text-muted-foreground">…then add by name:</p>
	<CopyCommand command="npx shadcn-svelte@latest add @mizu/button @mizu/card" />

	<p class="mt-8 text-sm text-muted-foreground">
		Or skip the CLI entirely: every component page has its full source ready to copy into
		<code class="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]"
			>src/lib/components/ui/</code
		>.
	</p>
</article>
