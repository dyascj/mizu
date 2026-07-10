<script lang="ts">
	import CodeBlock from '$lib/site/code-block.svelte';
	import CopyCommand from '$lib/site/copy-command.svelte';
	import * as Alert from '$lib/components/ui/alert';
	import Info from '@lucide/svelte/icons/info';
	import { siteConfig } from '$lib/site/config';
	import Seo from '$lib/site/seo.svelte';

	const base = siteConfig.registryBase;
	const addOne = `npx shadcn-svelte@latest add ${base}/button.json`;
	const addMany = `npx shadcn-svelte@latest add ${base}/dialog.json ${base}/card.json`;

	const componentsJson = `{
  "$schema": "https://shadcn-svelte.com/schema.json",
  "tailwind": { "css": "src/app.css", "baseColor": "neutral" },
  "aliases": {
    "lib": "$lib",
    "utils": "$lib/utils",
    "components": "$lib/components",
    "ui": "$lib/components/ui",
    "hooks": "$lib/hooks"
  },
  "typescript": true,
  "registry": "https://shadcn-svelte.com/registry"
}`;
</script>

<Seo
	title="Installation — {siteConfig.name}"
	description="Set up Mizu in your SvelteKit project: configure Tailwind v4 and components.json, then add clean, airy components with the shadcn-svelte CLI and own the source."
/>

<article class="max-w-2xl">
	<h1 class="font-display text-3xl font-semibold">Installation</h1>
	<p class="mt-3 text-lg text-muted-foreground">
		Mizu is a shadcn-svelte-compatible registry. After a one-time setup, add any component with a
		single command; the source lands in your project and is yours to edit.
	</p>

	<h2 class="mt-10 mb-3 font-display text-xl font-semibold">1. Create a SvelteKit + Tailwind v4 app</h2>
	<div class="flex flex-col gap-2">
		<CopyCommand command="npx sv create my-app" />
		<CopyCommand command="npx sv add tailwindcss" />
	</div>

	<h2 class="mt-10 mb-3 font-display text-xl font-semibold">2. Add a components.json</h2>
	<p class="mb-3 leading-relaxed text-muted-foreground">
		This tells the CLI where to place files. Create <code
			class="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">components.json</code
		>
		at the project root:
	</p>
	<CodeBlock code={componentsJson} />
	<p class="mt-3 mb-3 leading-relaxed text-muted-foreground">
		Or run <code class="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]"
			>npx shadcn-svelte@latest init</code
		> to generate one interactively (pick any base color, you'll replace its theme next).
	</p>

	<h2 class="mt-10 mb-3 font-display text-xl font-semibold">3. Add the theme</h2>
	<p class="mb-3 leading-relaxed text-muted-foreground">
		Paste the Mizu theme into your <code
			class="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">src/app.css</code
		>, right after <code class="font-mono text-[0.85em]">@import 'tailwindcss';</code>. It is one
		portable file (copy it from
		<a
			href="https://github.com/dyascj/mizu/blob/main/src/app.css"
			target="_blank"
			rel="noreferrer"
			class="font-medium text-[color:var(--primary)] underline-offset-4 hover:underline"
			>the repo's <code class="font-mono text-[0.85em]">src/app.css</code></a
		>, or grab the token block from the
		<a
			href="/docs/theming"
			class="font-medium text-[color:var(--primary)] underline-offset-4 hover:underline">Theming</a
		> page). It defines the palette, surface utilities, pastel auras, elevation, and fonts.
	</p>

	<h2 class="mt-10 mb-3 font-display text-xl font-semibold">4. Add components</h2>
	<p class="mb-3 leading-relaxed text-muted-foreground">
		Now the one-liner. It pulls the component, installs its npm dependencies, and adds the shared
		<code class="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">cn</code> helper automatically:
	</p>
	<CopyCommand command={addOne} />
	<p class="mt-3 mb-3 leading-relaxed text-muted-foreground">Add several at once:</p>
	<CopyCommand command={addMany} />

	<p class="mt-6 text-sm text-muted-foreground">
		Prefer not to use the CLI? Every component page has its full source ready to copy straight into
		<code class="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]"
			>src/lib/components/ui/</code
		>
		(you'll also want <code class="font-mono text-[0.85em]">src/lib/utils.ts</code> and the theme).
	</p>

	<Alert.Root variant="info" class="mt-8">
		<Info />
		<Alert.Title>Forking Mizu?</Alert.Title>
		<Alert.Description>
			The registry is served from <code class="font-mono">mizu-ui.com</code>. If you fork it, point
			<code class="font-mono">repo</code> and <code class="font-mono">registryBase</code> in
			<code class="font-mono">src/lib/site/config.ts</code> at your own deployment, then re-run
			<code class="font-mono">pnpm registry:build</code>.
		</Alert.Description>
	</Alert.Root>
</article>
