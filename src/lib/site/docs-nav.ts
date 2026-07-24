import { pagerRoutes } from './routes';

export type DocLink = { href: string; title: string };

/** Flat, ordered list of every docs page, for prev/next paging. */
export const docsNav: DocLink[] = [
	...pagerRoutes.map((route) => ({ href: route.path, title: route.title }))
];

export function pagerFor(pathname: string): { prev: DocLink | null; next: DocLink | null } {
	const i = docsNav.findIndex((d) => d.href === pathname);
	if (i === -1) return { prev: null, next: null };
	return {
		prev: i > 0 ? docsNav[i - 1] : null,
		next: i < docsNav.length - 1 ? docsNav[i + 1] : null
	};
}
