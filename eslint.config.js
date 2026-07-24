import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';

const typedRules = {
	'@typescript-eslint/no-floating-promises': 'error',
	'@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }],
	'@typescript-eslint/no-unused-vars': [
		'error',
		{ argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }
	]
};

export default defineConfig(
	globalIgnores([
		'.svelte-kit/**',
		'.vercel/**',
		'build/**',
		'coverage/**',
		'node_modules/**',
		'playwright-report/**',
		'static/r/**',
		'test-results/**'
	]),
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	...svelte.configs.prettier,
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	},
	{
		files: ['**/*.ts'],
		ignores: ['**/*.svelte.ts'],
		languageOptions: {
			parserOptions: {
				projectService: {
					allowDefaultProject: ['playwright.config.ts', 'vitest.config.ts']
				},
				tsconfigRootDir: import.meta.dirname
			}
		},
		rules: typedRules
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts'],
		languageOptions: {
			parserOptions: {
				extraFileExtensions: ['.svelte'],
				parser: ts.parser
			}
		},
		rules: {
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }
			],
			'no-useless-escape': 'off',
			'svelte/no-at-html-tags': 'off',
			'svelte/no-navigation-without-resolve': 'off',
			'svelte/no-unused-svelte-ignore': 'off'
		}
	},
	{
		files: ['scripts/**'],
		rules: {
			'no-console': 'off'
		}
	}
);
