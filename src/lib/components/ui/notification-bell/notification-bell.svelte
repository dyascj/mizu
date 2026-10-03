<script lang="ts" module>
	export type BellNotification = {
		/** Stable identity, used to tell a new arrival from a re-render. */
		id: string;
		/** The line that says what happened. */
		title: string;
		/** When it happened, already formatted, such as "5m" or "Yesterday". */
		time?: string;
	};
</script>

<script lang="ts">
	import Bell from '@lucide/svelte/icons/bell';
	import { untrack, type ComponentProps, type Snippet } from 'svelte';
	import { flip } from 'svelte/animate';
	import type { Popover as PopoverPrimitive, WithoutChildrenOrChild } from 'bits-ui';
	import type { TransitionConfig } from 'svelte/transition';
	import {
		duration,
		easeIn,
		easeOut,
		pop,
		prefersReducedMotion,
		springs
	} from '$lib/components/ui/motion';
	import { NumberTicker } from '$lib/components/ui/number-ticker';
	import * as Popover from '$lib/components/ui/popover';
	import { cn } from '$lib/utils.js';

	type Props = Omit<WithoutChildrenOrChild<PopoverPrimitive.TriggerProps>, 'ref' | 'class'> & {
		/** Everything in the inbox, newest first. A new first item rings the bell. */
		notifications: BellNotification[];
		/**
		 * The newest notification the reader has seen: it and everything older
		 * count as read. Bindable. Closing the panel marks everything read.
		 */
		readId?: string;
		/** Whether the panel is open. Bindable. */
		open?: boolean;
		/** Called when the panel opens or closes. */
		onOpenChange?: (open: boolean) => void;
		/** The bell's name and the panel's heading. */
		label?: string;
		/** Counts above this show as "9+", which is all anyone reads anyway. */
		max?: number;
		/** Shown in the panel when there is nothing in the inbox. */
		empty?: string;
		/** Custom content for each row. Receives the notification and whether it is unread. */
		item?: Snippet<[notification: BellNotification, unread: boolean]>;
		/** Props for the panel, such as `align` or `onInteractOutside`. */
		contentProps?: Partial<ComponentProps<typeof Popover.Content>>;
		/** The bell button. */
		ref?: HTMLButtonElement | null;
		/** Classes for the bell button. */
		class?: string;
	};

	let {
		notifications,
		readId = $bindable(),
		open = $bindable(false),
		onOpenChange,
		label = 'Notifications',
		max = 9,
		empty = 'You are all caught up.',
		item,
		contentProps,
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	let icon = $state<HTMLSpanElement | null>(null);
	let announcement = $state('');
	let listHeight = $state(0);
	let ring: Animation | undefined;

	const marker = $derived(notifications.findIndex((n) => n.id === readId));
	const unread = $derived(marker === -1 ? notifications.length : marker);
	// Opening the panel is reading, so the badge leaves at once. The dots stay
	// until it closes, so the reader can still see which ones were new.
	const badge = $derived(open ? 0 : unread);

	function setOpen(next: boolean) {
		if (next === open) return;
		open = next;
		if (!next) readId = notifications[0]?.id ?? readId;
		onOpenChange?.(next);
	}

	/** Five swings that die away, hung from the top of the bell. */
	const swings = [0, 14, -12, 8, -5, 2, 0].map((deg) => ({ rotate: `${deg}deg` }));

	// Closing from outside, such as a parent that sets `open` to false after a
	// row is picked, reads the inbox just as a click away does.
	let wasOpen = untrack(() => open);
	$effect(() => {
		const now = open;
		if (wasOpen && !now) untrack(() => (readId = notifications[0]?.id ?? readId));
		wasOpen = now;
	});

	// Only an id the list has not held before is an arrival. Removing the newest
	// row brings an older one to the top, and that must not ring.
	let known = untrack(() => new Set(notifications.map((n) => n.id)));
	$effect(() => {
		const ids = notifications.map((n) => n.id);
		const first = notifications[0];
		const arrived = !!first && !known.has(first.id);
		known = new Set(ids);
		if (!arrived) return;
		untrack(() => {
			announcement = `New notification: ${first.title}`;
			if (!icon?.animate || prefersReducedMotion()) return;
			ring?.cancel();
			const easing = getComputedStyle(icon).getPropertyValue('--ease-in-out').trim();
			ring = icon.animate(swings, { duration: duration.deliberate, easing: easing || 'ease' });
		});
	});

	$effect(() => () => ring?.cancel());

	/** Clearing to zero is a soft shrink, quicker than the arrival and without bounce. */
	function shrink(_node: Element): TransitionConfig {
		if (prefersReducedMotion()) return { duration: duration.fast, css: (t) => `opacity: ${t}` };
		return {
			duration: duration.fast,
			easing: easeIn,
			css: (t) => `opacity: ${t}; scale: ${0.6 + 0.4 * t}`
		};
	}

	/** A new row drops into place from just above, resolving from a blur. */
	function arrive(_node: Element): TransitionConfig {
		if (prefersReducedMotion()) return { duration: duration.fast, css: (t) => `opacity: ${t}` };
		return {
			duration: springs.snappy.duration,
			easing: easeOut,
			css: (t, u) => `opacity: ${t}; translate: 0 ${u * -8}px; filter: blur(${u * 4}px)`
		};
	}

	function leave(_node: Element): TransitionConfig {
		return {
			duration: duration.fast,
			easing: easeIn,
			css: (t, u) => `opacity: ${t}; filter: blur(${u * 4}px)`
		};
	}
</script>

<Popover.Root {open} onOpenChange={setOpen}>
	<Popover.Trigger
		{...restProps}
		bind:ref
		aria-label={badge > 0 ? `${label}, ${unread} unread` : label}
		class={cn(
			'bg-secondary text-secondary-foreground hover:bg-control focus-visible:ring-ring focus-visible:ring-offset-background relative inline-grid size-10 shrink-0 touch-manipulation place-items-center rounded-full outline-none select-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
			'transition-[background-color,scale] duration-(--duration-fast) ease-out active:scale-[0.96] motion-reduce:transition-[background-color]',
			'data-[state=open]:bg-primary-muted data-[state=open]:text-primary',
			className
		)}
	>
		<!-- Swings from where a bell hangs, not from its middle. -->
		<span bind:this={icon} class="grid origin-[50%_10%]">
			<Bell aria-hidden="true" class="size-5" />
		</span>
		{#if badge > 0}
			<span
				aria-hidden="true"
				in:pop={{ scale: 0.6, spring: springs.bouncy }}
				out:shrink
				class="bg-primary text-primary-foreground absolute start-[calc(100%-1.125rem)] -top-1 flex h-5 min-w-5 origin-bottom-left items-center justify-center rounded-full px-1.5 text-xs leading-none font-semibold shadow-xs rtl:origin-bottom-right"
			>
				<NumberTicker value={Math.min(badge, max)} />{#if badge > max}+{/if}
			</span>
		{/if}
	</Popover.Trigger>
	<Popover.Content
		align="end"
		collisionPadding={16}
		{...contentProps}
		class={cn('w-80 p-2', contentProps?.class)}
		role="dialog"
		aria-label={label}
	>
		<p class="text-muted-foreground px-3 pt-2 pb-1.5 text-sm font-medium">{label}</p>
		<!-- Follows the list's height, so the bottom edge glides down when a row arrives. -->
		<div
			class="relative overflow-hidden transition-[height] duration-(--duration-spring-snappy) ease-(--ease-spring-snappy) motion-reduce:transition-none"
			style:height={listHeight ? `${listHeight}px` : undefined}
		>
			<div bind:offsetHeight={listHeight}>
				{#if notifications.length === 0}
					<p class="text-muted-foreground px-3 py-6 text-center text-sm">{empty}</p>
				{:else}
					<ul>
						{#each notifications as notification, i (notification.id)}
							{@const isUnread = i < unread}
							<li
								animate:flip={{ duration: springs.snappy.duration, easing: springs.snappy.easing }}
								in:arrive
								out:leave
								class="flex items-start gap-3 rounded-xl px-3 py-2.5"
							>
								{#if item}
									{@render item(notification, isUnread)}
								{:else}
									<span
										aria-hidden="true"
										class={cn(
											'bg-primary mt-1.5 size-2 shrink-0 rounded-full transition-opacity duration-(--duration-base) ease-out',
											!isUnread && 'opacity-0'
										)}
									></span>
									<span class="flex min-w-0 flex-1 flex-col">
										<span class="text-sm">
											{#if isUnread}<span class="sr-only">Unread:&nbsp;</span
												>{/if}{notification.title}
										</span>
										{#if notification.time}
											<span class="text-muted-foreground mt-0.5 text-xs">{notification.time}</span>
										{/if}
									</span>
								{/if}
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</div>
	</Popover.Content>
</Popover.Root>
<span class="sr-only" aria-live="polite">{announcement}</span>
