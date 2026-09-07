import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const routes = [
	'/',
	'/docs',
	'/docs/installation',
	'/docs/usage',
	'/docs/theming',
	'/docs/compatibility',
	'/docs/components',
	'/docs/components/button',
	'/docs/build-a-chat',
	'/docs/agents',
	'/blocks'
];

for (const theme of ['light', 'dark'] as const) {
	for (const path of routes) {
		test(`${path} loads without accessibility violations in ${theme} mode`, async ({ page }) => {
			await page.emulateMedia({ colorScheme: theme });
			await page.addInitScript((selectedTheme) => {
				localStorage.setItem('mizu-theme', selectedTheme);
			}, theme);
			const response = await page.goto(path);

			expect(response?.ok()).toBe(true);
			await expect(page.locator('body')).toBeVisible();

			const axe = new AxeBuilder({ page }).withTags([
				'wcag2a',
				'wcag2aa',
				'wcag21a',
				'wcag21aa',
				'wcag22aa'
			]);

			const results = await axe.analyze();
			const violations = results.violations.map(({ id, impact, nodes }) => ({
				id,
				impact,
				targets: nodes.map((node) => node.target.join(' '))
			}));
			expect(violations).toEqual([]);
		});
	}
}

test('Streaming Text reveals without timed motion when reduced motion is requested', async ({
	page
}) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/docs/components/streaming-text');

	const stream = page.locator('.whitespace-pre-wrap').first();
	await expect(stream).toContainText('I already found three places nearby');
	await expect(stream.locator('.stream-caret')).toHaveCount(0);
});

test('Circular Gauge derives its progress color from a custom primary token', async ({ page }) => {
	await page.goto('/docs/components/circular-gauge');
	await page.evaluate(() => {
		document.documentElement.style.setProperty('--primary', '#ff0066');
	});

	const stopColor = await page
		.locator('stop[offset="100%"]')
		.first()
		.evaluate((stop) => {
			return getComputedStyle(stop).stopColor;
		});
	expect(stopColor).toBe('rgb(255, 0, 102)');
});
