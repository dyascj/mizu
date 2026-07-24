import { siteConfig } from '$lib/site/config';
import { sitemapRoutes } from '$lib/site/routes';

// Static file, generated from the same catalog the nav uses, so it never
// drifts from the real set of component pages.
export const prerender = true;

export function GET() {
	const base = siteConfig.url.replace(/\/$/, '');
	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapRoutes.map((route) => `\t<url>\n\t\t<loc>${base}${route.path}</loc>\n\t</url>`).join('\n')}
</urlset>
`;
	return new Response(body, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'max-age=0, s-maxage=3600'
		}
	});
}
