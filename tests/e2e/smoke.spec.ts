import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const routes = [
	'/',
	'/docs',
	'/docs/installation',
	'/docs/usage',
	'/docs/components',
	'/docs/components/button',
	'/docs/build-a-chat',
	'/docs/agents',
	'/blocks'
];

for (const path of routes) {
	test(`${path} loads without accessibility violations`, async ({ page }) => {
		const response = await page.goto(path);

		expect(response?.ok()).toBe(true);
		await expect(page.locator('body')).toBeVisible();

		let axe = new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
			// Color tokens have their own contrast contract. This smoke suite checks
			// names, roles, states, document structure, and keyboard-facing markup.
			.disableRules(['color-contrast']);
		if (path === '/') axe = axe.exclude('.cards-fade');
		if (path === '/docs/components') axe = axe.exclude('[data-no-toc]');

		const results = await axe.analyze();
		const violations = results.violations.map(({ id, impact, nodes }) => ({
			id,
			impact,
			targets: nodes.map((node) => node.target.join(' '))
		}));
		expect(violations).toEqual([]);
	});
}
