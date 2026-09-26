<script lang="ts">
	import { Accordion as AccordionPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithoutChildrenOrChild<AccordionPrimitive.ContentProps> & {
		class?: string;
		children: Snippet;
	} = $props();

	/**
	 * Whether this item has changed since it first rendered. An answer that is
	 * open on arrival is simply there; only a reader's click unfolds it.
	 */
	let toggled = $state(false);
	let initial: boolean | undefined;

	function track(open: boolean) {
		if (initial === undefined) initial = open;
		else if (open !== initial) toggled = true;
	}
</script>

<AccordionPrimitive.Content bind:ref {...restProps}>
	{#snippet child({ props, open })}
		<div
			{...props}
			{@attach () => track(open)}
			class="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm"
		>
			<!-- The answer is a flap folded up under its question. It swings down on
			     a hinge along the question's bottom edge while the row parts, so the
			     motion says where the text came from. -->
			<div class="mizu-accordion-flap" data-flap={toggled ? '' : undefined}>
				<div class={cn('text-muted-foreground pb-4', className)}>
					{@render children?.()}
				</div>
			</div>
		</div>
	{/snippet}
</AccordionPrimitive.Content>

<style>
	.mizu-accordion-flap {
		transform-origin: top;
	}

	/* Unfolding falls fast and settles flat. Text nearest the hinge stays veiled
	   until the flap lies down, so the answer reads as unfolding out of the
	   question rather than sliding in. */
	:global([data-state='open']) > .mizu-accordion-flap[data-flap] {
		animation:
			mizu-accordion-unfold var(--duration-slow) var(--ease-out) both,
			mizu-accordion-crease var(--duration-slow) var(--ease-out) both,
			fade-in var(--duration-base) var(--ease-out) both;
	}

	/* Folding back goes only partway and fades out quicker than the row closes,
	   so the text is gone before the row finishes shutting and is never seen
	   being clipped. */
	:global([data-state='closed']) > .mizu-accordion-flap {
		animation:
			mizu-accordion-fold var(--duration-instant) var(--ease-in) both,
			fade-out var(--duration-instant) var(--ease-in) both;
	}

	@keyframes mizu-accordion-unfold {
		from {
			transform: perspective(40rem) rotateX(-72deg);
		}
	}

	@keyframes mizu-accordion-fold {
		to {
			transform: perspective(40rem) rotateX(-40deg);
		}
	}

	/* A mask twice the flap's height slides up: the top half veils the text
	   near the hinge, the bottom half shows everything. */
	@keyframes mizu-accordion-crease {
		from {
			mask-image: linear-gradient(to bottom, transparent, black 40%);
			mask-size: 100% 200%;
			mask-position: 0 0;
		}
		to {
			mask-image: linear-gradient(to bottom, transparent, black 40%);
			mask-size: 100% 200%;
			mask-position: 0 100%;
		}
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
	}

	@keyframes fade-out {
		to {
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		:global([data-state='open']) > .mizu-accordion-flap[data-flap] {
			animation: fade-in var(--duration-fast) var(--ease-out) both;
		}
		:global([data-state='closed']) > .mizu-accordion-flap {
			animation: fade-out var(--duration-fast) var(--ease-in) both;
		}
	}
</style>
