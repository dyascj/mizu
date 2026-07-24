import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

import { parseProps } from './props.js';

const srcDir = join(dirname(fileURLToPath(import.meta.url)), '../..');
const componentsDir = join(srcDir, 'lib/components/ui');

function listSvelteFiles(dir: string): string[] {
	return readdirSync(dir).flatMap((entry) => {
		const path = join(dir, entry);
		return statSync(path).isDirectory()
			? listSvelteFiles(path)
			: path.endsWith('.svelte')
				? [path]
				: [];
	});
}

describe('parseProps', () => {
	test('parses intersections, renamed class, snippets, and bindable defaults', () => {
		const parsed = parseProps(`
			<script lang="ts">
				import type { HTMLAttributes, Snippet } from 'svelte/elements';
				type Props = HTMLAttributes<HTMLDivElement> & {
					value?: string;
					class?: string;
					child: Snippet<[{ active: boolean }]>;
				};
				let {
					value = $bindable('ready'),
					class: className,
					child,
					...rest
				}: Props = $props();
			</script>
		`);

		expect(parsed.extendsTypes).toEqual(['HTMLAttributes<HTMLDivElement>']);
		expect(parsed.props).toEqual([
			{
				name: 'value',
				type: 'string',
				default: "'ready'",
				bindable: true,
				optional: true
			},
			{
				name: 'class',
				type: 'string',
				default: null,
				bindable: false,
				optional: true
			},
			{
				name: 'child',
				type: 'Snippet<[{ active: boolean }]>',
				default: null,
				bindable: false,
				optional: false
			}
		]);
	});

	test('resolves variant aliases and bits-ui aliases', () => {
		const parsed = parseProps(`
			<script lang="ts">
				import { Dialog as DialogPrimitive } from 'bits-ui';
				import { tv, type VariantProps } from 'tailwind-variants';
				const styles = tv({
					variants: {
						size: { sm: '', lg: '' }
					}
				});
				type Size = VariantProps<typeof styles>['size'];
				type Props = DialogPrimitive.ContentProps & {
					size?: Size;
				};
				let { size = 'sm', ...rest }: Props = $props();
			</script>
		`);

		expect(parsed.extendsTypes).toEqual(['Dialog.ContentProps']);
		expect(parsed.props[0]).toMatchObject({
			name: 'size',
			type: "'sm' | 'lg'",
			default: "'sm'"
		});
	});

	test('returns an empty API for source without props', () => {
		expect(parseProps('<p>Static</p>')).toEqual({ props: [], extendsTypes: [] });
	});

	test('extracts a public API from every component that declares props', () => {
		const failures = listSvelteFiles(componentsDir)
			.filter((file) => readFileSync(file, 'utf8').includes('$props('))
			.filter((file) => {
				const parsed = parseProps(readFileSync(file, 'utf8'));
				return parsed.props.length === 0 && parsed.extendsTypes.length === 0;
			})
			.map((file) => file.slice(componentsDir.length + 1));

		expect(failures).toEqual([]);
	});

	test('matches the generated API snapshot for every component', async () => {
		const lines: string[] = [];
		for (const slug of readdirSync(componentsDir).sort()) {
			const dir = join(componentsDir, slug);
			if (!statSync(dir).isDirectory()) continue;
			lines.push(`# ${slug}`);
			for (const file of listSvelteFiles(dir).sort()) {
				const parsed = parseProps(readFileSync(file, 'utf8'));
				if (!parsed.props.length && !parsed.extendsTypes.length) continue;
				const inherited = parsed.extendsTypes.length
					? ` extends ${parsed.extendsTypes.join(' & ')}`
					: '';
				const props = parsed.props
					.map((prop) => {
						const optional = prop.optional ? '?' : '';
						const bindable = prop.bindable ? ' bindable' : '';
						const fallback = prop.default === null ? '' : ` = ${prop.default}`;
						return `${prop.name}${optional}: ${prop.type || 'unknown'}${fallback}${bindable}`;
					})
					.join(', ');
				lines.push(`${file.slice(dir.length + 1)}${inherited} | ${props}`);
			}
		}

		await expect(`${lines.join('\n')}\n`).toMatchFileSnapshot('./__snapshots__/component-api.txt');
	});
});
