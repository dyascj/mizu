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

test('command palette opens from the shortcut and keeps same-named results apart', async ({
	page
}) => {
	await page.goto('/docs');
	await page.waitForLoadState('networkidle');
	await page.keyboard.press('ControlOrMeta+k');

	const input = page.getByPlaceholder('Search components and docs');
	await expect(input).toBeFocused();
	await input.fill('Motion');
	await expect(page.getByRole('option', { name: 'Motion', exact: true })).toHaveCount(2);
	await expect(page.getByRole('option', { selected: true })).toHaveCount(1);
	await page.keyboard.press('ArrowDown');
	await expect(page.getByRole('option', { selected: true })).toHaveCount(1);
	await page.keyboard.press('Enter');
	await expect(page).toHaveURL(/\/docs\/(components\/)?motion$/);
	await expect(input).toBeHidden();
});

test('block category filters keep keyboard focus', async ({ page }) => {
	await page.goto('/blocks');
	await page.waitForLoadState('networkidle');
	const agents = page
		.getByRole('navigation', { name: 'Block categories' })
		.getByRole('link', { name: 'Agents' });
	await agents.focus();
	await page.keyboard.press('Enter');
	await expect(page).toHaveURL(/\?category=agents$/);
	await expect(agents).toHaveAttribute('aria-current', 'page');
	await expect(agents).toBeFocused();
});

test('copy feedback is announced and the table of contents keeps its place', async ({
	page
}, testInfo) => {
	test.skip(testInfo.project.name === 'mobile-chromium', 'The table of contents is desktop-only.');
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/docs/theming');
	await page.waitForLoadState('networkidle');
	const tokens = page
		.getByRole('navigation', { name: 'On this page' })
		.getByRole('link', { name: 'Theme tokens' });
	await tokens.click();
	await expect(tokens).toHaveAttribute('aria-current', 'location');
	// Leave the heading just above the spy band, with its code sample in view.
	await page.mouse.wheel(0, 180);
	await page.waitForTimeout(200);
	await expect(tokens).toHaveAttribute('aria-current', 'location');

	const sample = page.locator('#theme-tokens + p + div');
	await sample.getByRole('button', { name: 'Copy code' }).click();
	await expect(sample.locator('[aria-live="polite"]')).toHaveText(/Code copied|Copy failed/);
	await page.waitForTimeout(200);
	await expect(tokens).toHaveAttribute('aria-current', 'location');
});

test('the error page offers a skip link target', async ({ page }) => {
	const response = await page.goto('/docs/components/not-a-component');
	expect(response?.status()).toBe(404);
	await expect(page.locator('main#main-content')).toHaveCount(1);
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

	const agents = page.getByRole('treeitem', { name: 'agents', exact: true });
	await agents.focus();
	await expect(agents).toBeFocused();
	await page.keyboard.press('ArrowRight');
	const research = page.getByRole('treeitem', { name: 'research', exact: true });
	await expect(research).toBeFocused();
	await page.keyboard.press('ArrowLeft');
	await expect(research).toHaveAttribute('aria-expanded', 'false');
	await page.keyboard.press('ArrowDown');
	const support = page.getByRole('treeitem', { name: 'support', exact: true });
	await expect(support).toBeFocused();
	await page.keyboard.press('ArrowRight');
	await expect(support).toHaveAttribute('aria-expanded', 'true');
	await page.keyboard.press('ArrowRight');
	const supportGroup = page.locator(`[id="${await support.getAttribute('aria-owns')}"]`);
	const selected = supportGroup.getByRole('treeitem', { name: 'system-prompt.md', exact: true });
	await expect(selected).toBeFocused();
	await page.keyboard.press('Enter');
	await expect(selected).toHaveAttribute('aria-selected', 'true');
});

test('Dialog opens and dismisses from the keyboard without accessibility violations', async ({
	page
}) => {
	await page.goto('/docs/components/dialog');

	const trigger = page.getByRole('button', { name: 'Settings', exact: true });
	await trigger.focus();
	await page.keyboard.press('Enter');
	const dialog = page.getByRole('dialog', { name: 'Assistant settings' });
	await expect(dialog).toBeVisible();
	await expectNoAccessibilityViolations(page);
	await page.keyboard.press('Escape');
	await expect(dialog).toBeHidden();
	await expect(trigger).toBeFocused();
});

test('Drawer opens and dismisses from the keyboard without accessibility violations', async ({
	page
}) => {
	await page.goto('/docs/components/drawer');

	const trigger = page.getByRole('button', { name: 'Share chat' });
	await trigger.focus();
	await page.keyboard.press('Enter');
	const drawer = page.getByRole('dialog', { name: 'Share “Kyoto trip itinerary”' });
	await expect(drawer).toBeVisible();
	await expectNoAccessibilityViolations(page);
	await page.keyboard.press('Escape');
	await expect(drawer).toBeHidden();
});

test('Toast action is keyboard operable and announces the result', async ({ page }) => {
	await page.goto('/docs/components/toast');

	const prompts = page.getByRole('list', { name: 'Saved prompts' });
	const prompt = prompts.getByRole('listitem').filter({ hasText: 'Support triage' });
	const trigger = page.getByRole('button', { name: 'Delete Support triage' });
	await trigger.focus();
	await page.keyboard.press('Enter');
	await expect(prompt).toBeHidden();
	const toast = page.getByRole('status').filter({ hasText: 'Deleted ‘Support triage’' });
	const undo = toast.getByRole('button', { name: 'Undo' });
	await expect(undo).toBeVisible();
	await expectNoAccessibilityViolations(page);
	await undo.focus();
	await page.keyboard.press('Enter');
	await expect(prompt).toBeVisible();
	const announcer = page
		.getByRole('region', { name: 'Notifications' })
		.locator(':scope > [aria-live="polite"]');
	await expect(announcer).toHaveText('Restored');
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
