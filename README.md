<div align="center">

<img src="./static/mizu-mark.svg" width="88" height="88" alt="Mizu logo" />

# Mizu 水

**A Frutiger Aero design system for Svelte.**

Glossy, glassy, gorgeously rounded components for SvelteKit. The optimism of early-2000s UI, rebuilt for Svelte 5 and Tailwind v4. Copy in what you need.

<p>
	<img alt="Svelte 5" src="https://img.shields.io/badge/Svelte-5-FF3E00?logo=svelte&logoColor=white" />
	<img alt="Tailwind CSS v4" src="https://img.shields.io/badge/Tailwind-v4-38BDF8?logo=tailwindcss&logoColor=white" />
	<img alt="bits-ui" src="https://img.shields.io/badge/bits--ui-headless-0EA5E9" />
	<img alt="50 components" src="https://img.shields.io/badge/components-50-01B2FF" />
	<img alt="MIT" src="https://img.shields.io/badge/license-MIT-22C55E" />
</p>

</div>

---

Mizu brings back the aesthetic of clear skies, water droplets, and wet glass: frosted surfaces, a real top sheen, layered light, and generous rounding, applied with restraint so it feels polished instead of busy. It ships the way [shadcn-svelte](https://www.shadcn-svelte.com) does. You do not install a black box, you copy the source into your project and own it.

## Highlights

- **50 components**, from buttons and dialogs to a command palette, a blooming orb, and rising bubbles.
- **Recolor the whole system from one token.** The gloss gradients, glow, focus ring, and logo all derive from `--primary`. Drop in an accent and everything updates live (try the swatches in the header).
- **Physically honest.** Gloss, glass, and glow come from real CSS, never baked-in screenshots.
- **Svelte 5 native.** Runes and snippets throughout, with [bits-ui](https://bits-ui.com) handling accessible behavior under the glossy skin.
- **Light and deep water.** A clean neutral light theme and a neutral deep-dark theme, both with the aqua accent on top.
- **Copy in, own it.** A shadcn-svelte-compatible registry, plus full source on every component page.

## Quick start

Mizu runs on SvelteKit, Svelte 5, and Tailwind v4.

```bash
# 1. a SvelteKit app with Tailwind v4
npx sv create my-app
cd my-app
npx sv add tailwindcss

# 2. dependencies
pnpm add bits-ui phosphor-svelte clsx tailwind-merge tailwind-variants
```

Add the `cn` helper at `src/lib/utils.ts`:

```ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
```

Paste the Mizu token block into `src/app.css` after `@import 'tailwindcss';` (copy it from this repo's `src/app.css`, or see the Theming page in the docs). Then add components:

```bash
npx shadcn-svelte@latest add https://mizu-ui.com/r/button.json
```

This pulls the component, installs its npm dependencies, and adds the shared `cn` helper, in one command. You can also open any component page in the docs and copy its source straight into `src/lib/components/ui/`.

> The registry is served from [mizu-ui.com](https://mizu-ui.com). If you fork Mizu, point `repo` and `registryBase` in `src/lib/site/config.ts` at your own deployment and re-run `pnpm registry:build`.

## Usage

```svelte
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
</script>

<Card.Root class="max-w-sm">
	<Card.Header>
		<Card.Title>Clear skies</Card.Title>
		<Card.Description>A frosted-glass surface with a wet top sheen.</Card.Description>
	</Card.Header>
	<Card.Footer>
		<Button class="w-full">Continue</Button>
	</Card.Footer>
</Card.Root>
```

## Theming

The brand is one token. Change `--primary` and the gloss gradients, glow, and focus ring follow, derived with `color-mix`:

```css
:root {
	--primary: #01b2ff; /* aqua, the default */
}
```

The site ships eight accent presets (Aqua, Sky, Violet, Pink, Rose, Sunset, Leaf, Teal) wired to a swatch switcher, and a light + dark mode driven entirely by CSS variables. Recolor without touching a single component.

## Components

| Group      | Components                                                                                                                                          |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Actions    | Button, Badge, Button Group                                                                                                                         |
| Forms      | Input, Textarea, Label, Checkbox, Radio Group, Switch, Slider, Select, Native Select, Combobox, Toggle, Toggle Group, Input OTP, Input Group, Field |
| Surfaces   | Card, Alert, Separator, Avatar, Aspect Ratio, Scroll Area, Table, Empty, Item, Kbd                                                                  |
| Overlays   | Dialog, Alert Dialog, Sheet, Popover, Tooltip, Hover Card                                                                                           |
| Menus      | Dropdown Menu, Context Menu, Menubar, Navigation Menu, Command                                                                                      |
| Navigation | Tabs, Accordion, Collapsible, Breadcrumb, Pagination                                                                                                |
| Feedback   | Progress, Skeleton, Spinner, Circular Gauge                                                                                                         |
| Effects    | Orb, Bubbles                                                                                                                                        |

## Develop

```bash
pnpm install
pnpm dev              # docs site + live previews
pnpm check            # type-check
pnpm registry:build   # regenerate static/r/*.json from the component source
```

The docs site lives in `src/routes`, components in `src/lib/components/ui`, the design tokens in `src/app.css`, and the site chrome (landing showcase, theming, command palette) in `src/lib/site`. To add a component: build it, list it in `src/lib/site/components.json`, write a demo in `src/lib/site/demos`, and re-run the registry build.

## Built with

Svelte 5, SvelteKit, Tailwind CSS v4, bits-ui, tailwind-variants, and Phosphor icons. Inspired by shadcn-svelte and HeroUI, and the Frutiger Aero era.

## License

[MIT](./LICENSE)
