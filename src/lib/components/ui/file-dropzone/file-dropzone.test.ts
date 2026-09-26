import { act, fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';

import FileDropzone from './file-dropzone.svelte';

const file = (name: string, type = 'text/plain', size = 10) =>
	new File(['x'.repeat(size)], name, { type });

/** A drag carrying files, the way the browser reports one mid-flight. */
const dragOf = (files: File[]) => ({
	dataTransfer: { types: ['Files'], files, dropEffect: 'none' }
});

const zone = () => screen.getByRole('button', { name: /Drop files here/ });
const liveRegion = (container: HTMLElement) =>
	container.querySelector('[aria-live="polite"]')?.textContent?.trim();

describe('FileDropzone', () => {
	test('is a button that opens the file picker and is described by its hint', async () => {
		const { container } = render(FileDropzone, { hint: 'PDF or images' });
		expect(zone()).toHaveAccessibleDescription('PDF or images');
		const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
		const click = vi.spyOn(input, 'click');
		await fireEvent.click(zone());
		expect(click).toHaveBeenCalled();
	});

	test('a file anywhere on the page wakes the edge, and over the zone seals it', async () => {
		render(FileDropzone);
		await fireEvent.dragEnter(window, dragOf([file('a.txt')]));
		expect(zone()).toHaveAttribute('data-state', 'dragging');
		await fireEvent.dragEnter(zone(), dragOf([file('a.txt')]));
		expect(zone()).toHaveAttribute('data-state', 'over');
		await fireEvent.dragLeave(zone(), dragOf([file('a.txt')]));
		expect(zone()).toHaveAttribute('data-state', 'dragging');
		await fireEvent.dragLeave(window, dragOf([file('a.txt')]));
		expect(zone()).toHaveAttribute('data-state', 'idle');
	});

	test('dropping adds chips, reports the files, and announces them', async () => {
		const onFilesAdded = vi.fn();
		const { container } = render(FileDropzone, { onFilesAdded });
		const files = [file('notes.md'), file('chart.png', 'image/png', 2048)];
		await fireEvent.drop(zone(), dragOf(files));
		expect(onFilesAdded).toHaveBeenCalledWith(files);
		const list = screen.getByRole('list', { name: 'Attached files' });
		expect(list).toHaveTextContent('notes.md');
		expect(list).toHaveTextContent('chart.png');
		expect(list).toHaveTextContent('2.0 KB');
		expect(liveRegion(container)).toBe('Added 2 files');
	});

	test('picking through the input adds files too', async () => {
		const onFilesAdded = vi.fn();
		const { container } = render(FileDropzone, { onFilesAdded });
		const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
		Object.defineProperty(input, 'files', { configurable: true, value: [file('brief.pdf')] });
		await fireEvent.change(input);
		expect(onFilesAdded).toHaveBeenCalledWith([expect.objectContaining({ name: 'brief.pdf' })]);
		expect(liveRegion(container)).toBe('Added brief.pdf');
	});

	test('drops outside accept are rejected and announced', async () => {
		const onFilesAdded = vi.fn();
		const onFilesRejected = vi.fn();
		const { container } = render(FileDropzone, {
			accept: '.pdf,image/*',
			onFilesAdded,
			onFilesRejected
		});
		const ok = file('photo.jpg', 'image/jpeg');
		const bad = file('run.exe', 'application/octet-stream');
		await fireEvent.drop(zone(), dragOf([ok, bad]));
		expect(onFilesAdded).toHaveBeenCalledWith([ok]);
		expect(onFilesRejected).toHaveBeenCalledWith([bad]);
		expect(liveRegion(container)).toBe('Added photo.jpg. run.exe is not a supported type');
	});

	test('without multiple each file replaces the last, reporting the one it replaced', async () => {
		const onFileRemove = vi.fn();
		render(FileDropzone, { multiple: false, onFileRemove });
		const one = file('one.txt');
		await fireEvent.drop(zone(), dragOf([one]));
		expect(onFileRemove).not.toHaveBeenCalled();
		await fireEvent.drop(zone(), dragOf([file('two.txt')]));
		const list = screen.getByRole('list', { name: 'Attached files' });
		expect(list).toHaveTextContent('two.txt');
		expect(list).not.toHaveTextContent('one.txt');
		expect(onFileRemove).toHaveBeenCalledTimes(1);
		expect(onFileRemove).toHaveBeenCalledWith(one);
	});

	test('a file dragged off target is refused rather than opened by the browser', async () => {
		render(FileDropzone);
		const drag = dragOf([file('a.txt')]);
		// dispatchEvent reports false once a listener prevents the default.
		expect(await fireEvent.dragOver(document.body, drag)).toBe(false);
		expect(drag.dataTransfer.dropEffect).toBe('none');
		expect(await fireEvent.drop(document.body, dragOf([file('a.txt')]))).toBe(false);
	});

	test('the zone itself takes the drag with a copy effect', async () => {
		render(FileDropzone);
		const drag = dragOf([file('a.txt')]);
		await fireEvent.dragOver(zone(), drag);
		expect(drag.dataTransfer.dropEffect).toBe('copy');
	});

	test('leaves drags alone that another drop target on the page claims', async () => {
		render(FileDropzone);
		const other = document.createElement('div');
		other.addEventListener('dragover', (event) => {
			event.preventDefault();
			event.dataTransfer!.dropEffect = 'copy';
		});
		other.addEventListener('drop', (event) => event.preventDefault());
		document.body.append(other);
		try {
			await fireEvent.dragEnter(window, dragOf([file('a.txt')]));
			expect(zone()).toHaveAttribute('data-state', 'dragging');
			const drag = dragOf([file('a.txt')]);
			await fireEvent.dragOver(other, drag);
			expect(drag.dataTransfer.dropEffect).toBe('copy');
			await fireEvent.drop(other, dragOf([file('a.txt')]));
			// The drag ended over there, so the edge still settles.
			expect(zone()).toHaveAttribute('data-state', 'idle');
		} finally {
			other.remove();
		}
	});

	test('two dropzones on one page each take their own drags', async () => {
		const onFirst = vi.fn();
		const onSecond = vi.fn();
		render(FileDropzone, { onFilesAdded: onFirst, label: 'First zone' });
		render(FileDropzone, { onFilesAdded: onSecond, label: 'Second zone' });
		const second = screen.getByRole('button', { name: 'Second zone' });
		const drag = dragOf([file('a.txt')]);
		await fireEvent.dragOver(second, drag);
		expect(drag.dataTransfer.dropEffect).toBe('copy');
		const files = [file('b.txt')];
		await fireEvent.drop(second, dragOf(files));
		expect(onSecond).toHaveBeenCalledWith(files);
		expect(onFirst).not.toHaveBeenCalled();
	});

	test('leaves a native file input on the page to take drops itself', async () => {
		render(FileDropzone);
		const native = document.createElement('input');
		native.type = 'file';
		document.body.append(native);
		try {
			const drag = dragOf([file('a.txt')]);
			drag.dataTransfer.dropEffect = 'copy';
			expect(await fireEvent.dragOver(native, drag)).toBe(true);
			expect(drag.dataTransfer.dropEffect).toBe('copy');
			expect(await fireEvent.drop(native, dragOf([file('a.txt')]))).toBe(true);
		} finally {
			native.remove();
		}
	});

	test('removing a chip moves focus to its neighbour, then to the zone', async () => {
		const onFileRemove = vi.fn();
		const a = file('a.txt');
		const b = file('b.txt');
		render(FileDropzone, { files: [a, b], onFileRemove });
		await fireEvent.click(screen.getByRole('button', { name: 'Remove a.txt' }));
		expect(onFileRemove).toHaveBeenCalledWith(a);
		await act(() => Promise.resolve());
		expect(screen.getByRole('button', { name: 'Remove b.txt' })).toHaveFocus();
		await fireEvent.click(screen.getByRole('button', { name: 'Remove b.txt' }));
		await act(() => Promise.resolve());
		expect(zone()).toHaveFocus();
		expect(screen.queryByRole('list')).not.toBeInTheDocument();
	});

	test('shows upload progress per file', () => {
		const a = file('a.txt');
		const b = file('b.txt');
		render(FileDropzone, { files: [a, b], progress: (f: File) => (f === a ? 0.4 : 1) });
		const bar = screen.getByRole('progressbar', { name: 'Uploading a.txt' });
		expect(bar).toHaveAttribute('aria-valuenow', '40');
		expect(screen.queryByRole('progressbar', { name: 'Uploading b.txt' })).not.toBeInTheDocument();
	});

	test('disabled ignores drops', async () => {
		const onFilesAdded = vi.fn();
		render(FileDropzone, { disabled: true, onFilesAdded });
		await fireEvent.drop(zone(), dragOf([file('a.txt')]));
		expect(onFilesAdded).not.toHaveBeenCalled();
	});
});
