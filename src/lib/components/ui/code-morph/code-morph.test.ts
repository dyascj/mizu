import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import CodeMorph from './code-morph.svelte';

const steps = [
	{ label: 'Step 1', title: 'Call the model', code: 'const reply = await model.generate(prompt);' },
	{
		label: 'Step 2',
		title: 'Stream the reply',
		code: 'const stream = model.stream(prompt);\nfor await (const chunk of stream) render(chunk);'
	},
	{
		label: 'Step 3',
		title: 'Stop on demand',
		code: 'const stream = model.stream(prompt, { signal });'
	}
];

// jsdom has no Web Animations API; Svelte transitions finish on the next microtask.
const nativeAnimate = Element.prototype.animate;
beforeEach(() => {
	Element.prototype.animate = () =>
		({
			cancel() {},
			set onfinish(done: () => void) {
				queueMicrotask(done);
			}
		}) as unknown as Animation;
});

afterEach(() => {
	Element.prototype.animate = nativeAnimate;
	vi.unstubAllGlobals();
});

const tokens = (container: HTMLElement) =>
	Array.from(container.querySelectorAll<HTMLElement>('.code-morph-token'));
const byText = (container: HTMLElement, text: string) =>
	tokens(container).filter((t) => t.textContent === text && !t.className.includes('exit'));

describe('CodeMorph', () => {
	test('is a tab list with one panel, whose code is read as plain text', () => {
		render(CodeMorph, { steps });
		const tabs = screen.getAllByRole('tab');
		expect(screen.getByRole('tablist', { name: 'Code steps' })).toBeInTheDocument();
		expect(tabs.map((tab) => tab.getAttribute('aria-selected'))).toEqual([
			'true',
			'false',
			'false'
		]);
		const panel = screen.getByRole('tabpanel', { name: 'Step 1' });
		expect(panel.querySelector('pre')).toHaveTextContent(steps[0].code);
		expect(panel.querySelector('pre + [aria-hidden="true"]')).not.toBeNull();
		expect(screen.getByText('Call the model')).toBeInTheDocument();
	});

	test('keeps tokens the steps share and moves them, trading out the rest', async () => {
		const { container } = render(CodeMorph, { steps });
		const model = byText(container, 'model')[0];
		const prompt = byText(container, 'prompt')[0];
		expect(prompt.style.transform).toBe('translate(35ch, 0px)');

		await fireEvent.click(screen.getByRole('tab', { name: 'Step 2' }));
		// Same element, new place.
		expect(byText(container, 'model')[0]).toBe(model);
		expect(byText(container, 'prompt')[0]).toBe(prompt);
		expect(prompt.style.transform).toBe('translate(28ch, 0px)');

		const leaving = tokens(container).filter((t) => t.classList.contains('code-morph-exit'));
		expect(leaving.map((t) => t.textContent)).toEqual(expect.arrayContaining(['generate']));
		const entering = tokens(container).filter((t) => t.classList.contains('code-morph-enter'));
		expect(entering.map((t) => t.textContent)).toEqual(expect.arrayContaining(['stream', 'for']));
		expect(screen.getByRole('tabpanel').querySelector('pre')).toHaveTextContent('for await');
	});

	test('moves between steps with arrow keys, Home, and End', async () => {
		const onStepChange = vi.fn();
		render(CodeMorph, { steps, onStepChange });
		const [first, second, third] = screen.getAllByRole('tab');
		first.focus();

		await fireEvent.keyDown(first, { key: 'ArrowRight' });
		expect(second).toHaveFocus();
		expect(second).toHaveAttribute('aria-selected', 'true');
		expect(onStepChange).toHaveBeenLastCalledWith(1);

		await fireEvent.keyDown(second, { key: 'End' });
		expect(third).toHaveFocus();
		await fireEvent.keyDown(third, { key: 'ArrowRight' });
		expect(first).toHaveFocus();
		await fireEvent.keyDown(first, { key: 'ArrowLeft' });
		expect(third).toHaveFocus();
		await fireEvent.keyDown(third, { key: 'Home' });
		expect(first).toHaveAttribute('tabindex', '0');
		expect(third).toHaveAttribute('tabindex', '-1');
	});

	test('follows the step prop from outside', async () => {
		const { rerender } = render(CodeMorph, { steps, step: 0 });
		await rerender({ step: 2 });
		expect(screen.getByRole('tab', { name: 'Step 3' })).toHaveAttribute('aria-selected', 'true');
		expect(screen.getByRole('tabpanel').querySelector('pre')).toHaveTextContent('signal');
		expect(screen.getByText('3/3')).toBeInTheDocument();
	});

	test('morphs to new code for the step on show', async () => {
		const { container, rerender } = render(CodeMorph, { steps, step: 0 });
		const edited = [{ ...steps[0], code: 'const reply = await model.generate(prompt, options);' }];
		await rerender({ steps: [...edited, ...steps.slice(1)], step: 0 });
		expect(byText(container, 'options')).toHaveLength(1);
		expect(screen.getByRole('tabpanel').querySelector('pre')).toHaveTextContent('options');
		// Shared tokens keep their place rather than being redrawn.
		expect(byText(container, 'reply')).toHaveLength(1);
	});

	test('copies the code on show', async () => {
		const writeText = vi.fn().mockResolvedValue(undefined);
		vi.stubGlobal('navigator', { clipboard: { writeText } });
		render(CodeMorph, { steps, step: 1 });
		await fireEvent.click(screen.getByRole('button', { name: 'Copy code' }));
		expect(writeText).toHaveBeenCalledWith(steps[1].code);
	});
});
