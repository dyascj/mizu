<script lang="ts">
	import CopyCommand from '$lib/site/copy-command.svelte';
	import { registryLatestBase, registryPinnedBase, siteConfig } from '$lib/site/config';
	import Seo from '$lib/site/seo.svelte';

	const pinned = `npx shadcn-svelte@latest add ${registryPinnedBase}/button.json`;
	const latest = `npx shadcn-svelte@latest add ${registryLatestBase}/button.json`;
</script>

<Seo
	title="Compatibility · {siteConfig.name}"
	description="Mizu's compatibility contract for component APIs, design tokens, immutable registry releases, deprecations, and migrations."
/>

<article class="max-w-2xl">
	<h1 class="font-display text-3xl font-semibold">Compatibility</h1>
	<p class="text-muted-foreground mt-3 text-lg">
		Mizu components become part of your application source. Versions still matter because updates
		can change props, exports, behavior, markup assumptions, and design tokens.
	</p>

	<h2 class="font-display mt-10 mb-3 text-xl font-semibold">Pinned by default</h2>
	<p class="text-muted-foreground mb-3 leading-relaxed">
		Documentation commands use the immutable <code class="font-mono"
			>v{siteConfig.registryVersion}</code
		>
		registry. The same URL will always return the same source, dependency ranges, and integrity manifest.
	</p>
	<CopyCommand command={pinned} />

	<h2 class="font-display mt-10 mb-3 text-xl font-semibold">Following latest</h2>
	<p class="text-muted-foreground mb-3 leading-relaxed">
		Use the <code class="font-mono">latest</code> channel when you intentionally want the newest release.
		Review the changelog before rerunning it because copied source may change.
	</p>
	<CopyCommand command={latest} />

	<h2 class="font-display mt-10 mb-3 text-xl font-semibold">Versioning contract</h2>
	<ul class="text-muted-foreground ml-5 list-disc space-y-2">
		<li>Patch releases fix defects without intentionally breaking the public contract.</li>
		<li>Before 1.0, minor releases may contain documented breaking changes and migration notes.</li>
		<li>After 1.0, breaking changes require a major release.</li>
		<li>
			Public contracts include prop and callback names, compound exports, documented behavior,
			accessibility semantics, CSS token names, and documented markup assumptions.
		</li>
		<li>
			Deprecated APIs remain available for at least one minor release when security or correctness
			does not require immediate removal.
		</li>
	</ul>

	<h2 class="font-display mt-10 mb-3 text-xl font-semibold">Release records</h2>
	<p class="text-muted-foreground leading-relaxed">
		Each pinned directory includes a <code class="font-mono">manifest.json</code> with its version,
		source commit, file sizes, and SHA-256 integrity values. Old pinned directories are never
		rewritten or removed during a normal release. Breaking changes and any exceptional yanks are
		recorded in the
		<a
			href="{siteConfig.repo}/blob/main/CHANGELOG.md"
			class="text-primary font-medium hover:underline">changelog</a
		>.
	</p>
</article>
