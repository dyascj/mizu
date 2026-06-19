<script lang="ts">
	import CodeBlock from '$lib/site/code-block.svelte';
	import CopyCommand from '$lib/site/copy-command.svelte';
	import * as Alert from '$lib/components/ui/alert';
	import { Info } from '@lucide/svelte';
	import { siteConfig } from '$lib/site/config';

	const deps = 'pnpm add bits-ui @lucide/svelte clsx tailwind-merge tailwind-variants';

	const cnSource = `import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}`;

	const addCmd = `npx shadcn-svelte@latest add ${siteConfig.registryBase}/button.json`;
</script>

<svelte:head>
	<title>Installation — {siteConfig.name}</title>
</svelte:head>

<article class="max-w-2xl">
	<h1 class="font-display text-3xl font-extrabold">Installation</h1>
	<p class="mt-3 text-lg text-muted-foreground">
		Mizu runs on SvelteKit, Svelte 5, and Tailwind v4. Set those up, drop in the theme, then add
		components.
	</p>

	<Alert.Root variant="info" class="mt-6">
		<Info />
		<Alert.Title>Registry URL is a placeholder</Alert.Title>
		<Alert.Description>
			The <code class="font-mono">{siteConfig.registryBase}</code> domain below is illustrative. Until
			Mizu is deployed, use the copy-and-paste source shown on each component page.
		</Alert.Description>
	</Alert.Root>

	<h2 class="mt-10 mb-3 font-display text-xl font-bold">1. Create a project</h2>
	<p class="mb-3 leading-relaxed text-muted-foreground">
		Start a SvelteKit app and add Tailwind v4 with the official CLI.
	</p>
	<div class="flex flex-col gap-2">
		<CopyCommand command="npx sv create my-app" />
		<CopyCommand command="npx sv add tailwindcss" />
	</div>

	<h2 class="mt-10 mb-3 font-display text-xl font-bold">2. Install dependencies</h2>
	<CopyCommand command={deps} />

	<h2 class="mt-10 mb-3 font-display text-xl font-bold">3. Add the <code class="font-mono text-[0.9em]">cn</code> helper</h2>
	<p class="mb-3 leading-relaxed text-muted-foreground">
		Create <code class="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">src/lib/utils.ts</code
		>. Every component imports it.
	</p>
	<CodeBlock code={cnSource} />

	<h2 class="mt-10 mb-3 font-display text-xl font-bold">4. Add the theme</h2>
	<p class="mb-3 leading-relaxed text-muted-foreground">
		Paste the Mizu token block into your <code
			class="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">src/app.css</code
		>. It defines the aqua palette, glass and gloss materials, gradients, elevation shadows, radius
		scale, and fonts, in light and dark. Grab it from the
		<a
			href="/docs/theming"
			class="font-medium text-[color:var(--primary)] underline-offset-4 hover:underline">Theming</a
		> page.
	</p>

	<h2 class="mt-10 mb-3 font-display text-xl font-bold">5. Add components</h2>
	<p class="mb-3 leading-relaxed text-muted-foreground">
		Pull any component from the registry with the shadcn-svelte CLI…
	</p>
	<CopyCommand command={addCmd} />
	<p class="mt-4 mb-3 leading-relaxed text-muted-foreground">
		…or open a component page and copy its source straight into
		<code class="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]"
			>src/lib/components/ui/</code
		>.
	</p>
</article>
