import { components } from './catalog';

export type DocLink = { href: string; title: string };

/** Flat, ordered list of every docs page, for prev/next paging. */
export const docsNav: DocLink[] = [
	{ href: '/docs', title: 'Introduction' },
	{ href: '/docs/installation', title: 'Installation' },
	{ href: '/docs/theming', title: 'Theming' },
	{ href: '/docs/usage', title: 'Usage' },
	{ href: '/docs/build-a-chat', title: 'Build a chat' },
	...components.map((c) => ({ href: `/docs/components/${c.slug}`, title: c.name }))
];

export function pagerFor(pathname: string): { prev: DocLink | null; next: DocLink | null } {
	const i = docsNav.findIndex((d) => d.href === pathname);
	if (i === -1) return { prev: null, next: null };
	return {
		prev: i > 0 ? docsNav[i - 1] : null,
		next: i < docsNav.length - 1 ? docsNav[i + 1] : null
	};
}
