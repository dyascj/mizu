import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { chromium } from '@playwright/test';

// Records the README showcase clips from the live previews. Run with the docs
// dev server up (default http://127.0.0.1:5183, or BASE=...) and img2webp on
// PATH. `node scripts/record-showcase.mjs [slug ...]` re-records a subset.
const BASE = process.env.BASE ?? 'http://127.0.0.1:5183';
const OUT = '.github/assets/showcase';
const SIZE = { width: 640, height: 400 };
const FPS = 25;

/** Presses each named control in turn, pausing `gap` ms after each. */
const press =
	(names, gap = 1400) =>
	async (frame) => {
		for (const name of names) {
			const [button, radio, tab] = ['button', 'radio', 'tab'].map((role) =>
				frame.getByRole(role, { name: new RegExp(`^${name}$`, 'i') })
			);
			await button.or(radio).or(tab).first().click();
			await frame.page().waitForTimeout(gap);
		}
	};

/** `act` drives demos that wait for input; the rest animate on their own. */
const showcase = [
	{ slug: 'voice-orb', seconds: 6, act: press(['Listening', 'Thinking', 'Speaking'], 1800) },
	{ slug: 'presence', seconds: 7, act: press(['Listening', 'Thinking', 'Speaking', 'Happy']) },
	{ slug: 'dynamic-island', seconds: 7, act: press(['Agent', 'Voice', 'Timer', 'Idle'], 1500) },
	{ slug: 'streaming-text', seconds: 6 },
	{ slug: 'code-morph', seconds: 6, act: press(['Stream'], 0) },
	{ slug: 'carousel-3d', seconds: 6, act: press(['Next card', 'Next card', 'Next card'], 1500) },
	{ slug: 'number-ticker', seconds: 5, act: press(['Run a prompt', 'Run a prompt', 'Undo'], 1500) },
	{ slug: 'bar-chart', seconds: 5, act: press(['Last week', 'This week'], 2000) }
];

async function record(browser, { slug, seconds, act }, theme) {
	const context = await browser.newContext({
		// Screencast frames ignore deviceScaleFactor, so render at 2x through
		// page zoom on a double-size viewport instead.
		viewport: { width: SIZE.width * 2, height: SIZE.height * 2 },
		colorScheme: theme
	});
	await context.addInitScript((t) => localStorage.setItem('mizu-theme', t), theme);
	const page = await context.newPage();
	await page.goto(`${BASE}/docs/components/${slug}`, { waitUntil: 'networkidle' });
	// Pin the preview frame over the whole viewport so every frame is the clip.
	const frame = page.locator('[data-no-toc]').first();
	await frame.waitFor();
	await frame.evaluate((el) => {
		el.style.cssText =
			'position:fixed;inset:0;z-index:9999;margin:0;border:0;border-radius:0;background:var(--background)';
		document.body.style.overflow = 'hidden';
		document.documentElement.style.zoom = '2';
	});
	await page.mouse.move(0, 0);
	await page.waitForTimeout(400);

	const dir = await mkdtemp(join(tmpdir(), `showcase-${slug}-`));
	const shots = [];
	const cdp = await context.newCDPSession(page);
	cdp.on('Page.screencastFrame', async ({ data, sessionId, metadata }) => {
		const file = join(dir, `${String(shots.length).padStart(5, '0')}.jpg`);
		shots.push({ file, time: metadata.timestamp });
		await writeFile(file, Buffer.from(data, 'base64'));
		await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
	});
	await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92 });
	const run = act?.(frame);
	await page.waitForTimeout(seconds * 1000);
	await run;
	await cdp.send('Page.stopScreencast');
	const end = (shots[0]?.time ?? 0) + seconds;
	await context.close();

	// Paints arrive unevenly; keep at most one per tick of a steady clock and
	// hold each until the next one.
	const step = 1 / FPS;
	const kept = [];
	for (const shot of shots)
		if (!kept.length || shot.time - kept.at(-1).time >= step) kept.push(shot);
	const args = ['-loop', '0', '-lossy', '-q', '72', '-m', '5'];
	kept.forEach((shot, i) => {
		const next = kept[i + 1]?.time ?? Math.max(end, shot.time + step);
		args.push('-d', String(Math.max(Math.round((next - shot.time) * 1000), 20)), shot.file);
	});
	const out = join(OUT, `${slug}-${theme}.webp`);
	const result = spawnSync('img2webp', [...args, '-o', out]);
	await rm(dir, { recursive: true, force: true });
	if (result.status !== 0) throw new Error(`img2webp failed for ${out}: ${result.stderr}`);
	console.log(`${out} (${shots.length} frames)`);
}

const only = process.argv.slice(2);
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
try {
	for (const item of showcase.filter((s) => !only.length || only.includes(s.slug))) {
		for (const theme of ['light', 'dark']) await record(browser, item, theme);
	}
} finally {
	await browser.close();
}
