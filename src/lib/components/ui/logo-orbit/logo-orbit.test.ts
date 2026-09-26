import { fireEvent, render, screen } from '@testing-library/svelte';
import Calendar from '@lucide/svelte/icons/calendar';
import Mail from '@lucide/svelte/icons/mail';
import Database from '@lucide/svelte/icons/database';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import LogoOrbit from './logo-orbit.svelte';

const rings = [
	{
		logos: [
			{ name: 'Mail', icon: Mail },
			{ name: 'Calendar', icon: Calendar, href: '/integrations/calendar' }
		],
		radius: 0.7,
		lap: 40
	},
	{ logos: [{ name: 'Database', icon: Database }], radius: 1, lap: -60 }
];

let frames: FrameRequestCallback[] = [];
let now = 0;
function runFrames(count: number) {
	for (let i = 0; i < count; i++) {
		const queue = frames;
		frames = [];
		now += 1000 / 60;
		for (const callback of queue) callback(now);
	}
}

beforeEach(() => {
	frames = [];
	// The name tag transitions in with the Web Animations API, which jsdom lacks.
	Element.prototype.animate ??= () =>
		({ cancel() {}, finished: Promise.resolve() }) as unknown as Animation;
	vi.stubGlobal('matchMedia', (query: string) => ({
		matches: false,
		media: query,
		addEventListener() {},
		removeEventListener() {}
	}));
	vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => frames.push(callback));
	vi.stubGlobal('cancelAnimationFrame', () => {});
	vi.stubGlobal(
		'ResizeObserver',
		class {
			observe() {}
			disconnect() {}
		}
	);
	vi.stubGlobal(
		'IntersectionObserver',
		class {
			observe() {}
			disconnect() {}
		}
	);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

const transformOf = (name: string) =>
	(screen.getByRole(name === 'Calendar' ? 'link' : 'button', { name }).closest('li') as HTMLElement)
		.style.transform;

describe('LogoOrbit', () => {
	test('renders each mark as a named control in one list', () => {
		render(LogoOrbit, { rings });
		expect(screen.getAllByRole('listitem')).toHaveLength(3);
		expect(screen.getByRole('button', { name: 'Mail' })).toHaveAttribute('type', 'button');
		expect(screen.getByRole('link', { name: 'Calendar' })).toHaveAttribute(
			'href',
			'/integrations/calendar'
		);
	});

	test('shows the name of a focused mark and reports clicks', async () => {
		const onSelect = vi.fn();
		render(LogoOrbit, { rings, onSelect });
		const mail = screen.getByRole('button', { name: 'Mail' });
		await fireEvent.focus(mail);
		expect(mail).toHaveTextContent('Mail');
		runFrames(1);
		expect((mail.closest('li') as HTMLElement).style.opacity).toBe('1');
		await fireEvent.click(mail);
		expect(onSelect).toHaveBeenCalledWith(rings[0].logos[0]);
	});

	test('keeps turning, brakes to sleep while pointed at, and holds still when paused', async () => {
		const { rerender, container } = render(LogoOrbit, { rings });
		const before = transformOf('Mail');
		runFrames(10);
		expect(transformOf('Mail')).not.toBe(before);

		await fireEvent.pointerEnter(container.firstElementChild as HTMLElement, {
			pointerType: 'mouse'
		});
		runFrames(300);
		expect(frames).toHaveLength(0);

		await fireEvent.pointerLeave(container.firstElementChild as HTMLElement);
		expect(frames.length).toBeGreaterThan(0);
		await rerender({ paused: true });
		runFrames(300);
		expect(frames).toHaveLength(0);
		const held = transformOf('Mail');
		runFrames(10);
		expect(transformOf('Mail')).toBe(held);
	});

	test('starts still when paused', () => {
		render(LogoOrbit, { rings, paused: true });
		expect(frames).toHaveLength(0);
	});
});
