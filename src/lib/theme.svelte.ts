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
	return (localStorage.getItem(STORAGE_KEY) as Theme) ?? 'system';
}

/** Reactive theme state. Mutate via `setTheme` / `toggleTheme`. */
export const theme = $state<{ value: Theme }>({ value: initial() });

/** Whether the currently applied theme resolves to dark. */
export function isDark(): boolean {
	return resolve(theme.value) === 'dark';
}

export function setTheme(next: Theme) {
	theme.value = next;
	if (browser) localStorage.setItem(STORAGE_KEY, next);
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
