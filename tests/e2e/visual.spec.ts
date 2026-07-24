import { expect, test } from '@playwright/test';

const components = ['button', 'card', 'circular-gauge'] as const;
const themes = ['light', 'dark', 'custom-primary'] as const;

for (const slug of components) {
	for (const theme of themes) {
		test(`${slug} canonical preview in ${theme}`, async ({ page }) => {
			const colorScheme = theme === 'dark' ? 'dark' : 'light';
			await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
			await page.addInitScript((selectedTheme) => {
				localStorage.setItem('mizu-theme', selectedTheme);
			}, colorScheme);
			await page.goto(`/docs/components/${slug}`);

			if (theme === 'custom-primary') {
				await page.evaluate(() => {
					document.documentElement.style.setProperty('--primary', '#ff0066');
				});
			}

			await page.evaluate(() => document.fonts.ready);
			const preview = page.locator('[data-no-toc]').first();
			await expect(preview).toBeVisible();
			await expect(preview).toHaveScreenshot(`${slug}-${theme}.png`);
		});
	}
}
