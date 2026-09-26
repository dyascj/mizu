import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

// Run with the docs dev server on port 5183. Captures the real Presence
// component and composes the Open Graph and GitHub social images from it.
const count = JSON.parse(await readFile('src/lib/site/components.json', 'utf8')).length;
const lockup = await readFile('static/brand/mizu-lockup.svg', 'utf8');
const browser = await chromium.launch();
try {
	const page = await browser.newPage({
		viewport: { width: 1200, height: 800 },
		deviceScaleFactor: 3,
		reducedMotion: 'reduce'
	});
	await page.goto('http://127.0.0.1:5183/docs/components/presence');
	const presence = page.locator('[data-no-toc] .mizu-presence').first();
	await presence.waitFor();
	await presence.scrollIntoViewIfNeeded();
	await page.mouse.move(0, 0);
	// Drop every flat fill so only the companion's own gradients remain.
	await page.addStyleTag({ content: '*{background-color:transparent!important}' });
	const companion = (await presence.screenshot({ omitBackground: true })).toString('base64');

	const imagePage = await browser.newPage({
		viewport: { width: 1200, height: 630 },
		deviceScaleFactor: 2
	});
	await imagePage.setContent(`<!doctype html><html lang="en"><meta charset="utf-8"><title>Mizu</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..600&family=Instrument+Serif:ital@1&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box}body{margin:0;width:1200px;height:630px;background:#fff;color:#171717;font-family:Inter,sans-serif;padding:64px 72px;position:relative;overflow:hidden}
.lockup svg{height:40px;width:auto}h1{margin:88px 0 24px;font-size:82px;line-height:0.98;letter-spacing:-4.2px;font-weight:600}
em{font-family:'Instrument Serif',serif;font-weight:400;letter-spacing:-1px;font-size:1.08em}
p{margin:0;font-size:24px;line-height:1.45;color:#626262;max-width:560px}
.glow{position:absolute;right:40px;top:120px;width:420px;height:420px;border-radius:50%;background:radial-gradient(circle,rgba(154,166,252,.35),rgba(154,166,252,0) 70%)}
.companion{position:absolute;right:110px;top:170px;width:290px;height:290px}
.url{position:absolute;left:72px;bottom:56px;font-size:20px;color:#626262}</style>
<div class="lockup">${lockup}</div>
<h1>Build a better<br><em>conversation.</em></h1>
<p>${count} components, a motion system, and complete screens for AI products, apps, and websites.</p>
<div class="glow"></div><img class="companion" alt="" src="data:image/png;base64,${companion}">
<div class="url">mizu-ui.com</div></html>`);
	await imagePage.waitForLoadState('networkidle');
	await imagePage.evaluate(() => document.fonts.ready);
	const social = await imagePage.screenshot();
	await writeFile('static/og.png', social);
	await writeFile('static/brand/github-social.png', social);
} finally {
	await browser.close();
}
