<script lang="ts">
	import { untrack, type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { SidebarState, setSidebar } from './sidebar-context.svelte.js';
	import { cn } from '$lib/utils.js';

	type Props = HTMLAttributes<HTMLDivElement> & {
		class?: string;
		/** Initial desktop expanded state. */
		open?: boolean;
		ref?: HTMLDivElement | null;
		children?: Snippet;
	};

	let { class: className, open = true, ref = $bindable(null), children, ...rest }: Props = $props();

	// `open` seeds the initial state only; reading it untracked makes that intent explicit.
	const sidebar = setSidebar(new SidebarState(untrack(() => open)));
</script>

<div
	bind:this={ref}
	data-slot="sidebar-wrapper"
	style="--sidebar-width: 16rem; --sidebar-width-icon: 3.5rem;"
	class={cn('group/sidebar-wrapper flex min-h-0 w-full', className)}
	{...rest}
>
	{@render children?.()}
</div>
