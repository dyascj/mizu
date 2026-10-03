import { act, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import CodeBlock from './code-block.svelte';
import { highlight, languageOf } from './highlight.js';

const files = [
	{ name: 'agent.ts', code: '\nconst model = "atlas-3"; // fast\nreturn 42;\n' },
	{ name: 'request.sh', code: 'curl https://api.example.com \\\n  -d \'{"input": "Hi"}\'' },
	{ name: 'response.json', code: '{ "id": "run_8f2c", "tokens": 212 }' }
];

// jsdom has no Web Animations API; Svelte transitions finish on the next microtask.
const nativeAnimate = Element.prototype.animate;
beforeEach(() => {
	Element.prototype.animate = function () {
		return {
			cancel() {},
			set onfinish(done: () => void) {
				queueMicrotask(done);
			}
		} as unknown as Animation;
	};
});
afterEach(() => {
	Element.prototype.animate = nativeAnimate;
	vi.useRealTimers();
});

describe('CodeBlock', () => {
	test('names the tabs and ties each to its panel', () => {
		render(CodeBlock, { files, label: 'Quickstart files' });
		expect(screen.getByRole('tablist', { name: 'Quickstart files' })).toBeInTheDocument();
		const tabs = screen.getAllByRole('tab');
		expect(tabs.map((tab) => tab.textContent?.trim())).toEqual(files.map((file) => file.name));
		expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
		expect(tabs[0]).toHaveAttribute('tabindex', '0');
		expect(tabs[1]).toHaveAttribute('tabindex', '-1');
		const panel = screen.getByRole('tabpanel', { name: 'agent.ts' });
		expect(tabs[0]).toHaveAttribute('aria-controls', panel.id);
		expect(panel).toHaveTextContent('const model = "atlas-3"; // fast');
	});

	test('arrow keys, Home, and End switch files and report them', async () => {
		const onValueChange = vi.fn();
		render(CodeBlock, { files, onValueChange });
		const tabs = screen.getAllByRole('tab');
		tabs[0].focus();

		await fireEvent.keyDown(tabs[0], { key: 'ArrowRight' });
		expect(tabs[1]).toHaveFocus();
		expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
		expect(onValueChange).toHaveBeenLastCalledWith('request.sh');

		await fireEvent.keyDown(tabs[1], { key: 'End' });
		expect(tabs[2]).toHaveAttribute('aria-selected', 'true');
		await fireEvent.keyDown(tabs[2], { key: 'ArrowRight' });
		expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
		await fireEvent.keyDown(tabs[0], { key: 'ArrowLeft' });
		expect(tabs[2]).toHaveAttribute('aria-selected', 'true');
		await fireEvent.keyDown(tabs[2], { key: 'Home' });
		expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
	});

	test('arrow keys follow the mirrored tabs in right-to-left text', async () => {
		document.body.style.direction = 'rtl';
		try {
			render(CodeBlock, { files });
			const tabs = screen.getAllByRole('tab');
			await fireEvent.keyDown(tabs[0], { key: 'ArrowLeft' });
			expect(tabs[1]).toHaveFocus();
			await fireEvent.keyDown(tabs[1], { key: 'ArrowRight' });
			expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
		} finally {
			document.body.style.direction = '';
		}
	});

	test('does not report the tab that is already showing', async () => {
		const onValueChange = vi.fn();
		render(CodeBlock, { files, onValueChange });
		await fireEvent.click(screen.getByRole('tab', { name: 'agent.ts' }));
		expect(onValueChange).not.toHaveBeenCalled();
	});

	test('keeps only the showing file reachable', async () => {
		render(CodeBlock, { files, value: 'response.json' });
		const panels = screen.getAllByRole('tabpanel', { hidden: true });
		expect(panels[2].inert).toBe(false);
		expect(panels[2]).toHaveAttribute('tabindex', '0');
		expect(panels[0].inert).toBe(true);
	});

	test('copies the showing file, trimmed', async () => {
		vi.useFakeTimers();
		const writeText = vi.fn().mockResolvedValue(undefined);
		Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
		render(CodeBlock, { files });

		await fireEvent.click(screen.getByRole('button', { name: 'Copy agent.ts' }));
		expect(writeText).toHaveBeenCalledWith('const model = "atlas-3"; // fast\nreturn 42;');

		await fireEvent.click(screen.getByRole('tab', { name: 'request.sh' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Copy request.sh' }));
		expect(writeText).toHaveBeenLastCalledWith(files[1].code);
		await act(() => vi.advanceTimersByTimeAsync(2000));
	});

	test('marks tokens for styling and can hide line numbers', () => {
		const { container, rerender } = render(CodeBlock, { files });
		const panel = container.querySelector('[role="tabpanel"]')!;
		expect(panel.querySelector('[data-token="keyword"]')).toHaveTextContent('const');
		expect(panel.querySelector('[data-token="string"]')).toHaveTextContent('"atlas-3"');
		expect(panel.querySelector('[data-token="comment"]')).toHaveTextContent('// fast');
		expect(panel.querySelector('[aria-hidden="true"]')).toHaveTextContent('1');
		void rerender({ files, lineNumbers: false });
	});
});

describe('highlight', () => {
	test('guesses the language from the file name', () => {
		expect(languageOf('agent.tsx')).toBe('ts');
		expect(languageOf('run.py')).toBe('python');
		expect(languageOf('setup.sh')).toBe('bash');
		expect(languageOf('README')).toBe('text');
	});

	test('keeps numbers inside strings and comments as part of them', () => {
		const [line] = highlight('# retry 3 times\nprint("v2")', 'python');
		expect(line).toEqual([{ kind: 'comment', text: '# retry 3 times' }]);
		const second = highlight('# retry 3 times\nprint("v2")', 'python')[1];
		expect(second).toContainEqual({ kind: 'string', text: '"v2"' });
	});

	test('reads JSON keys as names and values as strings', () => {
		const [line] = highlight('{"model": "atlas"}', 'json');
		expect(line).toContainEqual({ kind: 'keyword', text: '"model"' });
		expect(line).toContainEqual({ kind: 'string', text: '"atlas"' });
	});

	test('splits a block comment across lines', () => {
		const lines = highlight('/* one\ntwo */ let', 'ts');
		expect(lines[0]).toEqual([{ kind: 'comment', text: '/* one' }]);
		expect(lines[1][0]).toEqual({ kind: 'comment', text: 'two */' });
	});

	test('css property names and bash comments keep their indent plain', () => {
		expect(highlight('a {\n  color: red;\n}', 'css')[1]).toEqual([
			{ kind: 'plain', text: '  ' },
			{ kind: 'keyword', text: 'color' },
			{ kind: 'plain', text: ': red;' }
		]);
		expect(highlight('echo hi # say hi\n# done', 'bash')).toEqual([
			[
				{ kind: 'keyword', text: 'echo' },
				{ kind: 'plain', text: ' hi ' },
				{ kind: 'comment', text: '# say hi' }
			],
			[{ kind: 'comment', text: '# done' }]
		]);
		// Not a comment: no space before the hash.
		expect(highlight('a#b', 'bash')[0].some((token) => token.kind === 'comment')).toBe(false);
	});

	test('the grammars parse without lookbehind, for older Safari', async () => {
		const source = await import('./highlight.ts?raw');
		expect(source.default).not.toMatch(/\(\?<[=!]/);
	});
});
