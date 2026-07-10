<script lang="ts">
	import CodeBlock from '$lib/site/code-block.svelte';
	import CopyCommand from '$lib/site/copy-command.svelte';
	import Seo from '$lib/site/seo.svelte';
	import { siteConfig } from '$lib/site/config';

	const base = siteConfig.url.replace(/\/$/, '');
	const curlCmd = `curl -fsSL ${base}/AGENTS.md -o AGENTS.md`;

	const claudeSnippet = `# CLAUDE.md
See AGENTS.md for the Mizu design system rules and install commands.`;

	const promptSnippet = `Read ${base}/llms.txt for the component catalog,
then install what you need with:
npx shadcn-svelte@latest add ${siteConfig.registryBase}/<slug>.json`;
</script>

<Seo
	title="UI for Agents · {siteConfig.name}"
	description="Mizu is built to be used by AI coding agents: a drop-in AGENTS.md, a machine-readable llms.txt, and a registry agents can install from with one command."
/>

<article class="max-w-2xl">
	<h1 class="text-3xl font-semibold">UI for Agents</h1>
	<p class="mt-3 text-lg text-muted-foreground">
		Half the code written against Mizu will be written by an agent. The system ships three resources
		so Cursor, Claude Code, Codex, and friends use it correctly without you explaining anything.
	</p>

	<h2 class="mt-10 mb-3 text-xl font-semibold">1. Drop AGENTS.md into your project</h2>
	<p class="mb-3 leading-relaxed text-muted-foreground">
		<a
			href="https://agents.md"
			target="_blank"
			rel="noreferrer"
			class="font-medium text-primary hover:underline">AGENTS.md</a
		>
		is a README for agents: most coding agents read it from your project root automatically. Mizu maintains
		a canonical one at
		<a
			href="{base}/AGENTS.md"
			class="font-mono text-[0.9em] font-medium text-primary hover:underline">{base}/AGENTS.md</a
		>
		covering install commands, the composition patterns, and the design rules an agent must not violate.
		One command adds it:
	</p>
	<CopyCommand command={curlCmd} class="w-full" />
	<p class="mt-3 mb-3 leading-relaxed text-muted-foreground">
		It is generated from the same catalog as the docs, so it always matches the library. Re-run the
		command after a Mizu update to refresh it.
	</p>

	<h2 class="mt-10 mb-3 text-xl font-semibold">2. Point tools that use their own file</h2>
	<p class="mb-3 leading-relaxed text-muted-foreground">
		Claude Code reads <code class="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]"
			>CLAUDE.md</code
		>
		first, and Cursor reads
		<code class="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">.cursor/rules</code>. A
		one-line pointer is enough; both follow it:
	</p>
	<CodeBlock code={claudeSnippet} />

	<h2 class="mt-10 mb-3 text-xl font-semibold">3. The library is machine-readable</h2>
	<p class="mb-3 leading-relaxed text-muted-foreground">
		<a
			href="{base}/llms.txt"
			class="font-mono text-[0.9em] font-medium text-primary hover:underline">{base}/llms.txt</a
		>
		lists every component and block with its description, docs link, and registry URL. The registry itself
		serves clean JSON per item, so an agent can discover a component and install it with its whole dependency
		tree in one command. If you are prompting an agent cold, this is all it needs:
	</p>
	<CodeBlock code={promptSnippet} />

	<h2 class="mt-10 mb-3 text-xl font-semibold">What the agent gets right as a result</h2>
	<ul class="mb-4 ml-5 list-disc space-y-2 text-muted-foreground">
		<li>
			Installs through the registry instead of pasting stale component code from its training data.
		</li>
		<li>
			Composes assistant screens in the right order, following the
			<a href="/docs/build-a-chat" class="font-medium text-primary hover:underline">Build a chat</a> anatomy,
			or installs the finished block.
		</li>
		<li>
			Respects the design rules: no strokes, one accent, auras only for AI moments, nothing heavier
			than semibold, motion behind
			<code class="font-mono text-[0.85em]">prefers-reduced-motion</code>.
		</li>
		<li>Themes through tokens instead of scattering hex values through your markup.</li>
	</ul>
</article>
