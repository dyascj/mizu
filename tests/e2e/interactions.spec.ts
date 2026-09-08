import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function expectNoAccessibilityViolations(page: Page) {
	// Inspect settled styles after entrance transitions.
	await page.waitForFunction(() =>
		document
			.getAnimations()
			.every(
				(animation) =>
					Number(animation.effect?.getComputedTiming().duration) > 320 ||
					animation.effect?.getComputedTiming().iterations === Infinity ||
					animation.playState === 'finished'
			)
	);
	const results = await new AxeBuilder({ page })
		.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
		.analyze();
	expect(
		results.violations.map(({ id, impact, nodes }) => ({
			id,
			impact,
			targets: nodes.map((node) => node.target.join(' '))
		}))
	).toEqual([]);
}

test('command palette filters and closes from the keyboard', async ({ page }) => {
	await page.goto('/docs');
	await page.waitForLoadState('networkidle');
	const trigger = page.getByRole('button', { name: 'Search' });
	await trigger.click();

	const input = page.getByPlaceholder('Search components and docs');
	await expect(input).toBeFocused();
	await input.fill('Compatibility');
	await expect(page.getByRole('option', { name: 'Compatibility' })).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(input).toBeHidden();
});

test('Rating exposes its complete keyboard range', async ({ page }) => {
	await page.goto('/docs/components/rating');

	const rating = page.getByRole('slider').first();
	await rating.focus();
	await page.keyboard.press('ArrowRight');
	await expect(rating).toHaveAttribute('aria-valuenow', '4');
	await page.keyboard.press('Home');
	await expect(rating).toHaveAttribute('aria-valuenow', '0');
	await page.keyboard.press('End');
	await expect(rating).toHaveAttribute('aria-valuenow', '5');
});

test('Tree supports roving focus, expansion, and keyboard selection', async ({ page }) => {
	await page.goto('/docs/components/tree');

	const source = page.getByRole('treeitem', { name: 'src' });
	const selected = page.getByRole('treeitem', { name: 'button.svelte' });
	await source.focus();
	await expect(source).toBeFocused();
	await page.keyboard.press('ArrowRight');
	const components = page.getByRole('treeitem', { name: 'components' });
	await expect(components).toBeFocused();
	await page.keyboard.press('ArrowRight');
	await expect(components).toHaveAttribute('aria-expanded', 'true');
	await page.keyboard.press('ArrowRight');
	await expect(selected).toBeFocused();
	await page.keyboard.press('Enter');
	await expect(selected).toHaveAttribute('aria-selected', 'true');
});

test('Dialog opens and dismisses from the keyboard without accessibility violations', async ({
	page
}) => {
	await page.goto('/docs/components/dialog');

	const trigger = page.getByRole('button', { name: 'Clear cache', exact: true });
	await trigger.focus();
	await page.keyboard.press('Enter');
	await expect(page.getByRole('dialog', { name: 'Clear your cache?' })).toBeVisible();
	await expectNoAccessibilityViolations(page);
	await page.keyboard.press('Escape');
	await expect(page.getByRole('dialog', { name: 'Clear your cache?' })).toBeHidden();
	await expect(trigger).toBeFocused();
});

test('Drawer opens and dismisses from the keyboard without accessibility violations', async ({
	page
}) => {
	await page.goto('/docs/components/drawer');

	const trigger = page.getByRole('button', { name: 'Ask anything' });
	await trigger.focus();
	await page.keyboard.press('Enter');
	const drawer = page.getByRole('dialog', { name: 'What can I help with?' });
	await expect(drawer).toBeVisible();
	await expectNoAccessibilityViolations(page);
	await page.keyboard.press('Escape');
	await expect(drawer).toBeHidden();
});

test('Toast action is keyboard operable and announces the result', async ({ page }) => {
	await page.goto('/docs/components/toast');

	const trigger = page.getByRole('button', { name: 'With action' });
	await trigger.focus();
	await page.keyboard.press('Enter');
	const undo = page.getByRole('button', { name: 'Undo' });
	await expect(undo).toBeVisible();
	await expectNoAccessibilityViolations(page);
	await undo.focus();
	await page.keyboard.press('Enter');
	await expect(page.getByRole('status').filter({ hasText: 'Restored to inbox' })).toBeVisible();
});

test('Chat Input submits trimmed content and clears from the keyboard', async ({ page }) => {
	await page.goto('/docs/components/chat-input');

	const input = page.getByPlaceholder('Type a message...');
	await input.fill('  Plan the launch  ');
	await input.press('Enter');
	await expect(input).toHaveValue('');
});

test('mobile navigation opens, navigates, and closes from the keyboard', async ({
	page
}, testInfo) => {
	test.skip(testInfo.project.name !== 'mobile-chromium', 'Mobile navigation is viewport-specific.');
	await page.goto('/docs');
	await page.waitForLoadState('networkidle');

	const trigger = page.getByRole('button', { name: 'Open navigation menu' });
	await trigger.focus();
	await page.keyboard.press('Enter');
	const compatibility = page.getByRole('link', { name: 'Compatibility', exact: true });
	await compatibility.focus();
	await page.keyboard.press('Enter');
	await expect(page).toHaveURL(/\/docs\/compatibility$/);
	await expect(compatibility).toBeHidden();
});
