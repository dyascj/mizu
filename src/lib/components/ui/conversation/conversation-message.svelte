<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { TransitionConfig } from 'svelte/transition';
	import { ChatBubble } from '$lib/components/ui/chat-bubble';
	import {
		duration as durations,
		easeOut,
		prefersReducedMotion,
		springs
	} from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';
	import { getConversationContext } from './context.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'role'> & {
		/** Who sent the message. */
		role: 'user' | 'assistant';
		/**
		 * Continues a run from the same sender: the gap above closes and the
		 * corner where the two bubbles meet tightens, so the run reads as one block.
		 */
		grouped?: boolean;
		/** Read before the message by assistive technology, such as "You" or the assistant's name. */
		author?: string;
		/** Classes for the bubble. */
		class?: string;
		/** The row element. */
		ref?: HTMLDivElement | null;
		/** The message. */
		children?: Snippet;
	};

	let {
		role,
		grouped = false,
		author,
		class: className,
		ref = $bindable(null),
		children,
		...restProps
	}: Props = $props();

	const conversation = getConversationContext();

	$effect(() => {
		conversation?.arrived(role);
	});

	/**
	 * Your message rises out of the composer it was typed into; a reply
	 * resolves from a soft blur where it hangs.
	 */
	function enter(_node: Element): TransitionConfig {
		if (prefersReducedMotion()) return { duration: durations.fast, css: (t) => `opacity: ${t}` };
		if (role === 'user') {
			const spring = springs.smooth;
			return {
				duration: spring.duration,
				css: (t) => {
					const u = 1 - spring.easing(t);
					return `opacity: ${easeOut(Math.min(1, t * 2))}; translate: 0 ${u * 16}px; scale: ${1 - u * 0.05}`;
				}
			};
		}
		return {
			duration: durations.base,
			easing: easeOut,
			css: (t, u) => `opacity: ${t}; scale: ${1 - u * 0.02}; filter: blur(${u * 4}px)`
		};
	}
</script>

<div
	{...restProps}
	bind:this={ref}
	data-role={role}
	class={cn(
		'flex first:mt-0',
		role === 'user' ? 'origin-bottom-right justify-end' : 'origin-bottom-left justify-start',
		grouped ? 'mt-0.5' : 'mt-3'
	)}
	in:enter
>
	<ChatBubble
		{role}
		animate={false}
		class={cn(
			'transition-[border-radius] duration-(--duration-base) ease-out',
			grouped && (role === 'user' ? 'rounded-tr-md' : 'rounded-tl-md'),
			className
		)}
	>
		<span class="sr-only">{author ?? (role === 'user' ? 'You' : 'Assistant')}:</span>
		{@render children?.()}
	</ChatBubble>
</div>
