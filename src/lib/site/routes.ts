import { components } from './catalog';

export type PublicRoute = {
	path: string;
	title: string;
	description: string;
	section: 'site' | 'getting-started' | 'catalog' | 'blocks' | 'component';
	navigation: boolean;
	searchable: boolean;
	sitemap: boolean;
	pager: boolean;
};

const staticRoutes: PublicRoute[] = [
	{
		path: '/',
		title: 'Home',
		description: 'Mizu design system for AI products.',
		section: 'site',
		navigation: false,
		searchable: false,
		sitemap: true,
		pager: false
	},
	{
		path: '/docs',
		title: 'Introduction',
		description: 'Start with the Mizu design language and component system.',
		section: 'getting-started',
		navigation: true,
		searchable: true,
		sitemap: true,
		pager: true
	},
	{
		path: '/docs/installation',
		title: 'Installation',
		description: 'Set up SvelteKit, Tailwind, and the Mizu registry.',
		section: 'getting-started',
		navigation: true,
		searchable: true,
		sitemap: true,
		pager: true
	},
	{
		path: '/docs/theming',
		title: 'Theming',
		description: 'Configure the token system and light and dark modes.',
		section: 'getting-started',
		navigation: true,
		searchable: true,
		sitemap: true,
		pager: true
	},
	{
		path: '/docs/usage',
		title: 'Usage',
		description: 'Apply Mizu composition and interface conventions.',
		section: 'getting-started',
		navigation: true,
		searchable: true,
		sitemap: true,
		pager: true
	},
	{
		path: '/docs/compatibility',
		title: 'Compatibility',
		description: 'Understand Mizu versions, pinned installs, deprecations, and migrations.',
		section: 'getting-started',
		navigation: true,
		searchable: true,
		sitemap: true,
		pager: true
	},
	{
		path: '/docs/build-a-chat',
		title: 'Build a chat',
		description: 'Compose the AI components into a complete assistant screen.',
		section: 'getting-started',
		navigation: true,
		searchable: true,
		sitemap: true,
		pager: true
	},
	{
		path: '/docs/agents',
		title: 'UI for Agents',
		description: 'Configure coding agents to install and compose Mizu.',
		section: 'getting-started',
		navigation: true,
		searchable: true,
		sitemap: true,
		pager: true
	},
	{
		path: '/docs/components',
		title: 'Components',
		description: 'Browse the complete Mizu component catalog.',
		section: 'catalog',
		navigation: true,
		searchable: true,
		sitemap: true,
		pager: false
	},
	{
		path: '/blocks',
		title: 'Blocks',
		description: 'Install complete Mizu screens and flows.',
		section: 'blocks',
		navigation: true,
		searchable: true,
		sitemap: true,
		pager: false
	}
];

export const componentRoutes: PublicRoute[] = components.map((component) => ({
	path: `/docs/components/${component.slug}`,
	title: component.name,
	description: component.description,
	section: 'component',
	navigation: false,
	searchable: true,
	sitemap: true,
	pager: true
}));

export const publicRoutes: PublicRoute[] = [...staticRoutes, ...componentRoutes];
export const gettingStartedRoutes = publicRoutes.filter(
	(route) => route.section === 'getting-started'
);
export const primaryNavigationRoutes = publicRoutes.filter((route) => route.navigation);
export const searchableRoutes = publicRoutes.filter((route) => route.searchable);
export const sitemapRoutes = publicRoutes.filter((route) => route.sitemap);
export const pagerRoutes = publicRoutes.filter((route) => route.pager);

export function getPublicRoute(path: string): PublicRoute | undefined {
	return publicRoutes.find((route) => route.path === path);
}
