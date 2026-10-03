import { fireEvent, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import MenubarFixture from './menubar.test.svelte';

beforeEach(() => {
	vi.stubGlobal('matchMedia', (query: string) => ({
		matches: false,
		media: query,
		addEventListener() {},
		removeEventListener() {}
	}));
	vi.stubGlobal(
		'ResizeObserver',
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		}
	);
});

afterEach(() => {
	vi.unstubAllGlobals();
	document.body.style.direction = '';
});

describe('Menubar', () => {
	test('in right-to-left text the menus read that way and ArrowLeft opens a submenu', async () => {
		document.body.style.direction = 'rtl';
		render(MenubarFixture);
		await tick();
		await fireEvent.pointerDown(screen.getByRole('menuitem', { name: 'File' }), {
			button: 0,
			pointerType: 'mouse'
		});
		const menu = await screen.findByRole('menu');
		expect(menu.closest('[data-bits-floating-content-wrapper]')).toHaveAttribute('dir', 'rtl');

		const sub = screen.getByRole('menuitem', { name: 'Export as' });
		sub.focus();
		await fireEvent.keyDown(sub, { key: 'ArrowLeft' });
		expect(await screen.findByRole('menuitem', { name: 'Image' })).toBeInTheDocument();
	});
});
