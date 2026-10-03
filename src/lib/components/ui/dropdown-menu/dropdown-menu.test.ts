import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import Harness from './dropdown-menu.test.svelte';

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
});

const pointer = { button: 0, pointerType: 'mouse', pointerId: 1 };

describe('DropdownMenu', () => {
	test('opens from the keyboard onto the first item', async () => {
		render(Harness, { onPick: vi.fn() });
		const trigger = screen.getByRole('button', { name: 'Chat options' });
		expect(trigger).toHaveAttribute('aria-haspopup', 'menu');

		trigger.focus();
		await fireEvent.keyDown(trigger, { key: 'Enter' });
		const menu = await screen.findByRole('menu');
		expect(trigger).toHaveAttribute('aria-expanded', 'true');
		expect(menu).toHaveAttribute('data-state', 'open');
		expect(screen.getAllByRole('menuitem')).toHaveLength(3);
	});

	test('press, drag, and release picks an item like a native menu', async () => {
		const onPick = vi.fn();
		render(Harness, { onPick });
		const trigger = screen.getByRole('button', { name: 'Chat options' });

		await fireEvent.pointerDown(trigger, pointer);
		await screen.findByRole('menu');
		const share = screen.getByRole('menuitem', { name: 'Share' });
		await fireEvent.pointerMove(share, pointer);
		await fireEvent.pointerUp(share, pointer);

		expect(onPick).toHaveBeenCalledWith('Share');
		await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
	});

	test('marks destructive items and still selects them with a click', async () => {
		const onPick = vi.fn();
		render(Harness, { onPick });
		await fireEvent.pointerDown(screen.getByRole('button', { name: 'Chat options' }), pointer);
		const destroy = await screen.findByRole('menuitem', { name: 'Delete chat' });
		expect(destroy).toHaveAttribute('data-variant', 'destructive');
		expect(screen.getByRole('menuitem', { name: 'Rename' })).toHaveAttribute(
			'data-variant',
			'default'
		);

		await fireEvent.click(destroy);
		expect(onPick).toHaveBeenCalledWith('Delete');
	});

	test('mirrors in right-to-left text, where ArrowLeft opens a submenu', async () => {
		document.body.style.direction = 'rtl';
		vi.stubGlobal('matchMedia', (query: string) => ({
			matches: false,
			media: query,
			addEventListener() {},
			removeEventListener() {}
		}));
		try {
			render(Harness, { onPick: vi.fn(), sub: true });
			const trigger = screen.getByRole('button', { name: 'Chat options' });
			trigger.focus();
			await fireEvent.keyDown(trigger, { key: 'Enter' });
			expect((await screen.findByRole('menu')).closest('[dir]')).toHaveAttribute('dir', 'rtl');

			const subTrigger = screen.getByRole('menuitem', { name: 'Move to project' });
			subTrigger.focus();
			await fireEvent.keyDown(subTrigger, { key: 'ArrowLeft' });
			expect(await screen.findByRole('menuitem', { name: 'Travel' })).toBeInTheDocument();
		} finally {
			document.body.style.direction = '';
		}
	});

	test('stays left to right by default', async () => {
		render(Harness, { onPick: vi.fn() });
		await fireEvent.pointerDown(screen.getByRole('button', { name: 'Chat options' }), pointer);
		expect((await screen.findByRole('menu')).closest('[dir]')).toHaveAttribute('dir', 'ltr');
	});

	test('grows out of the trigger from the placed corner', async () => {
		render(Harness, { onPick: vi.fn() });
		await fireEvent.pointerDown(screen.getByRole('button', { name: 'Chat options' }), pointer);
		const menu = await screen.findByRole('menu');
		expect(menu.className).toContain('origin-(--bits-menu-content-transform-origin)');
	});
});
