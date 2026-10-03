<script lang="ts">
	import type { Component, Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';
	import { getTabBarContext } from './context.js';

	type Props = Omit<HTMLButtonAttributes & HTMLAnchorAttributes, 'children'> & {
		/** Visible text under the icon, and the item's accessible name. */
		label: string;
		/** A lucide icon or any component that accepts `class` and `strokeWidth`. */
		icon?: Component<{ class?: string; strokeWidth?: number; fill?: string }>;
		/**
		 * Floods the icon with a solid fill from its middle while active and drains
		 * it back when it is not. Suits closed outlines such as a house or a chat
		 * bubble; leave it off for line icons. Needs `icon`.
		 */
		fill?: boolean;
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
		fill = false,
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
	// Only the active item shows its label, beside the icon.
	const inline = $derived(bar.labels === 'active');
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
			'group/tab relative flex w-full items-center justify-center outline-none select-none',
			inline ? 'flex-row' : 'flex-col gap-1',
			'transition-colors duration-(--duration-fast) ease-out',
			'focus-visible:ring-ring focus-visible:ring-2',
			active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
			floating ? 'rounded-full' : 'rounded-2xl',
			floating && inline && 'h-11 px-3',
			floating && !inline && (hidden ? 'size-11' : 'h-12 px-1'),
			!floating && (hidden || inline ? 'h-12' : 'h-14'),
			// Before the indicator measures (server render, first frame), the
			// active item paints its own highlight in the same place.
			floating && active && !bar.measured && 'bg-primary-muted',
			className
		)
	);

	// The outline and its filled twin share one grid cell. The fill floods out
	// from the icon's middle as a clip-path transition, so a quick second tap
	// reverses it midway.
	const flood = $derived(
		cn(
			'col-start-1 row-start-1 size-[1.375rem] transition-[clip-path,opacity] motion-reduce:[clip-path:none]',
			active
				? '[clip-path:circle(75%_at_50%_55%)] opacity-100 duration-(--duration-base) ease-out'
				: '[clip-path:circle(0%_at_50%_55%)] opacity-0 duration-(--duration-fast) ease-in'
		)
	);
</script>

{#snippet icon()}
	{#if children}
		{@render children()}
	{:else if Icon && fill}
		<span class="grid">
			<Icon class="col-start-1 row-start-1 size-[1.375rem]" strokeWidth={1.75} />
			<Icon class={flood} fill="currentColor" strokeWidth={1.75} />
		</span>
	{:else if Icon}
		<Icon class="size-[1.375rem]" strokeWidth={active ? 2.25 : 1.75} />
	{/if}
	{#if count}
		<span
			class={cn(
				'bg-primary text-primary-foreground absolute -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[0.625rem] leading-none font-semibold tabular-nums shadow-xs',
				inline
					? 'start-[calc(100%-0.75rem)]'
					: floating
						? 'start-[calc(50%+0.375rem)]'
						: 'start-[calc(50%+0.5rem)]'
			)}
		>
			{count > 99 ? '99+' : count}
		</span>
	{/if}
{/snippet}

{#snippet stacked()}
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
		{@render icon()}
	</span>
	<span
		class={hidden
			? 'sr-only'
			: 'max-w-full truncate text-[0.6875rem] leading-none font-medium tracking-tight'}
	>
		{label}
	</span>
{/snippet}

{#snippet beside()}
	<span
		bind:this={glyph}
		class={cn(
			'relative flex shrink-0 items-center rounded-full',
			'ease-spring-snappy transition-[scale] duration-(--duration-spring-snappy)',
			'group-active/tab:scale-[0.96] group-active/tab:duration-(--duration-instant) group-active/tab:ease-out',
			!floating && 'h-8 px-4',
			!floating && active && !bar.measured && 'bg-primary-muted'
		)}
	>
		<span aria-hidden="true" class="relative flex shrink-0">{@render icon()}</span>
		<!-- The label's column opens on the same spring as the highlight, and the
		     text waits a beat so it fades into room that is opening rather than
		     being squeezed. Collapsed, it still names the item. -->
		<span
			class={cn(
				'ease-spring grid transition-[grid-template-columns] duration-(--duration-spring) motion-reduce:transition-none',
				active ? 'grid-cols-[1fr]' : 'grid-cols-[0fr]'
			)}
		>
			<span class="min-w-0 overflow-hidden">
				<span
					class={cn(
						'block ps-2 text-sm leading-none font-medium tracking-tight whitespace-nowrap transition-[opacity,filter] motion-reduce:blur-none',
						active
							? 'opacity-100 blur-none delay-(--stagger) duration-(--duration-base) ease-out'
							: 'opacity-0 blur-xs duration-(--duration-instant) ease-in'
					)}
				>
					{label}
				</span>
			</span>
		</span>
	</span>
{/snippet}

<li
	class={cn(
		'flex',
		floating
			? hidden || inline
				? 'shrink-0'
				: 'w-16 min-w-11'
			: // With labels beside the icons, items take their own width and the
				// row's spacing absorbs the active one widening.
				inline
				? 'shrink-0'
				: 'min-w-0 flex-1'
	)}
>
	{#if href}
		<a
			bind:this={ref}
			{href}
			aria-label={name}
			aria-current={active ? 'page' : undefined}
			class={itemClass}
			{...rest}
		>
			{@render (inline ? beside : stacked)()}
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
			{@render (inline ? beside : stacked)()}
		</button>
	{/if}
</li>
