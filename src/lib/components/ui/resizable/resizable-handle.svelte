<script lang="ts">
	import { PaneResizer, type PaneResizerProps } from 'paneforge';
	import GripVerticalIcon from '@lucide/svelte/icons/grip-vertical';
	import { cn } from '$lib/utils.js';

	type Props = PaneResizerProps & {
		withHandle?: boolean;
	};

	let { ref = $bindable(null), class: className, withHandle = false, ...rest }: Props = $props();
</script>

<PaneResizer
	bind:ref
	class={cn(
		// A thin aqua-lit seam: neutral at rest, blooms to the brand accent on
		// hover / keyboard focus / active drag. `group` lets the inner grip react
		// to the resizer's data-direction.
		'group bg-border relative flex w-px items-center justify-center transition-colors duration-150 ease-out outline-none',
		'after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2',
		'hover:bg-[color:color-mix(in_oklab,var(--primary)_55%,transparent)]',
		'focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-1',
		'data-[active=pointer]:bg-primary data-[active=keyboard]:bg-primary',
		// Vertical pane group → the seam runs horizontally.
		'data-[direction=vertical]:h-px data-[direction=vertical]:w-full',
		'data-[direction=vertical]:after:inset-x-0 data-[direction=vertical]:after:top-1/2 data-[direction=vertical]:after:left-0 data-[direction=vertical]:after:h-1 data-[direction=vertical]:after:w-full data-[direction=vertical]:after:translate-x-0 data-[direction=vertical]:after:-translate-y-1/2',
		className
	)}
	{...rest}
>
	{#if withHandle}
		<div
			class="bg-popover relative z-10 flex h-7 w-3.5 items-center justify-center overflow-hidden rounded-sm shadow-xs group-data-[direction=vertical]:h-3.5 group-data-[direction=vertical]:w-7"
		>
			<GripVerticalIcon
				class="text-muted-foreground relative z-10 size-3 group-data-[direction=vertical]:rotate-90"
			/>
		</div>
	{/if}
</PaneResizer>
