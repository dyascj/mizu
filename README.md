<div align="center">

<picture>
	<source media="(prefers-color-scheme: dark)" srcset="./static/brand/mizu-lockup-inverse.svg" />
	<img src="./static/brand/mizu-lockup.svg" width="180" alt="Mizu" />
</picture>

### The design system for AI products.

Conversation, voice, motion, and app components for Svelte 5 and Tailwind v4.<br />
Copy the source. Make it yours.

<p>
	<img alt="Svelte 5" src="https://img.shields.io/badge/Svelte-5-FF3E00?logo=svelte&logoColor=white" />
	<img alt="Tailwind CSS v4" src="https://img.shields.io/badge/Tailwind-v4-38BDF8?logo=tailwindcss&logoColor=white" />
	<img alt="bits-ui" src="https://img.shields.io/badge/bits--ui-headless-171717" />
	<img alt="169 components" src="https://img.shields.io/badge/components-169-626AFB" />
	<img alt="MIT" src="https://img.shields.io/badge/license-MIT-22C55E" />
</p>

<img src="./static/brand/github-social.png" width="720" alt="Mizu. Build a better conversation. 169 components, a motion system, and complete screens for AI products, apps, and websites." />

[Website](https://mizu-ui.com) · [Docs](https://mizu-ui.com/docs) · [Components](https://mizu-ui.com/docs/components) · [Blocks](https://mizu-ui.com/blocks) · [Motion](https://mizu-ui.com/docs/motion) · [Brand](https://mizu-ui.com/brand)

</div>

---

Mizu is a design system for products with intelligence inside. It starts with the conversation (streaming answers, visible reasoning, tool calls, voice) and carries the same language into installable apps and the websites that launch them. Black, white, and neutral grays hold the structure. Color and motion mark the moments when an AI is at work.

## Highlights

- **169 components** for AI, motion, apps, forms, overlays, navigation, and data, from a chat composer and a voice orb to a kanban board, a color picker, and a dynamic island.
- **Presence.** A companion that shows whether the assistant is listening, thinking, speaking, or done, in five tones.
- **A motion system.** Duration, easing, and spring tokens in the theme. Springs are sampled from real physics into CSS `linear()` curves, so they cost nothing at runtime.
- **Apps and PWAs.** Tab bars, install prompts, offline status, and safe-area utilities for web apps people install.
- **Complete screens.** Assistant chat, voice mode, agent workflows, a mobile assistant, a product landing page, and more, each one file you own.
- **Accessible by default.** bits-ui behavior underneath, axe checks on every component in both themes, and reduced motion respected everywhere.
- **Recolor from one token.** Accent states, selection fills, and the focus ring follow `--primary`.
- **Copy in, own it.** A shadcn-svelte-compatible registry with immutable versioned releases.

The current stable release is `0.5.0`. Pin it for reproducible installs:

```bash
npx shadcn-svelte@latest add https://mizu-ui.com/r/v0.5.0/button.json
```

Upgrading copied components from 0.4.x means reinstalling them with the 0.5 Motion item. See the [0.5.0 migration notes](./CHANGELOG.md#050---2026-09-26). From 0.3.x, reinstall the theme first, as described in the [0.4.0 notes](./CHANGELOG.md#040---2026-09-25).

## Quick start

Mizu runs on SvelteKit, Svelte 5, and Tailwind v4.

**1. Create the app:**

```bash
npx sv create my-app
cd my-app
npx sv add tailwindcss
```

**2. Add a `components.json`** so the CLI knows where to place files (or run `npx shadcn-svelte@latest init` to generate it). Point `tailwind.css` at **your** Tailwind entry, the file that holds `@import 'tailwindcss';`. Recent `sv add tailwindcss` creates `src/routes/layout.css`; older setups use `src/app.css`. Use whichever you have:

```json
{
	"$schema": "https://shadcn-svelte.com/schema.json",
	"tailwind": { "css": "src/routes/layout.css", "baseColor": "neutral" },
	"aliases": {
		"lib": "$lib",
		"utils": "$lib/utils",
		"components": "$lib/components",
		"ui": "$lib/components/ui",
		"hooks": "$lib/hooks"
	},
	"typescript": true,
	"registry": "https://shadcn-svelte.com/registry"
}
```

**3. Add the theme:** paste Mizu's `src/app.css` (this repo's) into that same Tailwind entry file, right after `@import 'tailwindcss';`. It holds the color, elevation, and motion tokens every component reads.

**4. Add components** with the one-liner. It pulls the component, installs its npm dependencies, and adds the shared `cn` helper automatically:

```bash
npx shadcn-svelte@latest add https://mizu-ui.com/r/v0.5.0/button.json
```

You can also open any component page in the docs and copy its source straight into `src/lib/components/ui/`.

> Versioned registry URLs are immutable. Use `/r/latest/<item>.json` only when you intentionally want the newest release. See the [compatibility policy](./docs/compatibility.md). If you fork Mizu, point `repo` and `registryBase` in `src/lib/site/config.ts` at your own deployment and re-run `pnpm registry:build`.

## Usage

```svelte
<script lang="ts">
	import { ChatInput } from '$lib/components/ui/chat-input';
	import { Presence } from '$lib/components/ui/presence';
	import { TextReveal } from '$lib/components/ui/text-reveal';

	let answer = $state('');
	let thinking = $state(false);

	async function ask(message: string) {
		thinking = true;
		answer = await yourModel(message);
		thinking = false;
	}
</script>

<div class="flex items-start gap-3">
	<Presence state={thinking ? 'thinking' : answer ? 'speaking' : 'idle'} size={36} />
	{#if answer}<TextReveal text={answer} />{/if}
</div>
<ChatInput onSubmit={ask} placeholder="Ask anything" />
```

## Motion

Motion is quick to respond and soft to settle. Use the tokens instead of literal values:

```svelte
<div class="transition-[scale] duration-(--duration-spring) ease-spring hover:scale-[1.02]">
<li class="animate-rise-in stagger" style="--index: {index}">...</li>
<span class="text-shimmer animate-shimmer">Searching the web</span>
```

The Motion registry item adds `rise`, `blurIn`, and `pop` transitions, `reveal` and `magnetic` attachments, and `SpringValue`, a velocity-preserving spring that is safe in SSR and tests. Read the [motion guide](https://mizu-ui.com/docs/motion).

## Theming

The default primary is black in light mode and white in dark mode. Custom themes set the primary color and its foreground together:

```css
:root {
	--primary: #171717;
	--primary-foreground: #ffffff;
}

.dark {
	--primary: #f5f5f5;
	--primary-foreground: #171717;
}
```

CSS variables also define card, popover, and control fills, elevation, and motion. See the [theming guide](https://mizu-ui.com/docs/theming).

## Components

Mizu currently includes 169 components across AI, motion, app, actions, forms, surfaces, data, overlays, menus, navigation, and feedback. Browse the complete, source-backed [component catalog](https://mizu-ui.com/docs/components).

## Develop

```bash
pnpm install
pnpm dev               # docs site and live previews
pnpm check             # type-check
pnpm test              # contract and unit tests
pnpm test:browser      # Playwright and axe across every page
pnpm registry:build    # regenerate compatibility, latest, and versioned registry output
pnpm registry:validate # verify schemas, dependency parity, inventory, and integrity
```

Components live in `src/lib/components/ui`, the design tokens in `src/app.css`, and the site in `src/routes` and `src/lib/site`. `pnpm new:component` scaffolds a component, demo, and catalog entry. The design rules are in [AGENTS.md](./AGENTS.md) and [CONTRIBUTING.md](./CONTRIBUTING.md), and the decisions behind them in [docs/decisions](./docs/decisions).

## Built with

Svelte 5, SvelteKit, Tailwind CSS v4, bits-ui, tailwind-variants, and Lucide icons. The voice orb's cloud renderer is adapted from [Orb UI](https://orb-ui.com/) under the MIT license.

## Community

- [Contributing](./CONTRIBUTING.md)
- [Security policy](./SECURITY.md)
- [Support](./SUPPORT.md)
- [Code of conduct](./CODE_OF_CONDUCT.md)
- [Roadmap](./ROADMAP.md)
- [Maintainers](./MAINTAINERS.md)

## License

[MIT](./LICENSE). Designed and built by [CJ Dyas](https://www.cjdyas.design).
