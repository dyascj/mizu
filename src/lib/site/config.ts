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
	// TODO(cj): point these at the real GitHub repo + deployed registry domain.
	repo: 'https://github.com/cjdyas/mizu',
	registryBase: 'https://mizu.dev/r'
};

export type SiteConfig = typeof siteConfig;
