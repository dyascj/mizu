<script lang="ts">
	import { Avatar as AvatarPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';
	import AvatarStatus from './avatar-status.svelte';
	import type { AvatarPresence } from './status.js';

	type Props = AvatarPrimitive.RootProps & {
		/**
		 * Adds a presence badge to the bottom corner that turns into the new
		 * shape when it changes: a dot for online, a moon for away, a stop sign
		 * for busy, and a ring for offline. The avatar is then wrapped in a
		 * frame that carries the badge.
		 */
		status?: AvatarPresence;
		/** Accessible name for the badge. Defaults to the status, such as "Away". */
		statusLabel?: string;
		/**
		 * Classes for the frame that carries the badge, when `status` is set.
		 * Utilities in `class` that place the avatar among its neighbours, such
		 * as margins, position, inset, z-index, display, and flex or grid item
		 * placement, move to the frame on their own; size and look stay on the
		 * avatar.
		 */
		frameClass?: string;
	};

	let {
		ref = $bindable(null),
		class: className,
		loadingStatus = $bindable('loading'),
		status,
		statusLabel,
		frameClass,
		children,
		...restProps
	}: Props = $props();

	// Utilities that place the box among its neighbours rather than style it.
	const placement =
		/^-?(m[trblxyse]?|inset(-[xy])?|top|right|bottom|left|start|end|z|order|col|row|self|justify-self|place-self|basis|grow|shrink|float|clear|translate(-[xyz])?|rotate)(-|$)|^(static|fixed|absolute|relative|sticky|hidden|block|inline|inline-block|flex|inline-flex|grid|inline-grid|contents|flex-1|flex-auto|flex-initial|flex-none)$/;

	/** With a badge, placement utilities go to the frame, so the whole unit moves together. */
	const classes = $derived.by(() => {
		if (!status) return { frame: '', avatar: className };
		const frame: string[] = [];
		const avatar: string[] = [];
		for (const token of cn(className).split(/\s+/).filter(Boolean)) {
			// The utility after any variants, such as `sm:` or `hover:`.
			const utility = (token.split(/:(?![^[]*\])/).pop() ?? token).replace(/^!/, '');
			(placement.test(utility) ? frame : avatar).push(token);
		}
		return { frame: frame.join(' '), avatar: avatar.join(' ') };
	});
</script>

{#snippet avatar()}
	<AvatarPrimitive.Root
		bind:ref
		bind:loadingStatus
		class={cn(
			'relative flex size-10 shrink-0 overflow-hidden rounded-full shadow-xs',
			classes.avatar
		)}
		{...restProps}
	>
		{@render children?.()}
	</AvatarPrimitive.Root>
{/snippet}

{#if status}
	<!-- Sized by the avatar inside, so the badge scales with it. -->
	<div
		data-slot="avatar-frame"
		class={cn('relative flex w-fit shrink-0', classes.frame, frameClass)}
	>
		{@render avatar()}
		<AvatarStatus
			{status}
			label={statusLabel}
			class="absolute -end-[5%] -bottom-[5%] size-[45%] min-h-3.5 min-w-3.5"
		/>
	</div>
{:else}
	{@render avatar()}
{/if}
