import { fireEvent, render, screen } from '@testing-library/svelte';
import { expect, test, vi } from 'vitest';
import Button from './button.svelte';

test('buttons do not submit surrounding forms unless requested', async () => {
	const { rerender } = render(Button, { 'aria-label': 'Action' });
	expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
	await rerender({ type: 'submit' });
	expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
});

test('disabled links cannot navigate or invoke their callback', async () => {
	const onclick = vi.fn();
	render(Button, { href: '/example', disabled: true, onclick, 'aria-label': 'Example' });
	const link = screen.getByRole('link');
	expect(link).not.toHaveAttribute('href');
	expect(link).toHaveAttribute('aria-disabled', 'true');
	expect(link).toHaveAttribute('tabindex', '-1');
	await fireEvent.click(link);
	expect(onclick).not.toHaveBeenCalled();
});
