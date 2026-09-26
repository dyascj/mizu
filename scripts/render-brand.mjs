import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

/**
 * Rasterize the brand mark into the favicon fallback and app icons listed in
 * static/manifest.webmanifest. The SVGs in static/brand are the source of truth.
 *
 * Run: node scripts/render-brand.mjs
 */

const water = await readFile('static/brand/mizu-mark-water.svg', 'utf8');
const mono = await readFile('static/brand/mizu-mark.svg', 'utf8');

/** Each icon draws the mark at `scale` of the canvas over `background`. */
const icons = [
	{ file: 'static/favicon-32.png', size: 32, scale: 1, background: 'transparent', mark: mono },
	{ file: 'static/apple-touch-icon.png', size: 180, scale: 0.62, background: '#fff', mark: water },
	{ file: 'static/brand/icon-192.png', size: 192, scale: 0.62, background: '#fff', mark: water },
	{ file: 'static/brand/icon-512.png', size: 512, scale: 0.62, background: '#fff', mark: water },
	// Maskable icons keep the mark inside the central 80% safe zone.
	{
		file: 'static/brand/icon-maskable-512.png',
		size: 512,
		scale: 0.5,
		background: '#fff',
		mark: water
	}
];

const browser = await chromium.launch();
try {
	const page = await browser.newPage();
	for (const { file, size, scale, background, mark } of icons) {
		await page.setViewportSize({ width: size, height: size });
		const markSize = Math.round(size * scale);
		await page.setContent(
			`<!doctype html><style>html,body{margin:0;background:${background}}body{display:grid;place-items:center;width:${size}px;height:${size}px}svg{width:${markSize}px;height:${markSize}px}</style>${mark}`
		);
		await writeFile(file, await page.screenshot({ omitBackground: background === 'transparent' }));
	}
} finally {
	await browser.close();
}
