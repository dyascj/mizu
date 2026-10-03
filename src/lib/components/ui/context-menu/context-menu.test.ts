import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import Harness from './context-menu.test.svelte';
import { openPoint } from './origin.js';

beforeEach(() => {
	vi.stubGlobal(
		'ResizeObserver',
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		}
	);
	Element.prototype.scrollIntoView ??= () => {};
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('ContextMenu', () => {
	test('opens at the pointer and remembers where it was asked for', async () => {
		const onPick = vi.fn();
		render(Harness, { onPick });
		const area = screen.getByRole('group', { name: 'Assistant reply' });

		await fireEvent.contextMenu(area, { clientX: 120, clientY: 80 });
		expect(await screen.findByRole('menu')).toHaveAttribute('data-state', 'open');
		expect(openPoint).toEqual({ x: 120, y: 80 });

		await fireEvent.click(screen.getByRole('menuitem', { name: 'Copy text' }));
		expect(onPick).toHaveBeenCalledWith('Copy');
	});

	test.each([
		{ key: 'F10', shiftKey: true },
		{ key: 'ContextMenu', shiftKey: false }
	])('opens from the middle of the area with $key', async (keys) => {
		render(Harness, { onPick: vi.fn() });
		const area = screen.getByRole('group', { name: 'Assistant reply' });
		vi.spyOn(area, 'getBoundingClientRect').mockReturnValue(new DOMRect(100, 50, 200, 100));

		area.focus();
		await fireEvent.keyDown(area, keys);
		expect(await screen.findByRole('menu')).toBeInTheDocument();
		expect(openPoint).toEqual({ x: 200, y: 100 });
	});

	test('leaves other keys alone', async () => {
		render(Harness, { onPick: vi.fn() });
		const area = screen.getByRole('group', { name: 'Assistant reply' });
		await fireEvent.keyDown(area, { key: 'F10' });
		expect(screen.queryByRole('menu')).not.toBeInTheDocument();
	});

	test('caps its height and grows from the variables the context menu actually sets', async () => {
		render(Harness, { onPick: vi.fn() });
		await fireEvent.contextMenu(screen.getByRole('group', { name: 'Assistant reply' }), {
			clientX: 10,
			clientY: 10
		});
		const menu = await screen.findByRole('menu');
		const used = [...menu.className.matchAll(/(?:max-h|origin)-\((--[\w-]+)\)/g)].map(
			([, name]) => name
		);
		expect(used).toEqual([
			'--bits-context-menu-content-available-height',
			'--bits-context-menu-content-transform-origin'
		]);
		for (const name of used) expect(menu.style.getPropertyValue(name)).not.toBe('');
	});

	test('mirrors in right-to-left text', async () => {
		document.body.style.direction = 'rtl';
		try {
			render(Harness, { onPick: vi.fn() });
			await fireEvent.contextMenu(screen.getByRole('group', { name: 'Assistant reply' }), {
				clientX: 10,
				clientY: 10
			});
			expect((await screen.findByRole('menu')).closest('[dir]')).toHaveAttribute('dir', 'rtl');
		} finally {
			document.body.style.direction = '';
		}
	});

	test('marks destructive items', async () => {
		render(Harness, { onPick: vi.fn() });
		await fireEvent.contextMenu(screen.getByRole('group', { name: 'Assistant reply' }), {
			clientX: 10,
			clientY: 10
		});
		expect(await screen.findByRole('menuitem', { name: 'Delete' })).toHaveAttribute(
			'data-variant',
			'destructive'
		);
	});
});
