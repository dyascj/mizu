import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

// Run with the docs dev server on port 5183. Capture the real orb renderer.
const count = JSON.parse(await readFile('src/lib/site/components.json', 'utf8')).length;
const browser = await chromium.launch();
try {
	const page = await browser.newPage({
		viewport: { width: 1200, height: 800 },
		deviceScaleFactor: 3,
		reducedMotion: 'reduce'
	});
	await page.goto('http://127.0.0.1:5183/docs/components/voice-orb');
	const canvas = page.locator('[data-renderer="webgl"] canvas').first();
	await canvas.waitFor();
	await canvas.scrollIntoViewIfNeeded();
	const orb = (await canvas.screenshot()).toString('base64');
	const imagePage = await browser.newPage({
		viewport: { width: 1200, height: 630 },
		deviceScaleFactor: 1
	});
	await imagePage.setContent(`<!doctype html><html lang="en"><meta charset="utf-8"><title>Mizu</title>
 <style>*{box-sizing:border-box}body{margin:0;background:#fff;color:#202020;font-family:'Inter Variable',Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:64px 72px}.brand{font-size:30px;font-weight:600;letter-spacing:-1px}h1{margin:94px 0 26px;font-size:80px;line-height:1.02;letter-spacing:-4px;font-weight:600}p{margin:0;font-size:24px;line-height:1.5;color:#626262}.orb{position:absolute;right:60px;top:200px;width:240px;height:240px}footer{position:absolute;bottom:60px;font-size:20px;color:#626262}.url{position:absolute;right:72px;bottom:60px;font-size:20px;color:#202020}</style>
 <div class="brand">Mizu</div><h1>Build a better<br>conversation.</h1><p>Svelte components for AI products.</p><img class="orb" alt="" src="data:image/png;base64,${orb}"><footer>${count} components. Light and dark.</footer><div class="url">mizu-ui.com</div></html>`);
	await imagePage.locator('img').evaluate((image) => image.decode());
	const social = await imagePage.screenshot();
	await writeFile('static/og.png', social);
	await writeFile('static/brand/github-social.png', social);
} finally {
	await browser.close();
}
