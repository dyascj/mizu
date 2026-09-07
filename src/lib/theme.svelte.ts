import { browser } from '$app/environment';

export type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'mizu-theme';

function systemPrefersDark(): boolean {
	return browser && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolve(theme: Theme): 'light' | 'dark' {
	if (theme === 'system') return systemPrefersDark() ? 'dark' : 'light';
	return theme;
}

function apply(theme: Theme) {
	if (!browser) return;
	document.documentElement.classList.toggle('dark', resolve(theme) === 'dark');
}

function initial(): Theme {
	if (!browser) return 'system';
	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		return saved === 'light' || saved === 'dark' ? saved : 'system';
	} catch {
		return 'system';
	}
}

/** Reactive theme state. Mutate via `setTheme` / `toggleTheme`. */
export const theme = $state<{ value: Theme }>({ value: initial() });

/** Whether the currently applied theme resolves to dark. */
export function isDark(): boolean {
	return resolve(theme.value) === 'dark';
}

export function setTheme(next: Theme) {
	theme.value = next;
	try {
		if (browser) localStorage.setItem(STORAGE_KEY, next);
	} catch {
		// The theme still works when browser storage is unavailable.
	}
	apply(next);
}

/** Flip between explicit light and dark (collapses `system` to its opposite). */
export function toggleTheme() {
	setTheme(isDark() ? 'light' : 'dark');
}

if (browser) {
	// Keep `system` in sync with OS changes.
	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
		if (theme.value === 'system') apply('system');
	});
}
