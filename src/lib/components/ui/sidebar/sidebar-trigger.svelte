<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import PanelLeftIcon from '@lucide/svelte/icons/panel-left';
	import { getSidebar } from './sidebar-context.svelte.js';
	import { cn } from '$lib/utils.js';

	type Props = HTMLButtonAttributes & {
		class?: string;
		ref?: HTMLButtonElement | null;
	};

	let { class: className, ref = $bindable(null), onclick, ...rest }: Props = $props();

	const sidebar = getSidebar();
</script>

<button
	bind:this={ref}
	type="button"
	data-slot="sidebar-trigger"
	aria-label="Toggle sidebar"
	onclick={(e) => {
		onclick?.(e);
		sidebar.toggle();
	}}
	class={cn(
		'inline-flex size-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground outline-none transition-[scale,background-color,color] duration-150 ease-out hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.96]',
		className
	)}
	{...rest}
>
	<PanelLeftIcon class="size-5" />
	<span class="sr-only">Toggle sidebar</span>
</button>
