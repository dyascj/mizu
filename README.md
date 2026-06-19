<div align="center">

# Mizu 水

**A Frutiger Aero design system for Svelte.**

Glossy, glassy, gorgeously rounded components for SvelteKit. The optimism of early-2000s UI, rebuilt for Svelte 5 and Tailwind v4. Copy in what you need.

</div>

---

Mizu brings back the aesthetic of clear skies, water droplets, and wet glass: frosted surfaces, a real top sheen, layered light, bright aqua, and generous rounding, applied with restraint so it feels polished instead of busy. It is built the way [shadcn-svelte](https://www.shadcn-svelte.com) is: you do not install a black box, you copy the source into your project and own it.

## Highlights

- **25 components**, from buttons and dialogs to a blooming orb and rising bubbles.
- **Physically honest.** Gloss, glass, and glow come from real CSS, never baked-in screenshots.
- **Svelte 5 native.** Runes and snippets throughout, with [bits-ui](https://bits-ui.com) handling accessible behavior under the glossy skin.
- **Tailwind v4 tokens.** One theme file drives every surface, in a sunlit light mode and a deep-water dark mode.
- **Copy in, own it.** A shadcn-svelte-compatible registry, plus full source on every component page.

## Quick start

Mizu runs on SvelteKit, Svelte 5, and Tailwind v4.

```bash
# 1. a SvelteKit app with Tailwind v4
npx sv create my-app
cd my-app
npx sv add tailwindcss

# 2. dependencies
pnpm add bits-ui @lucide/svelte clsx tailwind-merge tailwind-variants
```

Add the `cn` helper at `src/lib/utils.ts`:

```ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
```

Paste the Mizu token block into `src/app.css` after `@import 'tailwindcss';` (see the Theming page in the docs, or copy it from this repo's `src/app.css`). Then add components:

```bash
# via the shadcn-svelte CLI from the Mizu registry
npx shadcn-svelte@latest add https://mizu.dev/r/button.json
```

You can also open any component page in the docs and copy its source straight into `src/lib/components/ui/`.

> The `mizu.dev` registry domain is a placeholder until the project is deployed. Update it in `src/lib/site/config.ts` and re-run `pnpm registry:build`.

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

## Components

| Group | Components |
| --- | --- |
| Actions | Button, Badge |
| Forms | Input, Textarea, Label, Checkbox, Radio Group, Switch, Slider, Select |
| Surfaces | Card, Alert, Separator, Avatar |
| Overlays | Dialog, Popover, Tooltip |
| Navigation | Tabs, Accordion |
| Feedback | Progress, Skeleton, Spinner, Circular Gauge |
| Effects | Orb, Bubbles |

## Develop

```bash
pnpm install
pnpm dev              # docs site + live previews
pnpm check            # type-check
pnpm registry:build   # regenerate static/r/*.json from the component source
```

The docs site lives in `src/routes`, the components in `src/lib/components/ui`, and the design tokens in `src/app.css`. The registry generator (`scripts/build-registry.mjs`) scans the components and emits the install JSON, so adding a component is: build it, list it in `src/lib/site/components.json`, write a demo in `src/lib/site/demos`, and re-run the build.

## Built with

Svelte 5, SvelteKit, Tailwind CSS v4, bits-ui, tailwind-variants, and Lucide. Inspired by shadcn-svelte and the Frutiger Aero era.

## License

[MIT](./LICENSE)
