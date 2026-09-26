import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import SidebarFixture from './sidebar.test.svelte';

beforeEach(() => {
	vi.stubGlobal('matchMedia', (query: string) => ({
		matches: false,
		media: query,
		addEventListener() {},
		removeEventListener() {}
	}));
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	document.cookie = 'sidebar:state=; max-age=0; path=/';
});

describe('Sidebar', () => {
	test('the trigger folds the sidebar to its icon rail and back', async () => {
		const { container } = render(SidebarFixture);
		const sidebar = container.querySelector('[data-slot="sidebar"]')!;
		expect(sidebar).toHaveAttribute('data-state', 'expanded');

		await fireEvent.click(screen.getByRole('button', { name: 'Toggle Sidebar' }));
		expect(sidebar).toHaveAttribute('data-state', 'collapsed');
		expect(sidebar).toHaveAttribute('data-collapsible', 'icon');
		// Labels step aside visually but keep naming their buttons.
		expect(screen.getByRole('button', { name: 'Agents' })).toBeInTheDocument();

		await fireEvent.keyDown(window, { key: 'b', ctrlKey: true });
		expect(sidebar).toHaveAttribute('data-state', 'expanded');
	});

	test('the menu keeps one list item per entry, and the highlight adds none', () => {
		render(SidebarFixture);
		const list = screen.getByRole('list');
		expect(within(list).getAllByRole('listitem')).toHaveLength(3);
		// The highlight is the list's own ::before, so item selectors like first: still work.
		expect(list.children).toHaveLength(3);
		expect(list.firstElementChild).toHaveAttribute('data-slot', 'sidebar-menu-item');
	});

	test('the active button paints its own highlight until the glide takes over', async () => {
		render(SidebarFixture);
		const list = screen.getByRole('list');
		// jsdom has no ResizeObserver, so the glide never starts.
		expect(list).not.toHaveAttribute('data-glide');
		expect(screen.getByRole('button', { name: 'Home' })).toHaveAttribute('data-active', 'true');
	});

	test('the highlight takes over and glides to a new active item', async () => {
		// Like a browser, report every newly observed element once, straight away.
		const observed: Element[] = [];
		vi.stubGlobal(
			'ResizeObserver',
			class {
				constructor(private callback: ResizeObserverCallback) {}
				observe(target: Element) {
					observed.push(target);
					queueMicrotask(() =>
						this.callback([{ target } as ResizeObserverEntry], this as unknown as ResizeObserver)
					);
				}
				unobserve() {}
				disconnect() {}
			}
		);
		// jsdom lays nothing out; report every button as rendered.
		vi.spyOn(Element.prototype, 'getClientRects').mockReturnValue([
			new DOMRect()
		] as unknown as DOMRectList);
		render(SidebarFixture);
		const list = screen.getByRole('list');
		const glide = () => list.style.getPropertyValue('--menu-glide-transition');
		await Promise.resolve();
		expect(list).toHaveAttribute('data-glide');
		// The first placement jumps.
		expect(glide()).toBe('none');

		await fireEvent.click(screen.getByRole('button', { name: 'Runs' }));
		expect(screen.getByRole('button', { name: 'Runs' })).toHaveAttribute('data-active', 'true');
		expect(screen.getByRole('button', { name: 'Home' })).toHaveAttribute('data-active', 'false');
		// Let the mutation record and the new button's first resize report land.
		await new Promise((resolve) => setTimeout(resolve));
		expect(observed).toContain(screen.getByRole('button', { name: 'Runs' }));
		// That first report must not cancel the glide.
		expect(glide()).toContain('translate');
	});
});
