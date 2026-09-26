/**
 * Key names shared by Kbd, ShortcutSheet, and ShortcutRecorder.
 *
 * A shortcut is written as tokens: modifiers first, then one key, such as
 * `['Mod', 'Shift', 'P']`. `Mod` is Command on Apple platforms and Control
 * everywhere else, so one written shortcut works on both.
 */

/** True on macOS, iOS, and iPadOS. Always false during server rendering. */
export function isApplePlatform(): boolean {
	if (typeof navigator === 'undefined') return false;
	const platform =
		(navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ||
		navigator.platform ||
		navigator.userAgent;
	return /mac|iphone|ipad|ipod/i.test(platform);
}

const MODIFIERS = ['mod', 'ctrl', 'control', 'alt', 'option', 'shift', 'meta', 'cmd', 'command'];

/** True when the token names a modifier rather than a key. */
export function isModifier(token: string): boolean {
	return MODIFIERS.includes(token.toLowerCase());
}

/** True when a token's printed label depends on the platform. */
export function isPlatformKey(token: string): boolean {
	const name = token.toLowerCase();
	return name === 'mod' || name === 'alt' || name === 'option' || name === 'shift';
}

const GLYPHS: Record<string, string> = {
	arrowup: '↑',
	arrowdown: '↓',
	arrowleft: '←',
	arrowright: '→',
	enter: '↵',
	escape: 'Esc',
	esc: 'Esc',
	backspace: '⌫',
	delete: 'Del',
	tab: 'Tab',
	space: 'Space',
	' ': 'Space'
};

/** The printed label for a token: `⌘` or `Ctrl` for `Mod`, `⇧` or `Shift`, and so on. */
export function keyLabel(token: string, mac: boolean): string {
	const name = token.toLowerCase();
	if (name === 'mod') return mac ? '⌘' : 'Ctrl';
	if (name === 'meta' || name === 'cmd' || name === 'command') return mac ? '⌘' : 'Meta';
	if (name === 'ctrl' || name === 'control') return mac ? '⌃' : 'Ctrl';
	if (name === 'alt' || name === 'option') return mac ? '⌥' : 'Alt';
	if (name === 'shift') return mac ? '⇧' : 'Shift';
	if (GLYPHS[name]) return GLYPHS[name];
	return token.length === 1 ? token.toUpperCase() : token;
}

const SPOKEN: Record<string, string> = {
	'[': 'left bracket',
	']': 'right bracket',
	'=': 'equals',
	'-': 'minus',
	'?': 'question mark',
	'/': 'slash',
	',': 'comma',
	'.': 'period',
	'↑': 'up arrow',
	'↓': 'down arrow',
	'←': 'left arrow',
	'→': 'right arrow',
	'↵': 'Enter'
};

/** How a screen reader should say a token, such as "Command" or "left bracket". */
export function keySpoken(token: string, mac: boolean): string {
	const name = token.toLowerCase();
	if (name === 'mod') return mac ? 'Command' : 'Control';
	if (name === 'meta' || name === 'cmd' || name === 'command') return mac ? 'Command' : 'Meta';
	if (name === 'ctrl' || name === 'control') return 'Control';
	if (name === 'alt' || name === 'option') return mac ? 'Option' : 'Alt';
	if (name === 'shift') return 'Shift';
	return SPOKEN[token] ?? (token.length === 1 ? token.toUpperCase() : token);
}

/** A whole shortcut, spoken: "Command Shift P". */
export function shortcutSpoken(tokens: string[], mac: boolean): string {
	return tokens.map((token) => keySpoken(token, mac)).join(' ');
}

/**
 * True when a key event is the physical key a token names. Letters and digits
 * match by `code` as well as `key`, so Shift, Option, or a non-Latin layout
 * still finds the cap.
 */
export function keyMatches(token: string, event: KeyboardEvent, mac: boolean): boolean {
	const name = token.toLowerCase();
	// Browser autofill dispatches keydown events with no `key` or `code`.
	const key = event.key ?? '';
	const code = event.code ?? '';
	if (name === 'mod') return key === (mac ? 'Meta' : 'Control');
	if (name === 'meta' || name === 'cmd' || name === 'command') return key === 'Meta';
	if (name === 'ctrl' || name === 'control') return key === 'Control';
	if (name === 'alt' || name === 'option') return key === 'Alt';
	if (name === 'shift') return key === 'Shift';
	if (name === 'space') return key === ' ';
	if (name === 'esc') return key === 'Escape';
	if (/^[a-z]$/.test(name) && code === `Key${name.toUpperCase()}`) return true;
	if (/^[0-9]$/.test(name) && code === `Digit${name}`) return true;
	return key.toLowerCase() === name;
}

/**
 * True when a key event performs a whole shortcut: the last token is the key
 * and exactly the listed modifiers are held.
 */
export function shortcutMatches(tokens: string[], event: KeyboardEvent, mac: boolean): boolean {
	if (!tokens.length) return false;
	const names = tokens.map((token) => token.toLowerCase());
	const has = (...aliases: string[]) => aliases.some((alias) => names.includes(alias));
	const key = tokens[tokens.length - 1];

	const wantMod = has('mod');
	const wantMeta = has('meta', 'cmd', 'command') || (mac && wantMod);
	const wantCtrl = has('ctrl', 'control') || (!mac && wantMod);
	if (event.metaKey !== wantMeta || event.ctrlKey !== wantCtrl) return false;
	if (event.altKey !== has('alt', 'option')) return false;
	// Shifted symbols such as "?" already need Shift, so it is not listed for them.
	if (key.length === 1 && !/[a-z0-9]/i.test(key)) return event.key === key;
	if (event.shiftKey !== has('shift')) return false;
	return keyMatches(key, event, mac);
}
