import { getContext, hasContext, setContext } from 'svelte';
import type { Component } from 'svelte';
import type { LucideProps } from '@lucide/svelte';

export type TreeNode = {
	id: string;
	label: string;
	/** Custom lucide icon; falls back to folder/file glyphs by node kind. */
	icon?: Component<LucideProps>;
	children?: TreeNode[];
};

export type TreeState = {
	/** Currently selected node id, if any. */
	readonly selected: string | undefined;
	/** Whether a node id is in the expanded set. */
	isExpanded: (id: string) => boolean;
	/** Expand, collapse, or toggle a node. */
	setExpanded: (id: string, value: boolean) => void;
	/** Select a node (and fire onSelect). */
	select: (id: string) => void;
	/** The id that currently holds the roving tabindex. */
	readonly focusedId: string | undefined;
	/** Register a row's element so keyboard nav can move focus to it; returns a teardown. */
	registerEl: (id: string, el: HTMLElement) => () => void;
	/** Keyboard handler shared by every row. */
	onKeydown: (event: KeyboardEvent, id: string, hasChildren: boolean, depth: number) => void;
	/** Make a row the roving-tabindex target on focus. */
	onFocus: (id: string) => void;
};

const TREE_KEY = Symbol('mizu-tree');

export function setTreeContext(state: TreeState) {
	setContext(TREE_KEY, state);
}

export function getTreeContext(): TreeState {
	if (!hasContext(TREE_KEY)) {
		throw new Error('A <Tree.Item> must be used within a <Tree> component.');
	}
	return getContext(TREE_KEY);
}
