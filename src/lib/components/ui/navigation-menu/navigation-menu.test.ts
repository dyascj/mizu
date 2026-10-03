import { fireEvent, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import NavigationMenuFixture from './navigation-menu.test.svelte';

// bits-ui measures panels with ResizeObserver, which jsdom lacks.
class FakeResizeObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
}

beforeEach(() => {
	vi.stubGlobal('ResizeObserver', FakeResizeObserver);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('NavigationMenu', () => {
	test('reads the direction it sits in instead of forcing left to right', async () => {
		document.body.style.direction = 'rtl';
		try {
			render(NavigationMenuFixture);
			await tick();
			expect(document.querySelector('[data-navigation-menu-root]')).toHaveAttribute('dir', 'rtl');
		} finally {
			document.body.style.direction = '';
		}
	});

	test('a trigger opens its panel into the shared viewport and reports it', async () => {
		render(NavigationMenuFixture);
		const product = screen.getByRole('button', { name: 'Product' });
		expect(product).toHaveAttribute('aria-expanded', 'false');

		await fireEvent.click(product);
		await tick();
		expect(product).toHaveAttribute('aria-expanded', 'true');
		const link = await screen.findByRole('link', { name: 'Agents' });
		expect(link.closest('[data-navigation-menu-viewport]')).toBeInTheDocument();
	});

	test('the panel pads its content inside the element the viewport measures', async () => {
		render(NavigationMenuFixture);
		await fireEvent.click(screen.getByRole('button', { name: 'Product' }));
		const link = await screen.findByRole('link', { name: 'Agents' });
		const content = link.closest('[data-navigation-menu-content]')!;
		expect(content.firstElementChild).toHaveClass('p-2');
		expect(content.firstElementChild).toContainElement(link);
	});

	test("a consumer's padding replaces the default instead of adding to it", async () => {
		render(NavigationMenuFixture);
		await fireEvent.click(screen.getByRole('button', { name: 'Developers' }));
		const link = await screen.findByRole('link', { name: 'API reference' });
		const content = link.closest<HTMLElement>('[data-navigation-menu-content]')!;
		const box = content.firstElementChild!;
		expect(box).toHaveClass('p-4');
		expect(box).not.toHaveClass('p-2');
		expect(content.className).not.toMatch(/\bp-\d/);
	});

	test('a panel opening fresh lands under its trigger instead of sliding there', async () => {
		render(NavigationMenuFixture);
		await fireEvent.click(screen.getByRole('button', { name: 'Product' }));
		await screen.findByRole('link', { name: 'Agents' });
		const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
		const viewport = document.querySelector<HTMLElement>('[data-navigation-menu-viewport]')!;
		const wrapper = viewport.parentElement!;
		// Opened, but bits-ui has not measured the content yet.
		await frame();
		await tick();
		// The measurement arrives: the panel is placed for the first time.
		viewport.style.setProperty('--bits-navigation-menu-viewport-width', '320px');
		await frame();
		await tick();
		expect(wrapper.style.translate).not.toBe('');
		expect(wrapper.className).not.toMatch(/transition-\[translate\]/);
	});

	test('arrow keys move between triggers', async () => {
		render(NavigationMenuFixture);
		const product = screen.getByRole('button', { name: 'Product' });
		product.focus();
		await fireEvent.keyDown(product, { key: 'ArrowRight' });
		expect(screen.getByRole('button', { name: 'Developers' })).toHaveFocus();
	});
});
