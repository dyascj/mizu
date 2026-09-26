<script lang="ts">
	import type { Snippet } from 'svelte';
	import { createAttachmentKey } from 'svelte/attachments';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';
	import { getTooltipGroup, type TooltipGroupEntry } from './tooltip-group.svelte';

	type TriggerProps = Record<string, unknown>;

	type Props = HTMLButtonAttributes & {
		/** What the shared bubble says for this trigger. Also describes it to assistive tech. */
		content: string | Snippet;
		/** A keyboard shortcut shown quietly after the label, such as `⌘B`. */
		shortcut?: string;
		/** Renders your own element instead of a button. Spread `props` onto it. */
		child?: Snippet<[{ props: TriggerProps }]>;
		/** The button's content. */
		children?: Snippet;
		/** The trigger element. */
		ref?: HTMLElement | null;
		/** Classes for the button. */
		class?: string;
	};

	let {
		content,
		shortcut,
		child,
		children,
		ref = $bindable(null),
		class: className,
		onpointerenter,
		onpointerleave,
		onpointerdown,
		onfocus,
		onblur,
		...restProps
	}: Props = $props();

	const group = getTooltipGroup();
	const id = $props.id();
	const describedBy = `${id}-tooltip`;

	// Kept current and reactive, so a label that changes while its tooltip is
	// showing, such as Copy turning into Copied, updates the bubble too.
	const entry = $state<TooltipGroupEntry>({ el: null, content: '' });
	$effect.pre(() => {
		entry.content = content;
		entry.shortcut = shortcut;
	});
	$effect(() => group.register(id, entry));

	const attach = createAttachmentKey();
	const anchor = (node: HTMLElement) => {
		entry.el = node;
		ref = node;
		return () => {
			if (entry.el === node) entry.el = null;
			if (ref === node) ref = null;
		};
	};

	const open = $derived(group.openId === id);

	const triggerProps = $derived({
		...restProps,
		'aria-describedby': describedBy,
		'data-state': open ? 'open' : 'closed',
		class: cn(className),
		[attach]: anchor,
		onpointerenter: (event: PointerEvent & { currentTarget: EventTarget & HTMLButtonElement }) => {
			onpointerenter?.(event);
			// Touch has no hover; a tap would flash the tooltip under the finger.
			if (event.pointerType !== 'touch') group.request(id, false);
		},
		onpointerleave: (event: PointerEvent & { currentTarget: EventTarget & HTMLButtonElement }) => {
			onpointerleave?.(event);
			if (event.pointerType !== 'touch') group.release(id);
		},
		onpointerdown: (event: PointerEvent & { currentTarget: EventTarget & HTMLButtonElement }) => {
			onpointerdown?.(event);
			// A press means they already know what it does, and the tooltip would
			// otherwise sit on top of whatever the press changed.
			group.dismiss(id);
		},
		onfocus: (event: FocusEvent & { currentTarget: EventTarget & HTMLButtonElement }) => {
			onfocus?.(event);
			// Keyboard users get it at once: there is no hover to wait out.
			if (matchesFocusVisible(event.currentTarget)) group.request(id, true);
		},
		onblur: (event: FocusEvent & { currentTarget: EventTarget & HTMLButtonElement }) => {
			onblur?.(event);
			group.release(id);
		}
	});

	function matchesFocusVisible(el: Element) {
		try {
			return el.matches(':focus-visible');
		} catch {
			return true;
		}
	}
</script>

{#if child}
	{@render child({ props: triggerProps })}
{:else}
	<button type="button" {...triggerProps}>{@render children?.()}</button>
{/if}
<span id={describedBy} role="tooltip" hidden>
	{#if typeof content === 'string'}{content}{:else}{@render content()}{/if}{#if shortcut}, {shortcut}{/if}
</span>
