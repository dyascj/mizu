import { act, fireEvent, render, screen, within } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import Toast from './toast.svelte';
import Toaster from './toaster.svelte';
import { toast, toaster } from './toast-state.svelte';

// jsdom has no Web Animations API; Svelte transitions finish on the next microtask.
const nativeAnimate = Element.prototype.animate;
beforeEach(() => {
	Element.prototype.animate = function () {
		return {
			cancel() {},
			play() {},
			pause() {},
			set onfinish(done: () => void) {
				queueMicrotask(done);
			}
		} as unknown as Animation;
	};
});

afterEach(async () => {
	toaster.clear();
	vi.useRealTimers();
	// Lets the leave transitions of cleared toasts start before jsdom loses the fake.
	await new Promise((resolve) => setTimeout(resolve));
	Element.prototype.animate = nativeAnimate;
});

test('keyboard focus pauses dismissal, including when the pointer leaves', async () => {
	vi.useFakeTimers();
	toast({ title: 'Archived', duration: 1000, action: { label: 'Undo', onclick: vi.fn() } });
	render(Toast, { toast: toaster.toasts[0] });
	const status = screen.getByRole('status');
	const undo = screen.getByRole('button', { name: 'Undo' });
	await act(() => vi.advanceTimersByTimeAsync(250));
	await fireEvent.focusIn(undo);
	await fireEvent.pointerEnter(status);
	await fireEvent.pointerLeave(status);
	await act(() => vi.advanceTimersByTimeAsync(2000));
	expect(toaster.toasts).toHaveLength(1);
	await fireEvent.focusOut(undo, { relatedTarget: document.body });
	await act(() => vi.advanceTimersByTimeAsync(749));
	expect(toaster.toasts).toHaveLength(1);
	await act(() => vi.advanceTimersByTimeAsync(1));
	expect(toaster.toasts).toHaveLength(0);
});

describe('Toast', () => {
	test('an undo toast offers Undo with its shortcut and a spoken hint', async () => {
		const onUndo = vi.fn();
		toast.undo({ title: 'Deleted chat', onUndo });
		render(Toast, { toast: toaster.toasts[0] });
		const status = screen.getByRole('status');
		expect(status).toHaveTextContent('Press Undo or Control Z to restore.');
		expect(within(status).queryByRole('button', { name: 'Dismiss' })).not.toBeInTheDocument();

		const undo = screen.getByRole('button', { name: 'Undo' });
		expect(undo).toHaveAttribute('aria-keyshortcuts', 'Control+Z Meta+Z');
		await fireEvent.click(undo);
		expect(onUndo).toHaveBeenCalledOnce();
		expect(toaster.toasts).toHaveLength(0);
	});

	test('an action can keep the toast open', async () => {
		const onclick = vi.fn();
		toast({ title: 'Upload failed', action: { label: 'Retry', onclick, dismiss: false } });
		render(Toast, { toast: toaster.toasts[0] });
		await fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
		expect(onclick).toHaveBeenCalledOnce();
		expect(toaster.toasts).toHaveLength(1);
	});

	test('errors interrupt, and a loading toast speaks politely', () => {
		toast.error('Offline');
		toast.loading('Saving');
		const [error, loading] = toaster.toasts;
		const { unmount } = render(Toast, { toast: error });
		expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
		unmount();
		render(Toast, { toast: loading });
		expect(screen.getByRole('status')).toHaveAttribute('data-loading');
	});
});

// jsdom has no `inert` property, so Svelte writes the value as an attribute instead.
const isInert = (el: HTMLElement) =>
	el.inert === true || ![null, 'false'].includes(el.getAttribute('inert'));

