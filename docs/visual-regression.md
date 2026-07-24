# Visual regression policy

Playwright stores reviewed Chromium baselines under `tests/e2e/__screenshots__`.

The initial matrix covers Button, Card, and Circular Gauge as representative action, surface, and primary-derived visualization contracts. Each is captured at desktop and mobile sizes in light, dark, and custom-primary themes with reduced motion enabled.

The comparison contract in `playwright.config.ts` allows a maximum three percent differing pixels with a per-pixel threshold of 0.2. This absorbs small rasterization differences while still catching layout, token, radius, shadow, and primary-color regressions.

## Updating a baseline

1. Run the affected browser test without updating snapshots and inspect the diff.
2. Confirm that the change follows the design and accessibility decisions.
3. Run `pnpm exec playwright test tests/e2e/visual.spec.ts --update-snapshots`.
4. Inspect every changed PNG in both projects and all three themes.
5. Include before and after images in the pull request.

Never update snapshots only to make CI pass. New visual exceptions and canonical states should add focused baselines rather than increasing the global threshold.
