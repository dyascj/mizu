/** Languages the built-in highlighter understands. Anything else renders as plain text. */
export type CodeLanguage = 'ts' | 'js' | 'svelte' | 'css' | 'json' | 'bash' | 'python' | 'text';

export type TokenKind = 'keyword' | 'string' | 'comment' | 'number' | 'plain';
export type Token = { kind: TokenKind; text: string };

const words = (list: string) => new Set(list.split(' '));

const KEYWORDS: Partial<Record<CodeLanguage, Set<string>>> = {
	ts: words(
		'import from export default function return const let var type interface if else for while of in as new true false null undefined async await class extends implements try catch finally throw typeof keyof satisfies void yield switch case break continue this'
	),
	python: words(
		'import from as def return if elif else for while in not and or is None True False class with try except finally raise lambda async await yield pass break continue global nonlocal assert del'
	),
	bash: words(
		'if then else elif fi for do done while case esac function export echo cd curl local return in'
	),
	json: words('true false null')
};

// One pass per language. Earlier groups win, so a number inside a string or
// comment stays part of that string or comment. The groups are, in order:
// comment, string, number, and word. No lookbehind, which Safari before 16.4
// cannot parse: where a token must follow line start or a space, the pattern
// takes that indent too, and `highlight` hands it back as plain text.
const PATTERNS: Partial<Record<CodeLanguage, RegExp>> = {
	ts: /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->)|("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)/g,
	css: /(\/\*[\s\S]*?\*\/)|("[^"\n]*"|'[^'\n]*')|(-?\b\d+(?:\.\d+)?(?:px|ms|s|rem|em|%|deg|vh|vw)?)|(@[\w-]+|^[ \t]*[a-z-]+(?=\s*:))/gm,
	json: /()("(?:\\.|[^"\\\n])*")|(-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)|([A-Za-z_]\w*)/g,
	bash: /((?:^|[ \t])#[^\n]*)|("(?:\\.|[^"\\])*"|'[^']*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][\w-]*)/gm,
	python:
		/(#[^\n]*)|("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)/g
};
const GROUPS = ['comment', 'string', 'number', 'word'] as const;

/** The language a file name suggests, from its extension. */
export function languageOf(name: string): CodeLanguage {
	const extension = name.split('.').pop()?.toLowerCase() ?? '';
	if (['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs', 'mts'].includes(extension)) return 'ts';
	if (extension === 'svelte' || extension === 'vue') return 'svelte';
	if (['css', 'scss', 'pcss'].includes(extension)) return 'css';
	if (extension === 'json' || extension === 'jsonc') return 'json';
	if (['sh', 'bash', 'zsh'].includes(extension)) return 'bash';
	if (extension === 'py') return 'python';
	return 'text';
}

/**
 * Splits code into lines of tokens. Deliberately small: it knows comments,
 * strings, numbers, and keywords, which is enough to make a sample scan
 * easily without shipping a grammar. Tokens that span lines, like block
 * comments, are cut at each line break.
 */
export function highlight(code: string, language: CodeLanguage): Token[][] {
	const grammar = language === 'js' || language === 'svelte' ? 'ts' : language;
	const pattern = PATTERNS[grammar];
	const keywords = KEYWORDS[grammar];
	const tokens: Token[] = [];

	if (!pattern) {
		tokens.push({ kind: 'plain', text: code });
	} else {
		let last = 0;
		for (const match of code.matchAll(new RegExp(pattern.source, pattern.flags))) {
			const index = match.index ?? 0;
			if (!match[0]) continue;
			if (index > last) tokens.push({ kind: 'plain', text: code.slice(last, index) });
			const group = GROUPS[match.slice(1).findIndex((part) => part !== undefined && part !== '')];
			let kind: TokenKind;
			if (group === 'word') {
				// A CSS word only matches as an at-rule or a property name.
				kind = grammar === 'css' || keywords?.has(match[0]) ? 'keyword' : 'plain';
			} else if (
				group === 'string' &&
				grammar === 'json' &&
				/^\s*:/.test(code.slice(index + match[0].length))
			) {
				// Keys read as names, not values.
				kind = 'keyword';
			} else {
				kind = group ?? 'plain';
			}
			// Indent taken only to anchor a property name or a comment stays plain.
			const indent = kind === 'plain' ? '' : /^[ \t]*/.exec(match[0])![0];
			if (indent) tokens.push({ kind: 'plain', text: indent });
			tokens.push({ kind, text: match[0].slice(indent.length) });
			last = index + match[0].length;
		}
		if (last < code.length) tokens.push({ kind: 'plain', text: code.slice(last) });
	}

	const lines: Token[][] = [[]];
	for (const token of tokens) {
		token.text.split('\n').forEach((part, index) => {
			if (index > 0) lines.push([]);
			if (!part) return;
			const line = lines[lines.length - 1];
			const previous = line[line.length - 1];
			// Neighbouring plain runs merge, so the markup stays small.
			if (previous?.kind === 'plain' && token.kind === 'plain') previous.text += part;
			else line.push({ kind: token.kind, text: part });
		});
	}
	return lines;
}
