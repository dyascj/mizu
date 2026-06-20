import { components } from '$lib/site/catalog';
import { siteConfig } from '$lib/site/config';

// Static file — generated from the same catalog the nav uses, so it never
// drifts from the real set of component pages.
export const prerender = true;

const staticPaths = ['', '/docs', '/docs/installation', '/docs/theming', '/docs/components'];

export function GET() {
	const base = siteConfig.url.replace(/\/$/, '');
	const paths = [...staticPaths, ...components.map((c) => `/docs/components/${c.slug}`)];
	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => `\t<url>\n\t\t<loc>${base}${p}</loc>\n\t</url>`).join('\n')}
</urlset>
`;
	return new Response(body, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'max-age=0, s-maxage=3600'
		}
	});
}
