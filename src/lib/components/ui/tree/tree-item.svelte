<script lang="ts">
	import { untrack } from 'svelte';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Folder from '@lucide/svelte/icons/folder';
	import FolderOpen from '@lucide/svelte/icons/folder-open';
	import File from '@lucide/svelte/icons/file';
	import { prefersReducedMotion } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';
	import { getTreeContext, type TreeNode } from './context.svelte.js';
	import Self from './tree-item.svelte';

	let {
		node,
		depth
	}: {
		/** The node this row shows. */
		node: TreeNode;
		/** How deep the row sits, from 0 at the top level. */
		depth: number;
	} = $props();

	const tree = getTreeContext();
	const uid = $props.id();
	const groupId = `tree-group-${uid}`;

	const hasChildren = $derived(!!node.children?.length);
	const expanded = $derived(tree.isExpanded(node.id));
	const selected = $derived(tree.selected === node.id);
	const Icon = $derived(node.icon ?? (hasChildren ? (expanded ? FolderOpen : Folder) : File));

	/**
	 * Clipping is only needed while the rows move. A folder that has finished
	 * opening stops clipping, so the highlight can glide in from a row outside
	 * it without being cut off at its edge.
	 */
	let settledOpen = $state(untrack(() => tree.isExpanded(node.id)));
	$effect(() => {
		if (!expanded) settledOpen = false;
		// Reduced motion snaps the folder open, so there is no transition to wait for.
		else if (prefersReducedMotion()) settledOpen = true;
	});
	const clip = $derived(!(expanded && settledOpen));

	function onRowClick() {
		if (hasChildren) tree.setExpanded(node.id, !expanded);
		tree.select(node.id);
	}
</script>

<div
	role="treeitem"
	aria-selected={selected}
	aria-owns={hasChildren ? groupId : undefined}
	aria-expanded={hasChildren ? expanded : undefined}
	tabindex={tree.focusedId === node.id ? 0 : -1}
	{@attach (el) => tree.registerEl(node.id, el as HTMLElement)}
	onclick={onRowClick}
	onfocus={() => tree.onFocus(node.id)}
	onkeydown={(e) => tree.onKeydown(e, node.id, hasChildren, depth)}
	class={cn(
		'relative flex h-9 cursor-pointer items-center gap-1.5 rounded-lg pr-2 transition-[background,box-shadow,color] duration-(--duration-base) ease-out outline-none select-none',
		!selected && 'hover:bg-accent',
		'focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2',
		selected ? 'text-primary font-medium' : 'text-foreground/90'
	)}
	style="padding-left: calc(0.5rem + {depth} * 1.125rem);"
>
	{#if selected}
		<span
			aria-hidden="true"
			data-slot="tree-highlight"
			class="bg-primary-muted pointer-events-none absolute inset-0 -z-10 rounded-lg"
			{@attach (el) => tree.registerHighlight(el)}
		></span>
	{/if}
	{#if hasChildren}
		<ChevronRight
			class={cn(
				'text-muted-foreground relative size-4 shrink-0 transition-[rotate] duration-(--duration-base) ease-out motion-reduce:transition-none',
				expanded && 'rotate-90'
			)}
		/>
	{:else}
		<span class="size-4 shrink-0" aria-hidden="true"></span>
	{/if}
	<Icon
		class={cn('relative size-4 shrink-0', selected ? 'text-primary' : 'text-muted-foreground')}
		aria-hidden="true"
	/>
	<span class="relative truncate">{node.label}</span>
</div>

{#if hasChildren}
	<!-- Animating grid rows between 0fr and 1fr reaches the folder's real height
	     without measuring it. Only rows below the folder move; the folder row
	     itself never does. -->
	<div
		role="group"
		id={groupId}
		aria-hidden={!expanded}
		inert={!expanded}
		class={cn(
			'mizu-tree-group grid transition-[grid-template-rows] ease-out',
			expanded ? 'duration-(--duration-base)' : 'duration-(--duration-fast)'
		)}
		class:mizu-tree-open={expanded}
		style="grid-template-rows: {expanded ? '1fr' : '0fr'};"
		ontransitionend={(event) => {
			if (event.target === event.currentTarget && event.propertyName === 'grid-template-rows') {
				settledOpen = expanded;
			}
		}}
	>
		<!-- Rows fade in a beat behind the opening and leave at once, so text is
		     never seen squeezed by a closing folder. -->
		<div
			class={cn(
				'min-h-0 transition-[opacity,filter] motion-reduce:transition-opacity',
				clip ? 'overflow-hidden' : 'overflow-visible',
				expanded
					? 'blur-none delay-(--stagger) duration-(--duration-base) ease-out'
					: 'opacity-0 blur-[2px] duration-(--duration-instant) ease-in motion-reduce:blur-none'
			)}
		>
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
