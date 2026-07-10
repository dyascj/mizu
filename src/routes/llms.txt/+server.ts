import { componentsByCategory } from '$lib/site/catalog';
import { blocks } from '$lib/site/blocks';
import { siteConfig } from '$lib/site/config';

// https://llmstxt.org: a single Markdown file so coding assistants (Cursor,
// Claude, etc.) can ingest what Mizu is and link straight to each component's
// docs + registry item. Generated from the catalog so it stays in sync.
export const prerender = true;

export function GET() {
	const base = siteConfig.url.replace(/\/$/, '');
	const reg = siteConfig.registryBase.replace(/\/$/, '');
	const out: string[] = [];

	out.push(`# ${siteConfig.name} · ${siteConfig.tagline}`);
	out.push('');
	out.push(`> ${siteConfig.description}`);
	out.push('');
	out.push(
		'Mizu is a design system for AI products: chat, voice, reasoning, and streaming components plus the classic primitives around them. You copy the source into your own project and own it, with no runtime dependency on Mizu. It targets SvelteKit, Svelte 5 (runes), and Tailwind v4, with accessible behavior from bits-ui. Recolor the whole system by changing one token (`--primary`).'
	);
	out.push('');
	out.push('## Install a component');
	out.push('');
	out.push('```bash');
	out.push(`npx shadcn-svelte@latest add ${reg}/button.json`);
	out.push('```');
	out.push('');
	out.push(
		'Each component page below has a live demo, an auto-generated props table, and the full source.'
	);
	out.push('');
	out.push('## Docs');
	out.push('');
	out.push(
		`- [Installation](${base}/docs/installation): set up SvelteKit + Tailwind + components.json`
	);
	out.push(`- [Theming](${base}/docs/theming): the one-token brand system and light/dark modes`);
	out.push(
		`- [Build a chat](${base}/docs/build-a-chat): compose the AI components into a full assistant screen`
	);
	out.push(
		`- [UI for Agents](${base}/docs/agents): set up AI coding agents to build with Mizu; drop-in agent guidance lives at ${base}/AGENTS.md`
	);
	out.push(`- [Components](${base}/docs/components): browse all components`);
	out.push(`- [Blocks](${base}/blocks): whole AI screens with full copyable source`);
	out.push('');

	out.push('## Blocks');
	out.push('');
	for (const b of blocks) {
		out.push(`- [${b.name}](${base}/blocks#${b.slug}): ${b.description}`);
	}
	out.push('');

	for (const group of componentsByCategory()) {
		out.push(`## ${group.category}`);
		out.push('');
		for (const c of group.items) {
			out.push(
				`- [${c.name}](${base}/docs/components/${c.slug}): ${c.description} (registry: ${reg}/${c.slug}.json)`
			);
		}
		out.push('');
	}

	return new Response(out.join('\n'), {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'max-age=0, s-maxage=3600'
		}
	});
}
