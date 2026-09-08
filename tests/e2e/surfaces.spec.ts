import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Relative luminance and ratios from WCAG 2.2, including resolved CSS colors.
function contrast(a: string, b: string) {
	const luminance = (color: string) => {
		const rgb = color
			.match(/[\d.]+/g)!
			.slice(0, 3)
			.map(Number)
			.map((v) => {
				const n = v / 255;
				return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
			});
		return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
	};
	const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (values[0] + 0.05) / (values[1] + 0.05);
}

for (const theme of ['light', 'dark'] as const) {
	test(`fields remain readable and distinct across all ${theme} surfaces`, async ({ page }) => {
		await page.emulateMedia({ colorScheme: theme });
		await page.addInitScript((value) => localStorage.setItem('mizu-theme', value), theme);
		await page.goto('/docs/theming');
		for (const name of ['background', 'card', 'muted', 'popover']) {
			const surface = page.locator(`[data-surface="${name}"]`);
			await surface.scrollIntoViewIfNeeded();
			for (const field of await surface.getByRole('textbox').all()) {
				const colors = await field.evaluate((input) => {
					const css = getComputedStyle(input);
					const control = getComputedStyle(input.closest('form') ?? input);
					const surface = getComputedStyle(input.closest('[data-surface]')!);
					return {
						text: css.color,
						placeholder: getComputedStyle(input, '::placeholder').color,
						fill: control.backgroundColor,
						border: control.borderTopColor,
						width: control.borderTopWidth,
						surface: surface.backgroundColor
					};
				});
				expect(contrast(colors.text, colors.fill)).toBeGreaterThanOrEqual(4.5);
				expect(contrast(colors.placeholder, colors.fill)).toBeGreaterThanOrEqual(4.5);
				// A design regression check for tonal separation, not a WCAG boundary threshold.
				// These fields have visible placeholder text and a separate focus indicator.
				expect(contrast(colors.fill, colors.surface)).toBeGreaterThan(1.1);
				expect(parseFloat(colors.width)).toBe(0);
				await field.focus();
				const focus = await field.evaluate(
					(input) => getComputedStyle(input.closest('form') ?? input).boxShadow
				);
				expect(focus).not.toBe('none');
			}
			const toggle = surface.getByRole('switch');
			const colors = await toggle.evaluate((el) => ({
				track: getComputedStyle(el).backgroundColor,
				thumb: getComputedStyle(el.firstElementChild!).backgroundColor
			}));
			expect(contrast(colors.track, colors.thumb)).toBeGreaterThanOrEqual(3);
		}
		const results = await new AxeBuilder({ page })
			.include('[data-surface-preview]')
			.withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
			.analyze();
		expect(results.violations).toEqual([]);
	});
}

test('cloud orb renders a static frame with reduced motion and survives context loss', async ({
	page
}) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/docs/components/voice-orb');
	const orb = page.locator('[data-no-toc] .voice-orb');
	await orb.scrollIntoViewIfNeeded();
	await expect(orb).toHaveAttribute('data-renderer', 'webgl');
	const canvas = orb.locator('canvas');
	const before = await canvas.screenshot();
	await page.waitForTimeout(300);
	expect(await canvas.screenshot()).toEqual(before);
	await canvas.evaluate((el) => {
		(el as HTMLCanvasElement)
			.getContext('webgl')
			?.getExtension('WEBGL_lose_context')
			?.loseContext();
	});
	await expect(orb).toHaveAttribute('data-renderer', 'fallback');
	await expect(orb).toBeVisible();
});

test('cloud orb keeps its fallback when WebGL is unavailable', async ({ page }) => {
	await page.addInitScript(() => {
		const original = HTMLCanvasElement.prototype.getContext;
		HTMLCanvasElement.prototype.getContext = function (
			this: HTMLCanvasElement,
			type: string,
			...args: unknown[]
		) {
			if (type.startsWith('webgl')) return null;
			return original.apply(this, [type, ...args] as Parameters<typeof original>);
		} as typeof original;
	});
	await page.goto('/docs/components/voice-orb');
	const orb = page.locator('[data-no-toc] .voice-orb');
	await orb.scrollIntoViewIfNeeded();
	await expect(orb).toHaveAttribute('data-renderer', 'fallback');
	await expect(orb.locator('.orb-fallback')).toBeVisible();
	await page.getByRole('radio', { name: 'Speaking', exact: true }).click();
	await expect(orb).toHaveAttribute('aria-label', 'speaking');
});

test('landing page fits the tablet breakpoint and remains usable with larger text', async ({
	page
}) => {
	await page.setViewportSize({ width: 768, height: 1024 });
	await page.goto('/');
	await page.getByRole('heading', { name: 'The essentials, too' }).scrollIntoViewIfNeeded();
	expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(768);
	await page.evaluate(() => {
		document.documentElement.style.fontSize = '125%';
	});
	expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(768);
});

test('cloud drawing pauses offscreen and stops after navigation', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await page.addInitScript(() => {
		const original = WebGLRenderingContext.prototype.drawArrays;
		let draws = 0;
		Object.defineProperty(window, 'orbDrawCount', { get: () => draws });
		WebGLRenderingContext.prototype.drawArrays = function (...args) {
			draws += 1;
			return original.apply(this, args);
		};
	});
	await page.goto('/docs/components/voice-orb');
	await page.locator('[data-no-toc] .voice-orb').scrollIntoViewIfNeeded();
	const count = () => page.evaluate(() => Reflect.get(window, 'orbDrawCount') as number);
	await expect.poll(count).toBeGreaterThan(3);
	await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
	await page.waitForTimeout(200);
	const offscreen = await count();
	await page.waitForTimeout(200);
	expect(await count()).toBe(offscreen);
	await page.getByRole('link', { name: 'Mizu home', exact: true }).first().click();
	await expect(page).toHaveURL(/\/$/);
	// New homepage orbs start their own renderer only when visible; the old instance is gone.
	await expect(page.locator('[data-no-toc] .voice-orb')).toHaveCount(0);
});
