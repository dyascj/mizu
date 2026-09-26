import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

type Target = string | ((scope: Locator | Page) => Locator);

const find = (scope: Locator | Page, target: Target) =>
	typeof target === 'string' ? scope.locator(target) : target(scope);

const overlays: (readonly [string, Target, Target, 'click' | 'hover' | 'right'])[] = [
	['dialog', '[data-dialog-trigger]', '[role="dialog"]', 'click'],
	['popover', '[data-popover-trigger]', '[data-popover-content]', 'click'],
	[
		'tooltip',
		(demo) => demo.getByRole('button', { name: 'Copy' }),
		// The shared bubble is a visual copy kept out of the accessibility tree;
		// each trigger describes itself with its own hidden text.
		'[aria-hidden="true"][data-side][data-state="open"]',
		'hover'
	],
	[
		'hover-card',
		(demo) => demo.getByRole('button', { name: '@ava' }),
		(page) => page.getByRole('group', { name: 'Ava Chen, @ava' }),
		'hover'
	],
	['context-menu', '[data-context-menu-trigger]', '[role="menu"]', 'right'],
	['dropdown-menu', '[data-dropdown-menu-trigger]', '[role="menu"]', 'click'],
	['menubar', '[role="menuitem"]', '[role="menu"]', 'click'],
	['navigation-menu', '[data-navigation-menu-trigger]', '[data-navigation-menu-content]', 'hover'],
	['date-picker', '[data-popover-trigger]', '[role="dialog"]', 'click'],
	['select', '[data-select-trigger]', '[role="listbox"]', 'click'],
	['combobox', '[data-combobox-trigger]', '[role="listbox"]', 'click'],
	['sheet', '[data-dialog-trigger]', '[role="dialog"]', 'click'],
	['alert-dialog', '[data-alert-dialog-trigger]', '[role="alertdialog"]', 'click'],
	['drawer', '[data-dialog-trigger]', '[role="dialog"]', 'click']
];

for (const theme of ['light', 'dark'] as const) {
	for (const [slug, triggerSelector, contentSelector, action] of overlays) {
		test(`${slug} opens within the viewport and dismisses in ${theme}`, async ({
			page
		}, testInfo) => {
			if (testInfo.project.name === 'mobile-chromium')
				await page.setViewportSize({ width: 320, height: 800 });
			await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
			await page.addInitScript((t) => localStorage.setItem('mizu-theme', t), theme);
			await page.goto(`/docs/components/${slug}`);
			await page.waitForLoadState('networkidle');
			const trigger = find(page.locator('[data-no-toc]').first(), triggerSelector).first();
			if (action === 'hover') await trigger.hover();
			else await trigger.click({ button: action === 'right' ? 'right' : 'left' });
			const content = find(page, contentSelector).last();
			await expect(content).toBeVisible();
			await expect
				.poll(async () =>
					content.evaluate((el) => {
						const r = el.getBoundingClientRect();
						return (
							r.left >= -1 &&
							r.right <= innerWidth + 1 &&
							r.top >= -1 &&
							r.bottom <= innerHeight + 1
						);
					})
				)
				.toBe(true);
			const results = await new AxeBuilder({ page })
				.withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
				.analyze();
			expect(
				results.violations.map(({ id, nodes }) => ({ id, targets: nodes.map((n) => n.target) }))
			).toEqual([]);
			await page.mouse.move(0, 0);
			await page.keyboard.press('Escape');
			await expect(content).toBeHidden();
		});
	}
}

test('Select and Combobox keep selection, focus, and list relationships in sync', async ({
	page
}) => {
	for (const slug of ['select', 'combobox']) {
		await page.goto(`/docs/components/${slug}`);
		await page.waitForLoadState('networkidle');
		const control = page
			.locator('[data-no-toc]')
			.first()
			.getByRole('combobox', { name: slug === 'select' ? /^Model/ : 'Delegate to' });
		await control.focus();
		await page.keyboard.press('ArrowDown');
		const list = page.getByRole('listbox');
		await expect(list).toBeVisible();
		await expect(control).toHaveAttribute('aria-controls', (await list.getAttribute('id')) ?? '');
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('Enter');
		await expect(list).toBeHidden();
		await expect(control).toBeFocused();
		if (slug === 'select') await expect(control).toContainText('Deep reasoning');
		else await expect(control).toHaveValue('Support triage');
	}
});

test('nested menus stay reachable in a narrow, short viewport', async ({ page }) => {
	await page.setViewportSize({ width: 320, height: 600 });
	await page.emulateMedia({ reducedMotion: 'reduce' });
	for (const slug of ['dropdown-menu', 'context-menu', 'menubar']) {
		await page.goto(`/docs/components/${slug}`);
		await page.waitForLoadState('networkidle');
		const demo = page.locator('[data-no-toc]').first();
		const trigger =
			slug === 'menubar'
				? demo.getByRole('menuitem', { name: 'File' })
				: slug === 'context-menu'
					? demo.locator('[data-context-menu-trigger]')
					: demo.getByRole('button', { name: 'Chat options' });
		await trigger.click({ button: slug === 'context-menu' ? 'right' : 'left' });
		if (slug === 'menubar') await expect(page.getByRole('menu')).toBeFocused();
		const parent = page.getByRole('menuitem', {
			name: slug === 'menubar' ? 'Export as' : 'Move to project'
		});
		await parent.focus();
		await expect(parent).toBeFocused();
		await page.keyboard.press('ArrowRight');
		const submenu = page.getByRole('menu').last();
		await expect(page.getByRole('menu')).toHaveCount(2);
		await expect
			.poll(() =>
				submenu.evaluate((el) => {
					const r = el.getBoundingClientRect();
					return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight;
				})
			)
			.toBe(true);
		await page.keyboard.press('ArrowLeft');
		await expect(parent).toBeFocused();
		await page.keyboard.press('Escape');
		await expect(page.getByRole('menu')).toHaveCount(0);
	}
});

test('long action labels retain padding and fit their container', async ({ page }) => {
	await page.setViewportSize({ width: 320, height: 800 });
	await page.goto('/docs/components/button');
	const button = page.locator('[data-no-toc]').first().getByRole('button').first();
	await button.evaluate(
		(el) => (el.textContent = 'Create the project and invite everyone on your team')
	);
	await expect(button).toBeVisible();
	const fits = await button.evaluate((el) => {
		const r = el.getBoundingClientRect();
		const parent = el.parentElement!.getBoundingClientRect();
		const s = getComputedStyle(el);
		return (
			r.width <= parent.width &&
			el.scrollWidth <= el.clientWidth &&
			r.height > 40 &&
			Number.parseFloat(s.paddingTop) >= 8
		);
	});
	expect(fits).toBe(true);
});
