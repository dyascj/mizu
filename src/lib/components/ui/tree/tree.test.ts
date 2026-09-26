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

	test('jumps to rows by typing the start of their label', async () => {
		render(Tree, {
			items: [
				{ id: 'agents', label: 'agents' },
				{ id: 'prompts', label: 'prompts' },
				{ id: 'playground', label: 'playground' },
				{ id: 'runs', label: 'runs' }
			]
		});
		const first = screen.getByRole('treeitem', { name: 'agents' });
		first.focus();

		await fireEvent.keyDown(first, { key: 'r' });
		expect(screen.getByRole('treeitem', { name: 'runs' })).toHaveFocus();

		// A pause starts a fresh search; repeating one letter cycles through its rows.
		await new Promise((resolve) => setTimeout(resolve, 600));
		const runs = screen.getByRole('treeitem', { name: 'runs' });
		await fireEvent.keyDown(runs, { key: 'p' });
		expect(screen.getByRole('treeitem', { name: 'prompts' })).toHaveFocus();
		await fireEvent.keyDown(screen.getByRole('treeitem', { name: 'prompts' }), { key: 'p' });
		expect(screen.getByRole('treeitem', { name: 'playground' })).toHaveFocus();
	});

	test('draws one selection highlight that moves with the selection', async () => {
		render(Tree, { items, selected: 'notes' });
		const notes = screen.getByRole('treeitem', { name: 'Notes' });
		const projects = screen.getByRole('treeitem', { name: 'Projects' });
		expect(notes.querySelector('[data-slot="tree-highlight"]')).toBeInTheDocument();

		await fireEvent.click(projects);
		expect(document.querySelectorAll('[data-slot="tree-highlight"]')).toHaveLength(1);
		expect(projects.querySelector('[data-slot="tree-highlight"]')).toBeInTheDocument();
		expect(projects).toHaveAttribute('aria-selected', 'true');
	});

	test('hides a closed folder from the keyboard and assistive technology', async () => {
		render(Tree, { items, defaultExpanded: ['projects'] });
		const projects = screen.getByRole('treeitem', { name: /^Projects/ });
		const group = document.getElementById(projects.getAttribute('aria-owns')!)!;
		expect(group.inert).toBeFalsy();

		await fireEvent.click(projects);
		expect(projects).toHaveAttribute('aria-expanded', 'false');
		expect(group.inert).toBe(true);
		expect(group).toHaveAttribute('aria-hidden', 'true');
	});
});
