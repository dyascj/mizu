<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import * as Sheet from '$lib/components/ui/sheet';
	import { getSidebar } from './sidebar-context.svelte.js';
	import { cn } from '$lib/utils.js';

	type Props = HTMLAttributes<HTMLElement> & {
		class?: string;
		/**
		 * How the sidebar folds on desktop:
		 * - `icon` collapses to a slim icon rail (default)
		 * - `offcanvas` slides fully off-screen
		 * - `none` stays fixed at full width
		 */
		collapsible?: 'icon' | 'offcanvas' | 'none';
		ref?: HTMLElement | null;
		children?: Snippet;
	};

	let {
		class: className,
		collapsible = 'icon',
		ref = $bindable(null),
		children,
		...rest
	}: Props = $props();

	const sidebar = getSidebar();

	const surface = 'bg-secondary/50 text-foreground dark:bg-card';
</script>

{#if sidebar.isMobile}
	<Sheet.Root open={sidebar.openMobile} onOpenChange={(v) => sidebar.setOpenMobile(v)}>
		<Sheet.Content
			side="left"
			class="w-64 max-w-[85vw] gap-0 p-0"
			data-slot="sidebar"
			data-mobile="true"
		>
			<div class="flex h-full w-full flex-col">
				{@render children?.()}
			</div>
		</Sheet.Content>
	</Sheet.Root>
{:else}
	<aside
		bind:this={ref}
		data-slot="sidebar"
		data-state={sidebar.state}
		data-collapsible={collapsible}
		class={cn(
			'group/sidebar relative z-10 flex h-full shrink-0 flex-col',
			surface,
			'transition-[width] duration-200 ease-out',
			collapsible === 'none'
				? 'w-[var(--sidebar-width)]'
				: collapsible === 'offcanvas'
					? 'w-[var(--sidebar-width)] data-[state=collapsed]:w-0 data-[state=collapsed]:overflow-hidden data-[state=collapsed]:border-r-0'
					: 'w-[var(--sidebar-width)] data-[state=collapsed]:w-[var(--sidebar-width-icon)]',
			className
		)}
		{...rest}
	>
		{@render children?.()}
	</aside>
{/if}
