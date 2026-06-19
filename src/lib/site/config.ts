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
	url: 'https://mizu-ui.com',
	author: 'Charles J. (CJ) Dyas',
	authorUrl: 'https://www.cjdyas.design',
	repo: 'https://github.com/dyascj/mizu',
	// The registry is served from the deployed site (static/r → /r). Re-run
	// `pnpm registry:build` if you change this.
	registryBase: 'https://mizu-ui.com/r'
};

export type SiteConfig = typeof siteConfig;
