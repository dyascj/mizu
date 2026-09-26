import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import FeedbackPrompt from './feedback-prompt.svelte';

// jsdom has no Web Animations; finish every Svelte transition on the next tick.
beforeEach(() => {
	Element.prototype.animate = function () {
		const animation = { onfinish: null as null | (() => void), cancel() {}, currentTime: 0 };
		setTimeout(() => animation.onfinish?.());
		return animation as unknown as Animation;
	};
});

afterEach(() => {
	delete (Element.prototype as Partial<Element>).animate;
});

function setup(props: Record<string, unknown> = {}) {
	const onAnswer = vi.fn();
	const onUndo = vi.fn();
	const result = render(FeedbackPrompt, { onAnswer, onUndo, ...props });
	const group = screen.getByRole('group', { name: 'Response feedback' });
	const live = result.container.querySelector('[aria-live="polite"]')!;
	return { ...result, onAnswer, onUndo, group, live };
}

describe('FeedbackPrompt', () => {
	test('asks the question with two plain buttons and a quiet live region', () => {
		const { live } = setup();
		expect(screen.getByText('Was this helpful?')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Yes' })).toHaveAttribute('type', 'button');
		expect(screen.getByRole('button', { name: 'No' })).toBeInTheDocument();
		expect(live.textContent).toBe('');
	});

	test('answers yes at once and thanks the reader', async () => {
		const { onAnswer, group, live } = setup();
		await fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
		expect(onAnswer).toHaveBeenCalledWith(true);
		expect(group).toHaveAttribute('data-step', 'done');
		expect(screen.getByText('Thanks, glad it helped')).toBeInTheDocument();
		expect(live.textContent).toBe('Thanks for your feedback');
	});

	test('opens a comment field in place on no and moves focus into it', async () => {
		const { onAnswer } = setup();
		await fireEvent.click(screen.getByRole('button', { name: 'No' }));
		const field = await screen.findByRole('textbox', { name: 'What was missing?' });
		expect(field).toHaveFocus();
		expect(screen.getByRole('button', { name: 'Send feedback' })).toBeDisabled();

		await fireEvent.input(field, { target: { value: '  An example with forms ' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));
		expect(onAnswer).toHaveBeenCalledWith(false, 'An example with forms');
		expect(screen.getByText('Thanks, noted')).toBeInTheDocument();
	});

	test('never sends an empty comment', async () => {
		const { onAnswer } = setup();
		await fireEvent.click(screen.getByRole('button', { name: 'No' }));
		const field = await screen.findByRole('textbox');
		await fireEvent.input(field, { target: { value: '   ' } });
		await fireEvent.submit(field.closest('form')!);
		expect(onAnswer).not.toHaveBeenCalled();
	});

	test('Escape and Cancel go back to the question, returning focus for keyboard users', async () => {
		const { group } = setup();
		await fireEvent.click(screen.getByRole('button', { name: 'No' }));
		await fireEvent.keyDown(await screen.findByRole('textbox'), { key: 'Escape' });
		expect(group).toHaveAttribute('data-step', 'ask');
		expect(await screen.findByRole('button', { name: 'Yes' })).toHaveFocus();

		await fireEvent.pointerDown(screen.getByRole('button', { name: 'No' }));
		await fireEvent.click(screen.getByRole('button', { name: 'No' }));
		await fireEvent.pointerDown(screen.getByRole('button', { name: 'Cancel' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
		expect(group).toHaveAttribute('data-step', 'ask');
		// A pointer click does not pull focus onto the new step.
		expect(screen.getByRole('button', { name: 'Yes' })).not.toHaveFocus();
	});

	test('Undo takes the answer back', async () => {
		const { onUndo, group } = setup();
		await fireEvent.keyDown(group, { key: 'Enter' });
		await fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
		const undo = await screen.findByRole('button', { name: 'Undo' });
		expect(undo).toHaveFocus();
		await fireEvent.click(undo);
		expect(onUndo).toHaveBeenCalledTimes(1);
		expect(group).toHaveAttribute('data-step', 'ask');
	});

	test('takes a custom question and field label', () => {
		render(FeedbackPrompt, { question: 'Did this fix it?', placeholder: 'What went wrong?' });
		expect(screen.getByText('Did this fix it?')).toBeInTheDocument();
	});
});
