import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

import { siteConfig } from './config';
import {
	gettingStartedRoutes,
	primaryNavigationRoutes,
	publicRoutes,
	sitemapRoutes
} from './routes';
import { GET as getSitemap } from '../../routes/sitemap.xml/+server';

const routesDir = join(dirname(fileURLToPath(import.meta.url)), '../../routes');

function routeSourceExists(path: string): boolean {
	if (path.startsWith('/docs/components/')) {
		return existsSync(join(routesDir, 'docs/components/[slug]/+page.svelte'));
	}
	const relative = path === '/' ? '' : path.slice(1);
	const directory = join(routesDir, relative);
	return existsSync(join(directory, '+page.svelte')) || existsSync(join(directory, '+server.ts'));
}

describe('public route manifest', () => {
	test('contains unique paths backed by route source', () => {
		expect(new Set(publicRoutes.map((route) => route.path)).size).toBe(publicRoutes.length);
		expect(publicRoutes.filter((route) => !routeSourceExists(route.path))).toEqual([]);
	});

	test('drives complete navigation projections', () => {
		expect(gettingStartedRoutes.map((route) => route.path)).toContain('/docs/usage');
		expect(primaryNavigationRoutes.map((route) => route.path)).toContain('/blocks');
	});

	test('matches every URL emitted by the sitemap', async () => {
		const response = getSitemap();
		const body = await response.text();
		const base = siteConfig.url.replace(/\/$/, '');
		const actual = [...body.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) =>
			match[1].replace(base, '')
		);

		expect(actual).toEqual(sitemapRoutes.map((route) => route.path));
	});
});
