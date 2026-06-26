<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
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
	tabindex={-1}
	aria-label="Toggle sidebar"
	title="Toggle sidebar"
	data-slot="sidebar-rail"
	onclick={(e) => {
		onclick?.(e);
		sidebar.toggle();
	}}
	class={cn(
		'absolute inset-y-0 right-0 hidden w-3 translate-x-1/2 cursor-pointer outline-none transition-[background-color] duration-150 ease-out after:absolute after:inset-y-0 after:left-1/2 after:w-px after:-translate-x-1/2 after:bg-transparent hover:after:bg-[color:color-mix(in_oklab,var(--primary)_40%,transparent)] focus-visible:ring-2 focus-visible:ring-ring sm:flex',
		className
	)}
	{...rest}
></button>
