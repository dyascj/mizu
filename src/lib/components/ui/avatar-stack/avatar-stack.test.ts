import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';

import AvatarStack from './avatar-stack.svelte';

const team = [
	{ name: 'Amara Okafor' },
	{ name: 'Jonas Weber' },
	{ name: 'Mei Tanaka' },
	{ name: 'Dev Patel' },
	{ name: 'Ines Moreau' },
	{ name: 'Tom Hughes' }
];

afterEach(() => vi.unstubAllGlobals());

const offset = (button: HTMLElement) => button.parentElement!.style.transform;

describe('AvatarStack', () => {
	test('is one labelled toolbar with a named button per face and a summary of the rest', () => {
		render(AvatarStack, { people: team, max: 4, label: 'Project members' });
		const toolbar = screen.getByRole('toolbar', { name: 'Project members' });
		const buttons = screen.getAllByRole('button');
		expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
			'Amara Okafor',
			'Jonas Weber',
			'Mei Tanaka',
			'Dev Patel',
			'2 more: Ines Moreau and Tom Hughes'
		]);
		expect(toolbar).toHaveTextContent('AO');
		expect(toolbar).toHaveTextContent('+2');
		// Only one face is a tab stop.
		expect(buttons.filter((button) => button.tabIndex === 0)).toHaveLength(1);
	});

	test('arrow keys, Home, and End move focus along the stack', async () => {
		render(AvatarStack, { people: team, max: 4 });
		const buttons = screen.getAllByRole('button');
		buttons[0].focus();

		await fireEvent.keyDown(buttons[0], { key: 'ArrowRight' });
		expect(buttons[1]).toHaveFocus();
		expect(buttons[1]).toHaveAttribute('tabindex', '0');
		expect(buttons[0]).toHaveAttribute('tabindex', '-1');

		await fireEvent.keyDown(buttons[1], { key: 'End' });
		expect(buttons[4]).toHaveFocus();
		await fireEvent.keyDown(buttons[4], { key: 'ArrowRight' });
		expect(buttons[4]).toHaveFocus();
		await fireEvent.keyDown(buttons[4], { key: 'Home' });
		expect(buttons[0]).toHaveFocus();
	});

	test('fans open under a mouse and closes when it leaves', async () => {
		// Reduced motion makes the spring jump, so offsets are exact at once.
		vi.stubGlobal('matchMedia', (query: string) => ({
			matches: query.includes('reduce'),
			addEventListener() {},
			removeEventListener() {}
		}));
		render(AvatarStack, { people: team.slice(0, 3), size: 40 });
		const toolbar = screen.getByRole('toolbar');
		const [first, , last] = screen.getAllByRole('button');
		expect(offset(first)).toBe('translateX(-27.20px)');

		await fireEvent.pointerEnter(toolbar, { pointerType: 'mouse' });
		expect(offset(first)).toBe('translateX(-45.60px)');
		expect(offset(last)).toBe('translateX(45.60px)');

		await fireEvent.pointerLeave(toolbar, { pointerType: 'mouse' });
		expect(offset(first)).toBe('translateX(-27.20px)');
	});

	test('a touch does not fan the stack', async () => {
		vi.stubGlobal('matchMedia', (query: string) => ({
			matches: query.includes('reduce'),
			addEventListener() {},
			removeEventListener() {}
		}));
		render(AvatarStack, { people: team.slice(0, 3), size: 40 });
		await fireEvent.pointerEnter(screen.getByRole('toolbar'), { pointerType: 'touch' });
		expect(offset(screen.getAllByRole('button')[0])).toBe('translateX(-27.20px)');
	});

	test('reports the chosen face and the hidden people', async () => {
		const onSelect = vi.fn();
		const onMore = vi.fn();
		render(AvatarStack, { people: team, max: 5, onSelect, onMore });
		await fireEvent.click(screen.getByRole('button', { name: 'Mei Tanaka' }));
		expect(onSelect).toHaveBeenCalledWith(team[2]);
		await fireEvent.click(screen.getByRole('button', { name: /^1 more/ }));
		expect(onMore).toHaveBeenCalledWith([team[5]]);
	});

	test('two people with the same name each get a face', () => {
		render(AvatarStack, {
			people: [{ name: 'Alex Kim' }, { name: 'Alex Kim' }, { name: 'Mei Tanaka' }]
		});
		expect(screen.getAllByRole('button', { name: 'Alex Kim' })).toHaveLength(2);
	});

	test('still calls handlers passed by the caller', async () => {
		const onkeydown = vi.fn();
		const onfocusin = vi.fn();
		render(AvatarStack, { people: team, max: 4, onkeydown, onfocusin });
		const [first, second] = screen.getAllByRole('button');
		first.focus();
		await fireEvent.keyDown(first, { key: 'ArrowRight' });
		expect(onfocusin).toHaveBeenCalled();
		expect(onkeydown).toHaveBeenCalledOnce();
		expect(second).toHaveFocus();
	});
});
