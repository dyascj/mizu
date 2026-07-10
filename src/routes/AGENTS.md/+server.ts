import { components } from '$lib/site/catalog';
import { blocks } from '$lib/site/blocks';
import { siteConfig } from '$lib/site/config';

// The drop-in AGENTS.md for projects that use Mizu: a README for AI coding
// agents (https://agents.md). Users curl this file into their repo so Cursor,
// Claude Code, Codex, and friends install and compose Mizu correctly.
// Generated from the catalog so it can never drift from the real library.
export const prerender = true;

export function GET() {
	const base = siteConfig.url.replace(/\/$/, '');
	const reg = siteConfig.registryBase.replace(/\/$/, '');
	const ai = components.filter((c) => c.category === 'AI').map((c) => c.name);

	const tagline = siteConfig.tagline.charAt(0).toLowerCase() + siteConfig.tagline.slice(1);
	const out = `# Mizu

Guidance for AI coding agents working in a project that uses Mizu, ${tagline} (${base}). Mizu targets SvelteKit, Svelte 5 (runes), Tailwind v4, and bits-ui. Components are copied into the project as source; there is no runtime dependency on Mizu.

## Installing components

- Install any of the ${components.length} components by slug, dependencies included:
  \`npx shadcn-svelte@latest add ${reg}/<slug>.json\`
- The full catalog with descriptions and registry URLs: ${base}/llms.txt
- Whole screens (blocks) install the same way: ${blocks.map((b) => b.slug).join(', ')}
- Component sources live in \`src/lib/components/ui/<slug>/\` once installed. Edit them freely; they belong to the project.

## Composing AI interfaces

- The AI set: ${ai.join(', ')}.
- A complete assistant screen stacks in this order: ChatBubble (user) -> Reasoning -> ToolCall -> ChatBubble (assistant) wrapping StreamingText -> Sources -> MessageActions -> PromptSuggestions -> ChatInput. Follow ${base}/docs/build-a-chat.
- Prefer installing the assistant-chat block over rebuilding that anatomy by hand.

## Design rules (do not violate)

- Depth never comes from border strokes. Light mode uses soft shadows and gray fills; dark mode uses tonal surface rungs. Only \`outline\` variants, dashed empty states, and table row dividers may carry a stroke.
- One accent: \`--primary\`. Active states are \`bg-primary-muted text-primary\`. Everything else stays quiet gray.
- The \`orb-*\` and \`aurora-*\` pastel washes mark AI moments (voice, generation, presence), never chrome.
- No font weight heavier than semibold. Single-line controls are pills; multi-line fields use \`rounded-2xl\`.
- Motion is 200-320ms ease-out, shimmer sweeps are 2s, and everything must respect \`prefers-reduced-motion\`.
- Theme through the tokens in \`src/app.css\`, never hex values in markup. The whole system recolors from \`--primary\`.

## Conventions

- Svelte 5 runes only: \`$props()\`, \`$state\`, \`$derived\`, snippets. No \`export let\`, no \`on:\` directives.
- Compound components use namespace imports: \`import * as Dialog from '$lib/components/ui/dialog'\`.
- Merge classes through each component's \`class\` prop (tailwind-merge resolves conflicts); do not fork a component to restyle it.
- Icons are lucide, imported per icon: \`import Check from '@lucide/svelte/icons/check'\`.

## More

- Docs and live demos: ${base}/docs
- Blocks with full source: ${base}/blocks
- Machine-readable index: ${base}/llms.txt
`;

	return new Response(out, {
		headers: {
			'Content-Type': 'text/markdown; charset=utf-8',
			'Cache-Control': 'max-age=0, s-maxage=3600'
		}
	});
}
