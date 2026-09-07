import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
const blocks: { slug: string; category: string }[] = JSON.parse(
	readFileSync(new URL('../../src/lib/site/blocks.json', import.meta.url), 'utf8')
);

for (const theme of ['light', 'dark'] as const) {
	for (const category of [...new Set(blocks.map((b) => b.category))]) {
		test(`${category} blocks reflow and pass accessibility checks in ${theme}`, async ({
			page
		}, testInfo) => {
			if (testInfo.project.name === 'mobile-chromium')
				await page.setViewportSize({ width: 320, height: 900 });
			await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
			await page.addInitScript((value) => localStorage.setItem('mizu-theme', value), theme);
			await page.goto(`/blocks?category=${category.toLowerCase().replaceAll(' ', '-')}`);
			for (const block of blocks.filter((b) => b.category === category)) {
				const section = page.locator(`#${block.slug}`);
				const preview = section.getByRole('tabpanel', { name: 'Preview', exact: true });
				await preview.scrollIntoViewIfNeeded();
				await expect(preview).toBeVisible();
				expect(
					await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)
				).toBe(true);
				const results = await new AxeBuilder({ page })
					.include(`#${block.slug}`)
					.withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
					.analyze();
				expect(
					results.violations.map(({ id, nodes }) => ({ id, targets: nodes.map((n) => n.target) }))
				).toEqual([]);
			}
		});
	}
}
