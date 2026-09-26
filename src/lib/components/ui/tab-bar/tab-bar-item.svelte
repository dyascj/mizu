<script lang="ts">
	import type { Component, Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';
	import { getTabBarContext } from './context.js';

	type Props = Omit<HTMLButtonAttributes & HTMLAnchorAttributes, 'children'> & {
		/** Visible text under the icon, and the item's accessible name. */
		label: string;
		/** A lucide icon or any component that accepts `class` and `strokeWidth`. */
		icon?: Component<{ class?: string; strokeWidth?: number }>;
		/** Marks the current destination: moves the indicator here and sets `aria-current="page"`. */
		active?: boolean;
		/** Render as a link instead of a button. */
		href?: string;
		/** Unread count shown on the icon. Zero or less hides it. */
		badge?: number;
		/** What the badge means, appended to the accessible name. Defaults to "{badge} unread". */
		badgeLabel?: string;
		class?: string;
		ref?: HTMLElement | null;
		/** Custom icon content, such as an avatar. Replaces `icon`. */
		children?: Snippet;
	};

	let {
		label,
		icon: Icon,
		active = false,
		href = undefined,
		badge = 0,
		badgeLabel,
		class: className,
		ref = $bindable(null),
		children,
		...rest
	}: Props = $props();

	const bar = getTabBarContext();

	let glyph = $state<HTMLElement | null>(null);

	const floating = $derived(bar.variant === 'floating');
	const hidden = $derived(bar.labels === 'hidden');
	const count = $derived(Math.max(0, Math.floor(badge)));
	// Only override the name when there is more to say than the label.
	const name = $derived(count ? `${label}, ${badgeLabel ?? `${count} unread`}` : undefined);

	// Floating bars highlight the whole item; docked bars highlight a pill
	// around the icon, the way native tab bars do.
	$effect(() => {
		const target = floating ? ref : glyph;
		if (active && target) return bar.activate(target);
	});

	const itemClass = $derived(
		cn(
			'group/tab relative flex w-full flex-col items-center justify-center gap-1 outline-none select-none',
			'transition-colors duration-(--duration-fast) ease-out',
			'focus-visible:ring-ring focus-visible:ring-2',
			active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
			floating ? 'rounded-full' : 'rounded-2xl',
			floating && (hidden ? 'size-11' : 'h-12 px-1'),
			!floating && (hidden ? 'h-12' : 'h-14'),
			// Before the indicator measures (server render, first frame), the
			// active item paints its own highlight in the same place.
			floating && active && !bar.measured && 'bg-primary-muted',
			className
		)
	);
</script>

{#snippet inner()}
	<span
		bind:this={glyph}
		aria-hidden="true"
		class={cn(
			'relative flex shrink-0 items-center justify-center rounded-full',
			'ease-spring-snappy transition-[scale] duration-(--duration-spring-snappy)',
			'group-active/tab:scale-[0.88] group-active/tab:duration-(--duration-instant) group-active/tab:ease-out',
			!floating && 'h-8 w-14',
			!floating && active && !bar.measured && 'bg-primary-muted'
		)}
	>
		{#if children}
			{@render children()}
		{:else if Icon}
			<Icon class="size-[1.375rem]" strokeWidth={active ? 2.25 : 1.75} />
		{/if}
		{#if count}
			<span
				class={cn(
					'bg-primary text-primary-foreground absolute -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[0.625rem] leading-none font-semibold tabular-nums shadow-xs',
					floating ? 'left-[calc(50%+0.375rem)]' : 'left-[calc(50%+0.5rem)]'
				)}
			>
				{count > 99 ? '99+' : count}
			</span>
		{/if}
	</span>
	<span
		class={hidden
			? 'sr-only'
			: 'max-w-full truncate text-[0.6875rem] leading-none font-medium tracking-tight'}
	>
		{label}
	</span>
{/snippet}

<li class={cn('flex', floating ? (hidden ? 'shrink-0' : 'w-16 min-w-11') : 'min-w-0 flex-1')}>
	{#if href}
		<a
			bind:this={ref}
			{href}
			aria-label={name}
			aria-current={active ? 'page' : undefined}
			class={itemClass}
			{...rest}
		>
			{@render inner()}
		</a>
	{:else}
		<button
			bind:this={ref}
			type="button"
			aria-label={name}
			aria-current={active ? 'page' : undefined}
			class={itemClass}
			{...rest}
		>
			{@render inner()}
		</button>
	{/if}
</li>
