import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './tests/e2e',
	fullyParallel: true,
	workers: process.env.CI ? 2 : 4,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 2 : 0,
	reporter: process.env.CI ? 'github' : 'list',
	snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{testFileBaseName}/{arg}{ext}',
	expect: {
		toHaveScreenshot: {
			animations: 'disabled',
			caret: 'hide',
			maxDiffPixelRatio: 0.03,
			threshold: 0.2
		}
	},
	use: {
		baseURL: 'http://127.0.0.1:5183',
		trace: 'on-first-retry'
	},
	webServer: {
		command: 'pnpm dev --host 127.0.0.1 --port 5183',
		url: 'http://127.0.0.1:5183',
		reuseExistingServer: !process.env.CI
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		},
		{
			name: 'mobile-chromium',
			use: { ...devices['Pixel 7'] }
		}
	]
});