describe('Toaster', () => {
	const items = () => [
		...document.querySelectorAll<HTMLLIElement>('[aria-label="Notifications"] li')
	];

	test('stacks the newest toast in front and fans out while focus is inside', async () => {
		render(Toaster);
		await act(() => {
			toast('First');
			toast('Second');
		});
		const [front, back] = items();
		expect(front).toHaveTextContent('Second');
		expect(back.style.getPropertyValue('--scale')).toBe('0.95');
		expect(isInert(back)).toBe(true);

		await fireEvent.focusIn(within(front).getByRole('button', { name: 'Dismiss' }));
		expect(back.style.getPropertyValue('--scale')).toBe('1');
		expect(isInert(back)).toBe(false);
	});

	test('closing the focused toast hands focus on, and lets it go once the stack is empty', async () => {
		vi.useFakeTimers();
		render(Toaster);
		await act(() => {
			toast({ title: 'First', duration: 0 });
			toast({ title: 'Second', duration: 0 });
		});
		const [front, back] = items();
		const close = within(front).getByRole('button', { name: 'Dismiss' });
		await act(() => close.focus());
		await fireEvent.click(close);
		await act(() => Promise.resolve());
		expect(within(back).getByRole('status')).toHaveFocus();

		// The last one closes with focus on its card: focus leaves the stack, so
		// the stack stops holding timers.
		await act(() => toaster.dismiss(toaster.toasts[0].id));
		await act(() => Promise.resolve());
		expect(document.activeElement).toBe(document.body);

		await act(() => toast({ title: 'Eval finished', duration: 1000 }));
		await act(() => vi.advanceTimersByTimeAsync(1000));
		expect(toaster.toasts).toHaveLength(0);
	});

	test('hovering the stack holds every timer', async () => {
		vi.useFakeTimers();
		render(Toaster);
		await act(() => toast({ title: 'Eval finished', duration: 1000 }));
		const list = document.querySelector('[aria-label="Notifications"] ol')!;
		await fireEvent.pointerEnter(list, { pointerType: 'mouse' });
		await act(() => vi.advanceTimersByTimeAsync(3000));
		expect(toaster.toasts).toHaveLength(1);
		await fireEvent.pointerLeave(list);
		await act(() => vi.advanceTimersByTimeAsync(1000));
		expect(toaster.toasts).toHaveLength(0);
	});

	test('hides toasts past the visible count', async () => {
		render(Toaster, { visibleToasts: 2 });
		await act(() => {
			toast('One');
			toast('Two');
			toast('Three');
		});
		const [, , oldest] = items();
		expect(oldest).toHaveTextContent('One');
		expect(isInert(oldest)).toBe(true);
		expect(oldest.style.getPropertyValue('--opacity')).toBe('0');
	});

	test('Ctrl or Cmd+Z undoes the newest undo toast, but not inside a text field', async () => {
		const onUndo = vi.fn();
		render(Toaster);
		await act(() => toast.undo({ title: 'Deleted chat', onUndo }));

		const input = document.createElement('input');
		document.body.append(input);
		await fireEvent.keyDown(input, { key: 'z', ctrlKey: true });
		expect(onUndo).not.toHaveBeenCalled();
		input.remove();

		await fireEvent.keyDown(window, { key: 'z', metaKey: true });
		expect(onUndo).toHaveBeenCalledOnce();
		expect(toaster.toasts).toHaveLength(0);
		await act(() => Promise.resolve());
		expect(screen.getByText('Restored')).toHaveAttribute('aria-live', 'polite');
	});

	test('a sideways swipe dismisses, a short one springs back', async () => {
		render(Toaster);
		await act(() => toast({ title: 'Swipe me', duration: 0 }));
		const [item] = items();
		await fireEvent.pointerDown(item, { pointerId: 1, clientX: 0, clientY: 0, button: 0 });
		await fireEvent.pointerMove(item, { pointerId: 1, clientX: 10, clientY: 0 });
		expect(item.style.translate).toBe('10px 0');
		await new Promise((r) => setTimeout(r, 120));
		await fireEvent.pointerUp(item, { pointerId: 1, clientX: 10, clientY: 0 });
		expect(item.style.translate).toBe('');
		expect(toaster.toasts).toHaveLength(1);

		await fireEvent.pointerDown(item, { pointerId: 2, clientX: 0, clientY: 0, button: 0 });
		await fireEvent.pointerMove(item, { pointerId: 2, clientX: 80, clientY: 4 });
		await fireEvent.pointerUp(item, { pointerId: 2, clientX: 80, clientY: 4 });
		expect(toaster.toasts).toHaveLength(0);
	});
});
