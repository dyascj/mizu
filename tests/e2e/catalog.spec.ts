import { readFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const catalog: { slug: string }[] = JSON.parse(
	readFileSync(new URL('../../src/lib/site/components.json', import.meta.url), 'utf8')
);

for (const theme of ['light', 'dark'] as const) {
	for (const { slug } of catalog) {
		test(`${slug} renders accessibly and fits the viewport in ${theme}`, async ({
			page
		}, testInfo) => {
			if (testInfo.project.name === 'mobile-chromium')
				await page.setViewportSize({ width: 320, height: 900 });
			await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
			await page.addInitScript((value) => localStorage.setItem('mizu-theme', value), theme);
			const errors: string[] = [];
			page.on('pageerror', (error) => errors.push(error.message));
			const response = await page.goto(`/docs/components/${slug}`);
			expect(response?.ok()).toBe(true);
			const preview = page.locator('[data-no-toc]').first();
			await expect(preview).toBeVisible();
			await preview.scrollIntoViewIfNeeded();
			expect(
				await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)
			).toBe(true);
			const results = await new AxeBuilder({ page })
				.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
				.analyze();
			expect(
				results.violations.map(({ id, nodes }) => ({
					id,
					targets: nodes.map((node) => node.target)
				}))
			).toEqual([]);
			expect(errors).toEqual([]);
		});
	}
}
