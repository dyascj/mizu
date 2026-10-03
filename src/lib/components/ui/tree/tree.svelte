<script lang="ts">
	import { untrack } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import { prefersReducedMotion } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';
	import { setTreeContext, type TreeNode, type TreeState } from './context.svelte.js';
	import TreeItem from './tree-item.svelte';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** The nodes to show. Nodes with children are folders. */
		items: TreeNode[];
		/** The selected node's id. The highlight glides to each new selection. */
		selected?: string | undefined;
		/** Ids of open folders. Bind it to control them; leave it out to let the tree manage itself. */
		expanded?: string[];
		/** Folders open on first render when `expanded` is not bound. */
		defaultExpanded?: string[];
		/** Called with a node's id when it is selected by click, Enter, or Space. */
		onSelect?: (id: string) => void;
		/** Classes for the tree. */
		class?: string;
		/** The tree element. */
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
	const expandedSet = $derived(new SvelteSet(expanded ?? defaultExpanded));

	// Flatten the tree into the rows that are currently visible, in DOM order, so
	// arrow-key navigation can walk a single linear list.
	type Flat = { id: string; label: string; depth: number; hasChildren: boolean };
	const visible = $derived.by(() => {
		const out: Flat[] = [];
		const walk = (nodes: TreeNode[], depth: number) => {
			for (const node of nodes) {
				const hasChildren = !!node.children?.length;
				out.push({ id: node.id, label: node.label, depth, hasChildren });
				if (hasChildren && expandedSet.has(node.id)) walk(node.children!, depth + 1);
			}
		};
		walk(items, 0);
		return out;
	});

	// Roving tabindex target. Defaults to the selected row, else the first row.
	let focusedId = $state<string | undefined>(undefined);
	const rovingId = $derived(
		focusedId && visible.some((v) => v.id === focusedId)
			? focusedId
			: selected && visible.some((v) => v.id === selected)
				? selected
				: visible[0]?.id
	);

	const els = new SvelteMap<string, HTMLElement>();

	function setExpanded(id: string, value: boolean) {
		const next = new SvelteSet(expandedSet);
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

	// Typeahead: typed letters jump to the next visible row whose label starts
	// with them. Repeating one letter cycles through the rows that start with it.
	let typed = '';
	let typedTimer: ReturnType<typeof setTimeout> | undefined;
	/** Long enough to type "pa" at a normal pace; a letter a moment later starts over. */
	const TYPEAHEAD_RESET = 500;

	function typeahead(key: string, from: number) {
		clearTimeout(typedTimer);
		typedTimer = setTimeout(() => (typed = ''), TYPEAHEAD_RESET);
		const next = typed + key.toLowerCase();
		const repeat = [...next].every((char) => char === next[0]);
		typed = repeat ? next[0] : next;
		const start = repeat ? from + 1 : from;
		for (let step = 0; step < visible.length; step++) {
			const row = visible[(start + step) % visible.length];
			if (row.label.toLowerCase().startsWith(typed)) return focusId(row.id);
		}
	}

	$effect(() => () => clearTimeout(typedTimer));

	// The selection highlight lives inside the selected row, so it follows the
	// row through every unfold. It sits behind every row (the tree isolates its
	// own stacking), so gliding past other rows never covers their text. When the selection moves, the new highlight
	// starts where the old one sat and glides into place.
	let highlightEl: HTMLElement | null = null;
	let snapshot: DOMRect | null = null;

	$effect.pre(() => {
		void selected;
		untrack(() => {
			snapshot = highlightEl?.isConnected ? highlightEl.getBoundingClientRect() : null;
		});
	});

	function registerHighlight(el: HTMLElement) {
		const from = snapshot;
		snapshot = null;
		highlightEl = el;
		if (from && !prefersReducedMotion()) glide(el, from);
		return () => {
			if (highlightEl === el) highlightEl = null;
		};
	}

	function glide(el: HTMLElement, from: DOMRect) {
		const to = el.getBoundingClientRect();
		const dx = from.left - to.left;
		const dy = from.top - to.top;
		if (!dx && !dy) return;
		el.style.transition = 'none';
		el.style.translate = `${dx}px ${dy}px`;
		// Commit the starting point before heading home.
		void el.offsetWidth;
		// Every row spans the tree's width, so the glide is a pure translate and
		// nothing inside the highlight stretches.
		el.style.transition = 'translate var(--duration-spring-snappy) var(--ease-spring-snappy)';
		el.style.translate = '0 0';
		el.addEventListener(
			'transitionend',
			() => {
				el.style.removeProperty('transition');
				el.style.removeProperty('translate');
			},
			{ once: true }
		);
	}

	function onKeydown(event: KeyboardEvent, id: string, hasChildren: boolean, _depth: number) {
		const index = visible.findIndex((v) => v.id === id);
		if (index === -1) return;

		// Rows mirror in RTL, so the arrow that points toward the children opens.
		let key = event.key;
		if (
			(key === 'ArrowLeft' || key === 'ArrowRight') &&
			event.currentTarget instanceof Element &&
			getComputedStyle(event.currentTarget).direction === 'rtl'
		) {
			key = key === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft';
		}

		switch (key) {
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
			default: {
				if (event.key.length !== 1 || event.metaKey || event.ctrlKey || event.altKey) return;
				event.preventDefault();
				typeahead(event.key, index);
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
		},
		registerHighlight
	};
	setTreeContext(treeState);
</script>

<div
	bind:this={ref}
	role="tree"
	class={cn('isolate flex flex-col gap-0.5 text-sm', className)}
	{...rest}
>
	{#each items as node (node.id)}
		<TreeItem {node} depth={0} />
	{/each}
</div>
