<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { getSidebar } from './sidebar-context.svelte.js';
	import { cn } from '$lib/utils.js';

	type Props = {
		class?: string;
		href?: string;
		isActive?: boolean;
		/** Label shown as a tooltip when the rail is collapsed to icons. */
		tooltip?: string;
		ref?: HTMLElement | null;
		children?: Snippet;
	} & HTMLButtonAttributes &
		HTMLAnchorAttributes;

	let {
		class: className,
		href = undefined,
		isActive = false,
		tooltip = undefined,
		ref = $bindable(null),
		children,
		...rest
	}: Props = $props();

	const sidebar = getSidebar();

	const showTooltip = $derived(!!tooltip && !sidebar.isMobile && sidebar.state === 'collapsed');

	const buttonClass = $derived(
		cn(
			// Icon stays put; label fades out as the rail folds. The marker is a left
			// aqua bar that fades in when the item is active.
			'group/menu-button relative flex h-10 w-full items-center gap-3 overflow-hidden rounded-xl px-2.5 text-left text-sm font-medium text-foreground outline-none transition-[background-color,box-shadow,color] duration-150 ease-out hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
			'[&>svg]:size-5 [&>svg]:shrink-0',
			// Label text: hidden + faded when collapsed to the icon rail.
			'[&>span]:truncate [&>span]:transition-[opacity] [&>span]:duration-200 group-data-[state=collapsed]/sidebar:[&>span]:pointer-events-none group-data-[state=collapsed]/sidebar:[&>span]:opacity-0',
			isActive &&
				'bg-[color:color-mix(in_oklab,var(--primary)_14%,transparent)] text-foreground shadow-bevel before:absolute before:inset-y-2.5 before:left-0.5 before:w-1 before:rounded-full before:bg-primary',
			className
		)
	);
</script>

{#snippet content(extra: Record<string, unknown> = {})}
	{#if href}
		<a
			bind:this={ref}
			{href}
			data-slot="sidebar-menu-button"
			data-active={isActive}
			class={buttonClass}
			{...rest}
			{...extra}
		>
			{@render children?.()}
		</a>
	{:else}
		<button
			bind:this={ref}
			type="button"
			data-slot="sidebar-menu-button"
			data-active={isActive}
			class={buttonClass}
			{...rest}
			{...extra}
		>
			{@render children?.()}
		</button>
	{/if}
{/snippet}

{#if showTooltip}
	<Tooltip.Root>
		<Tooltip.Trigger>
			{#snippet child({ props })}
				{@render content(props)}
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content side="right">{tooltip}</Tooltip.Content>
	</Tooltip.Root>
{:else}
	{@render content()}
{/if}
