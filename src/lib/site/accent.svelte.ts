import { browser } from '$app/environment';

export type Accent = { name: string; color: string };

/** Preset accent colors. "Aqua" is the Mizu default (light/dark aware in CSS). */
export const accents: Accent[] = [
	{ name: 'Aqua', color: '#01b2ff' },
	{ name: 'Sky', color: '#3b82f6' },
	{ name: 'Violet', color: '#8b5cf6' },
	{ name: 'Pink', color: '#ec4899' },
	{ name: 'Rose', color: '#f43f5e' },
	{ name: 'Sunset', color: '#f97316' },
	{ name: 'Leaf', color: '#22c55e' },
	{ name: 'Teal', color: '#14b8a6' }
];

const STORAGE_KEY = 'mizu-accent';
const DEFAULT = 'Aqua';

function apply(name: string) {
	if (!browser) return;
	const root = document.documentElement.style;
	const accentDef = accents.find((a) => a.name === name);
	// The default keeps the CSS-defined (light/dark aware) primary; others override.
	if (!accentDef || accentDef.name === DEFAULT) {
		root.removeProperty('--primary');
		root.removeProperty('--primary-foreground');
		return;
	}
	root.setProperty('--primary', accentDef.color);
	root.setProperty('--primary-foreground', '#ffffff');
}

export const accent = $state<{ name: string }>({
	name: browser ? (localStorage.getItem(STORAGE_KEY) ?? DEFAULT) : DEFAULT
});

export function setAccent(name: string) {
	accent.name = name;
	if (browser) localStorage.setItem(STORAGE_KEY, name);
	apply(name);
}
