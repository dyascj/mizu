<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';
	import { setTreeContext, type TreeNode, type TreeState } from './context.svelte.js';
	import TreeItem from './tree-item.svelte';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		items: TreeNode[];
		selected?: string | undefined;
		expanded?: string[];
		defaultExpanded?: string[];
		onSelect?: (id: string) => void;
		class?: string;
		ref?: HTMLDivElement | null;
	};

	let {
		items,
		selected = $bindable(undefined),
		expanded = $bindable(undefined),
		defaultExpanded = [],
		onSelect,
		class: className,
		ref = $bindable(null),
		...rest
	}: Props = $props();

	// `expanded` is bindable but optional. When the consumer doesn't bind it, fall
	// back to the seed list so the tree stays self-managed.
	const expandedSet = $derived(new Set(expanded ?? defaultExpanded));

	// Flatten the tree into the rows that are currently visible, in DOM order, so
	// arrow-key navigation can walk a single linear list.
	type Flat = { id: string; depth: number; hasChildren: boolean };
	const visible = $derived.by(() => {
		const out: Flat[] = [];
		const walk = (nodes: TreeNode[], depth: number) => {
			for (const node of nodes) {
				const hasChildren = !!node.children?.length;
				out.push({ id: node.id, depth, hasChildren });
				if (hasChildren && expandedSet.has(node.id)) walk(node.children!, depth + 1);
			}
		};
		walk(items, 0);
		return out;
	});

	// Roving tabindex target. Defaults to the selected row, else the first row.
	let focusedId = $state<string | undefined>(undefined);
	const rovingId = $derived(
		focusedId && visible.some((v) => v.id === focusedId) ? focusedId : (selected ?? visible[0]?.id)
	);

	const els = new Map<string, HTMLElement>();

	function setExpanded(id: string, value: boolean) {
		const next = new Set(expandedSet);
		if (value) next.add(id);
		else next.delete(id);
		expanded = [...next];
	}

	function select(id: string) {
		selected = id;
		focusedId = id;
		onSelect?.(id);
	}

	function focusId(id: string) {
		focusedId = id;
		els.get(id)?.focus();
	}

	function onKeydown(event: KeyboardEvent, id: string, hasChildren: boolean, _depth: number) {
		const index = visible.findIndex((v) => v.id === id);
		if (index === -1) return;

		switch (event.key) {
			case 'ArrowDown': {
				event.preventDefault();
				const next = visible[index + 1];
				if (next) focusId(next.id);
				break;
			}
			case 'ArrowUp': {
				event.preventDefault();
				const prev = visible[index - 1];
				if (prev) focusId(prev.id);
				break;
			}
			case 'ArrowRight': {
				event.preventDefault();
				if (hasChildren && !expandedSet.has(id)) {
					setExpanded(id, true);
				} else if (hasChildren) {
					const next = visible[index + 1];
					if (next && next.depth > visible[index].depth) focusId(next.id);
				}
				break;
			}
			case 'ArrowLeft': {
				event.preventDefault();
				if (hasChildren && expandedSet.has(id)) {
					setExpanded(id, false);
				} else {
					// Move focus to the parent row (the nearest shallower row above).
					const depth = visible[index].depth;
					for (let i = index - 1; i >= 0; i--) {
						if (visible[i].depth < depth) {
							focusId(visible[i].id);
							break;
						}
					}
				}
				break;
			}
			case 'Home': {
				event.preventDefault();
				if (visible[0]) focusId(visible[0].id);
				break;
			}
			case 'End': {
				event.preventDefault();
				const lastRow = visible[visible.length - 1];
				if (lastRow) focusId(lastRow.id);
				break;
			}
			case 'Enter':
			case ' ': {
				event.preventDefault();
				select(id);
				break;
			}
		}
	}

	const treeState: TreeState = {
		get selected() {
			return selected;
		},
		isExpanded: (id) => expandedSet.has(id),
		setExpanded,
		select,
		get focusedId() {
			return rovingId;
		},
		registerEl: (id, el) => {
			els.set(id, el);
			return () => {
				if (els.get(id) === el) els.delete(id);
			};
		},
		onKeydown,
		onFocus: (id) => {
			focusedId = id;
		}
	};
	setTreeContext(treeState);
</script>

<div bind:this={ref} role="tree" class={cn('flex flex-col gap-0.5 text-sm', className)} {...rest}>
	{#each items as node (node.id)}
		<TreeItem {node} depth={0} />
	{/each}
</div>
