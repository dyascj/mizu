<script lang="ts">
	import { Popover as PopoverPrimitive } from 'bits-ui';
	import Check from '@lucide/svelte/icons/check';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import type { Snippet } from 'svelte';
	import * as Popover from '$lib/components/ui/popover';
	import { duration as durations } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type TriggerProps = Omit<
		PopoverPrimitive.TriggerProps,
		'children' | 'child' | 'onclick' | 'title' | 'ref' | 'disabled'
	>;

	type Props = TriggerProps & {
		/** The question the popover asks, such as "Delete this chat?". */
		title: string;
		/** A line under the title that says what will happen. */
		description?: string;
		/** Label of the button that opens the popover and of the button that confirms. */
		confirmLabel?: string;
		/** Label of the button that backs out. */
		cancelLabel?: string;
		/**
		 * Words the trigger turns into after confirming, beside a check, such as
		 * "Deleted". Leave it out to keep the trigger unchanged.
		 */
		doneLabel?: string;
		/** Announced to screen readers after confirming. Defaults to `doneLabel`. */
		announcement?: string;
		/** Called once when the action is confirmed. */
		onConfirm: () => void;
		/** Destructive actions tint red; `primary` suits actions that are only consequential. */
		variant?: 'destructive' | 'primary';
		/** How long the trigger shows the done state before it can be used again, in milliseconds. */
		resetAfter?: number;
		/** Which side of the trigger the popover opens on. */
		side?: 'top' | 'bottom';
		/** How the popover lines up with the trigger. */
		align?: 'start' | 'center' | 'end';
		/** Whether the popover is showing. */
		open?: boolean;
		/** Blocks the trigger. */
		disabled?: boolean;
		/** The trigger element. */
		ref?: HTMLButtonElement | null;
		/** Classes for the trigger. */
		class?: string;
		/** Classes for the popover panel. */
		contentClass?: string;
		/** Replaces the trigger's icon and label. */
		children?: Snippet;
	};

	let {
		title,
		description,
		confirmLabel = 'Delete',
		cancelLabel = 'Cancel',
		doneLabel,
		announcement,
		onConfirm,
		variant = 'destructive',
		resetAfter = durations.ambient,
		side = 'bottom',
		align = 'center',
		open = $bindable(false),
		disabled = false,
		ref = $bindable(null),
		class: className,
		contentClass,
		children,
		...restProps
	}: Props = $props();

	const uid = $props.id();
	let done = $state(false);
	let cancelButton = $state<HTMLButtonElement | null>(null);
	let resetTimer: ReturnType<typeof setTimeout> | undefined;

	const tones = {
		destructive: {
			trigger: 'bg-destructive/10 text-destructive hover:bg-destructive/15',
			confirm: 'bg-destructive text-destructive-foreground hover:opacity-90'
		},
		primary: {
			trigger: 'bg-secondary text-secondary-foreground hover:bg-muted',
			confirm: 'bg-primary text-primary-foreground hover:bg-primary-hover'
		}
	};

	function confirm() {
		open = false;
		onConfirm();
		if (!doneLabel && !announcement) return;
		done = true;
		clearTimeout(resetTimer);
		resetTimer = setTimeout(() => (done = false), resetAfter);
	}

	$effect(() => () => clearTimeout(resetTimer));

	// Arriving layers resolve out of a blur on a spring; leaving layers drop
	// away faster. Reduced motion keeps the crossfade and drops scale and blur.
	const shown =
		'scale-100 opacity-100 blur-none [transition:scale_var(--duration-spring-snappy)_var(--ease-spring-snappy),opacity_var(--duration-base)_var(--ease-out),filter_var(--duration-base)_var(--ease-out)]';
	const hidden =
		'scale-25 opacity-0 blur-[4px] transition-[scale,opacity,filter] duration-(--duration-fast) ease-in motion-reduce:scale-100 motion-reduce:blur-none';
</script>

