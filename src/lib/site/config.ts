/**
 * Site-wide configuration. Update `repo` and `registryBase` once the project
 * is published. No secrets here — this file ships publicly.
 */
export const siteConfig = {
	name: 'Mizu',
	wordmark: '水',
	tagline: 'A Frutiger Aero design system for Svelte',
	description:
		'Glossy, glassy, gorgeously rounded components for SvelteKit. The optimism of early-2000s UI, rebuilt for Svelte 5 and Tailwind v4. Copy in what you need.',
	// Point `repo` at the real GitHub repo. `registryBase` serves the registry
	// JSON; the jsDelivr URL below works the moment the repo is public on GitHub
	// (no separate deploy needed). Re-run `pnpm registry:build` after changing it.
	repo: 'https://github.com/dyascj/mizu',
	registryBase: 'https://cdn.jsdelivr.net/gh/dyascj/mizu@main/static/r'
};

export type SiteConfig = typeof siteConfig;
