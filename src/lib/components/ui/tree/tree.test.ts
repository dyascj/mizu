import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';

import Tree from './tree.svelte';

const items = [
	{
		id: 'projects',
		label: 'Projects',
		children: [{ id: 'mizu', label: 'Mizu' }]
	},
	{ id: 'notes', label: 'Notes' }
];

describe('Tree', () => {
	test('expands branches and moves focus through visible rows', async () => {
		render(Tree, { items });
		const tree = screen.getByRole('tree');
		const projects = within(tree).getByRole('treeitem', { name: 'Projects' });

		projects.focus();
		await fireEvent.keyDown(projects, { key: 'ArrowRight' });
		expect(projects).toHaveAttribute('aria-expanded', 'true');

		await fireEvent.keyDown(projects, { key: 'ArrowDown' });
		expect(within(tree).getByRole('treeitem', { name: 'Mizu' })).toHaveFocus();
	});

	test('selects rows with Enter and reports the selected id', async () => {
		const onSelect = vi.fn();
		render(Tree, { items, onSelect });
		const notes = screen.getByRole('treeitem', { name: 'Notes' });

		notes.focus();
		await fireEvent.keyDown(notes, { key: 'Enter' });
		expect(notes).toHaveAttribute('aria-selected', 'true');
		expect(onSelect).toHaveBeenCalledWith('notes');
	});

	test('keeps the roving tab stop on a visible row when selection is collapsed', () => {
		render(Tree, { items, selected: 'mizu' });
		const tree = screen.getByRole('tree');

		expect(within(tree).getByRole('treeitem', { name: 'Projects' })).toHaveAttribute(
			'tabindex',
			'0'
		);
		expect(within(tree).queryByRole('treeitem', { name: 'Mizu' })).not.toBeInTheDocument();
	});
});