{#snippet face(visible: boolean, isDone: boolean)}
	<span
		aria-hidden={visible ? undefined : 'true'}
		class="col-start-1 row-start-1 inline-flex items-center justify-center gap-2"
	>
		{#if isDone}
			<Check class={cn('size-4 shrink-0', visible ? shown : hidden)} />
			<span class={visible ? shown : hidden}>{doneLabel}</span>
		{:else if children}
			<span class={cn('inline-flex items-center gap-2', visible ? shown : hidden)}>
				{@render children()}
			</span>
		{:else}
			<Trash2 class={cn('size-4 shrink-0', visible ? shown : hidden)} />
			<span class={visible ? shown : hidden}>{confirmLabel}</span>
		{/if}
	</span>
{/snippet}

<PopoverPrimitive.Root bind:open>
	<Popover.Trigger
		bind:ref
		{...restProps}
		disabled={disabled || undefined}
		aria-disabled={done && doneLabel ? 'true' : undefined}
		data-done={done && doneLabel ? '' : undefined}
		onclick={(event) => {
			// The done state holds still until it resets; a click then is a no-op.
			if (done && doneLabel) event.preventDefault();
		}}
		onkeydown={(event) => {
			restProps.onkeydown?.(event);
			// Enter and Space open the popover on keydown, before any click, and
			// focus lands back here after confirming, so they need the same hold.
			if (done && doneLabel && (event.key === 'Enter' || event.key === ' ')) {
				event.preventDefault();
			}
		}}
		class={cn(
			'focus-visible:ring-ring focus-visible:ring-offset-background inline-flex h-10 max-w-full shrink-0 touch-manipulation items-center justify-center rounded-full px-4 text-sm font-medium whitespace-nowrap transition-[background-color,color,scale] duration-(--duration-fast) ease-out outline-none select-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50 data-[done]:active:scale-100 motion-reduce:transition-colors [&_svg]:size-4',
			done && doneLabel ? 'bg-secondary text-foreground' : tones[variant].trigger,
			className
		)}
	>
		<!-- Both faces share one cell, so the pill keeps the wider width and
		     never shifts when it turns into its done state. -->
		<span class="grid">
			{@render face(!(done && doneLabel), false)}
			{#if doneLabel}
				{@render face(done, true)}
			{/if}
		</span>
	</Popover.Trigger>
	<!-- Grows out of the caret's tip, so it reads as coming from the button.
	     Opens on the house curve and leaves faster. -->
	<Popover.Content
		{side}
		{align}
		sideOffset={6}
		collisionPadding={8}
		role="alertdialog"
		aria-labelledby="{uid}-title"
		aria-describedby={description ? `${uid}-description` : undefined}
		onOpenAutoFocus={(event) => {
			// Cancel is the safe default: an Enter pressed out of habit keeps things as they are.
			event.preventDefault();
			cancelButton?.focus();
		}}
		class={cn(
			'w-72 origin-(--bits-popover-content-transform-origin) rounded-2xl p-3 transition-[opacity,scale] duration-(--duration-base) ease-out data-[starting-style]:opacity-0 data-[state=closed]:pointer-events-none data-[state=closed]:scale-100 data-[state=closed]:duration-(--duration-fast) data-[state=closed]:ease-in motion-safe:data-[starting-style]:scale-[0.96] motion-safe:data-[state=closed]:scale-[0.96]',
			contentClass
		)}
	>
		<PopoverPrimitive.Arrow
			width={14}
			height={7}
			class="text-popover drop-shadow-[0_1px_0_var(--border)]"
		/>
		<div class="px-1.5 pt-1.5 pb-3">
			<p id="{uid}-title" class="font-semibold tracking-tight">{title}</p>
			{#if description}
				<p id="{uid}-description" class="text-muted-foreground mt-1 text-sm">{description}</p>
			{/if}
		</div>
		<div class="flex gap-2">
			<Popover.Close
				bind:ref={cancelButton}
				class="bg-secondary text-secondary-foreground hover:bg-muted focus-visible:ring-ring focus-visible:ring-offset-popover h-9 flex-1 touch-manipulation rounded-full text-sm font-medium transition-[background-color,scale] duration-(--duration-fast) ease-out outline-none select-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.96] motion-reduce:transition-colors"
			>
				{cancelLabel}
			</Popover.Close>
			<button
				type="button"
				onclick={confirm}
				class={cn(
					'focus-visible:ring-ring focus-visible:ring-offset-popover h-9 flex-1 touch-manipulation rounded-full text-sm font-medium transition-[background-color,opacity,scale] duration-(--duration-fast) ease-out outline-none select-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.96] motion-reduce:transition-[background-color,opacity]',
					tones[variant].confirm
				)}
			>
				{confirmLabel}
			</button>
		</div>
	</Popover.Content>
</PopoverPrimitive.Root>
<span class="sr-only" aria-live="polite">{done ? (announcement ?? doneLabel) : ''}</span>
