<script lang="ts">
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Folder from '@lucide/svelte/icons/folder';
	import FolderOpen from '@lucide/svelte/icons/folder-open';
	import File from '@lucide/svelte/icons/file';
	import { cn } from '$lib/utils.js';
	import { getTreeContext, type TreeNode } from './context.svelte.js';
	import Self from './tree-item.svelte';

	let { node, depth }: { node: TreeNode; depth: number } = $props();

	const tree = getTreeContext();

	const hasChildren = $derived(!!node.children?.length);
	const expanded = $derived(tree.isExpanded(node.id));
	const selected = $derived(tree.selected === node.id);
	const Icon = $derived(node.icon ?? (hasChildren ? (expanded ? FolderOpen : Folder) : File));

	function onRowClick() {
		if (hasChildren) tree.setExpanded(node.id, !expanded);
		tree.select(node.id);
	}
</script>

<div
	role="treeitem"
	aria-selected={selected}
	aria-expanded={hasChildren ? expanded : undefined}
	tabindex={tree.focusedId === node.id ? 0 : -1}
	{@attach (el) => tree.registerEl(node.id, el as HTMLElement)}
	onclick={onRowClick}
	onfocus={() => tree.onFocus(node.id)}
	onkeydown={(e) => tree.onKeydown(e, node.id, hasChildren, depth)}
	class={cn(
		'flex h-9 cursor-pointer items-center gap-1.5 rounded-lg pr-2 outline-none transition-[background,box-shadow,color] duration-150 ease-out select-none',
		'hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
		selected
			? 'bg-[color:color-mix(in_oklab,var(--primary)_14%,transparent)] font-medium text-foreground'
			: 'text-foreground/90'
	)}
	style="padding-left: calc(0.5rem + {depth} * 1.125rem);"
>
	{#if hasChildren}
		<ChevronRight
			class={cn(
				'size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-out',
				expanded && 'rotate-90'
			)}
		/>
	{:else}
		<span class="size-4 shrink-0" aria-hidden="true"></span>
	{/if}
	<Icon
		class={cn('size-4 shrink-0', selected ? 'text-primary' : 'text-muted-foreground')}
		aria-hidden="true"
	/>
	<span class="truncate">{node.label}</span>
</div>

{#if hasChildren}
	<div
		role="group"
		class="grid transition-[grid-template-rows] duration-200 ease-out mizu-tree-group"
		class:mizu-tree-open={expanded}
		style="grid-template-rows: {expanded ? '1fr' : '0fr'};"
	>
		<div class="overflow-hidden">
			<div class="flex flex-col gap-0.5 pt-0.5">
				{#each node.children! as child (child.id)}
					<Self node={child} depth={depth + 1} />
				{/each}
			</div>
		</div>
	</div>
{/if}

<style>
	/* Reduced-motion safe: snap open/closed instead of animating the grid. */
	@media (prefers-reduced-motion: reduce) {
		.mizu-tree-group {
			transition: none;
		}
	}
</style>
