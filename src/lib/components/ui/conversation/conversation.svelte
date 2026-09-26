<script lang="ts">
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import { untrack, type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { TransitionConfig } from 'svelte/transition';
	import { ChatBubble } from '$lib/components/ui/chat-bubble';
	import {
		duration as durations,
		easeIn,
		easeOut,
		prefersReducedMotion
	} from '$lib/components/ui/motion';
	import { Thinking } from '$lib/components/ui/thinking';
	import { cn } from '$lib/utils.js';
	import { setConversationContext } from './context.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** Accessible name for the message log. */
		label?: string;
		/** Shows the typing bubble at the end of the thread while a reply is on its way. */
		typing?: boolean;
		/** What assistive technology hears while the typing bubble shows. */
		typingLabel?: string;
		/** The button that appears when a reply lands while you are reading further up. */
		jumpLabel?: string;
		/** Classes for the outer frame. Give it a height, or place it in a flex column. */
		class?: string;
		/** The outer frame. */
		ref?: HTMLDivElement | null;
		/** The scrolling message log. */
		viewport?: HTMLDivElement | null;
		/** The messages: ConversationMessage, or anything else a thread holds. */
		children?: Snippet;
	};

	let {
		label = 'Conversation',
		typing = false,
		typingLabel = 'Assistant is typing',
		jumpLabel = 'New message',
		class: className,
		ref = $bindable(null),
		viewport = $bindable(null),
		children,
		...restProps
	}: Props = $props();

	// Within this distance of the end still counts as reading the latest, so a
	// few pixels of drift never stop the thread from following along.
	const NEAR_BOTTOM = 64;

	let content = $state<HTMLDivElement | null>(null);
	let unseen = $state(false);
	// Decided before each update, while the old scroll position still says
	// whether the reader was following the thread.
	let pinned = true;
	let ready = false;
	let autoScrolling = false;
	/** Where the last scroll event left the log, to tell which way it moved. */
	let lastTop = 0;
	let autoTimer: ReturnType<typeof setTimeout> | undefined;

	function distanceFromEnd() {
		if (!viewport) return 0;
		return viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
	}

	/** Scrolls to the newest message and keeps following from there. */
	export function scrollToLatest(behavior: 'smooth' | 'instant' = 'smooth') {
		if (!viewport) return;
		pinned = true;
		unseen = false;
		const smooth = behavior === 'smooth' && !prefersReducedMotion();
		// Our own smooth scroll passes through positions far from the end; those
		// must not read as the reader scrolling away.
		autoScrolling = smooth;
		clearTimeout(autoTimer);
		lastTop = viewport.scrollTop;
		if (smooth) autoTimer = setTimeout(() => (autoScrolling = false), durations.deliberate * 2);
		viewport.scrollTo({ top: viewport.scrollHeight, behavior: smooth ? 'smooth' : 'instant' });
	}

	function onscroll() {
		const top = viewport?.scrollTop ?? 0;
		// Following the thread only ever scrolls down, so any move up is the
		// reader, even while a stream keeps restarting the smooth scroll.
		const up = top < lastTop - 1;
		lastTop = top;
		const near = distanceFromEnd() < NEAR_BOTTOM;
		if (near) {
			pinned = true;
			unseen = false;
		} else if (!autoScrolling || up) {
			pinned = false;
			autoScrolling = false;
			clearTimeout(autoTimer);
		}
	}

	function onscrollend() {
		autoScrolling = false;
		clearTimeout(autoTimer);
		onscroll();
	}

	// Reading older messages means a new one never yanks the thread down; it
	// offers a way there instead. Your own message is a deliberate act, so it
	// always scrolls into view, even from far up the thread.
	setConversationContext({
		arrived(role) {
			if (!ready) return;
			if (role === 'user') {
				pinned = true;
				unseen = false;
			} else if (!pinned) {
				unseen = true;
			}
		}
	});

	// Start at the end of the thread, then follow whatever grows there (new
	// messages, streaming text, the typing bubble) while the reader is pinned.
	$effect(() => {
		if (!viewport || !content) return;
		untrack(() => scrollToLatest('instant'));
		ready = true;
		if (typeof ResizeObserver === 'undefined') return;
		let height = content.offsetHeight;
		const observer = new ResizeObserver(() => {
			const next = content?.offsetHeight ?? 0;
			const grew = next > height;
			height = next;
			if (grew && pinned) scrollToLatest();
		});
		observer.observe(content);
		return () => observer.disconnect();
	});

	$effect(() => () => clearTimeout(autoTimer));

	/** The typing bubble grows out of the corner the reply will hang from. */
	function typingIn(_node: Element): TransitionConfig {
		if (prefersReducedMotion()) return { duration: durations.fast, css: (t) => `opacity: ${t}` };
		return {
			duration: durations.base,
			easing: easeOut,
			css: (t, u) => `opacity: ${t}; scale: ${1 - u * 0.05}`
		};
	}

	/**
	 * Fades out beneath the reply that takes its place, so the swap reads as
	 * the dots turning into words.
	 */
	function typingOut(node: Element): TransitionConfig {
		const element = node as HTMLElement;
		const top = element.offsetTop;
		element.style.position = 'absolute';
		element.style.margin = '0';
		element.style.top = `${top}px`;
		element.style.left = '0';
		element.style.right = '0';
		return { duration: durations.fast, easing: easeIn, css: (t) => `opacity: ${t}` };
	}
</script>

<div {...restProps} bind:this={ref} class={cn('relative flex min-h-0 flex-col', className)}>
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div
		bind:this={viewport}
		role="log"
		aria-label={label}
		tabindex="0"
		class="focus-visible:ring-ring min-h-0 flex-1 [scrollbar-width:thin] overflow-y-auto overscroll-contain rounded-[inherit] px-3 py-4 outline-none focus-visible:ring-2 focus-visible:ring-inset"
		{onscroll}
		{onscrollend}
	>
		<div bind:this={content} class="relative flex flex-col">
			{@render children?.()}
			{#if typing}
				<div
					class="mt-3 origin-bottom-left first:mt-0"
					data-conversation-typing
					in:typingIn
					out:typingOut
				>
					<ChatBubble role="assistant" animate={false} class="flex h-10 items-center">
						<Thinking variant="dots" label={typingLabel} class="[&>span:last-child]:sr-only" />
					</ChatBubble>
				</div>
			{/if}
		</div>
	</div>

	<button
		type="button"
		inert={!unseen}
		aria-hidden={!unseen}
		class={cn(
			'bg-card text-foreground focus-visible:ring-ring absolute bottom-3 left-1/2 flex h-8 -translate-x-1/2 touch-manipulation items-center gap-1.5 rounded-full pr-3 pl-2.5 text-xs font-medium shadow-md outline-none select-none focus-visible:ring-2 active:scale-[0.96]',
			'transition-[opacity,translate,scale] ease-out motion-reduce:transition-opacity',
			unseen
				? 'translate-y-0 opacity-100 duration-(--duration-base)'
				: 'translate-y-1 opacity-0 duration-(--duration-fast) ease-in motion-reduce:translate-y-0'
		)}
		onclick={() => scrollToLatest()}
	>
		<ArrowDown aria-hidden="true" class="size-3.5" />
		{jumpLabel}
	</button>
</div>
