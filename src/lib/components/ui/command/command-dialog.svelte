<script lang="ts">
	import { Command as CommandPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import XIcon from '@lucide/svelte/icons/x';
	import * as Dialog from '$lib/components/ui/dialog';
	import Command from './command.svelte';
	import { cn } from '$lib/utils.js';

	let {
		open = $bindable(false),
		value = $bindable(''),
		title = 'Command menu',
		description = 'Search for a command to run.',
		shortcut,
		class: className,
		children,
		...restProps
	}: WithoutChildrenOrChild<CommandPrimitive.RootProps> & {
		/** Whether the palette is showing. */
		open?: boolean;
		/** Accessible title, read when the palette opens. */
		title?: string;
		/** Accessible description, read after the title. */
		description?: string;
		/**
		 * A letter that toggles the palette with Command (macOS) or Control
		 * (elsewhere), such as `"k"`. The press is marked handled, so the
		 * browser's own binding for it stands aside.
		 */
		shortcut?: string;
		/** Classes for the command surface inside the dialog. */
		class?: string;
		/** `Command.Input`, `Command.List`, and the rest. */
		children: Snippet;
	} = $props();

	function toggleFromKeyboard(event: KeyboardEvent) {
		if (!shortcut || event.key.toLowerCase() !== shortcut.toLowerCase()) return;
		if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey || event.repeat) return;
		event.preventDefault();
		open = !open;
	}
</script>

<svelte:window onkeydown={toggleFromKeyboard} />

<Dialog.Root {open} onOpenChange={(o) => (open = o)}>
	<!-- Opened many times a day, so it barely animates: it arrives in a blink,
	     grows from its top edge where the eye already is, and leaves faster
	     still. Pinned near the top rather than centered, so the input stays put
	     while filtering resizes the list below it. -->
	<Dialog.Content
		class="top-[max(1rem,15vh)] max-h-[calc(100dvh-max(1rem,15vh)-1rem)] max-w-xl origin-top translate-y-0 overflow-hidden p-0 transition-[opacity,scale] duration-(--duration-fast) ease-out data-[starting-style]:opacity-0 data-[state=closed]:scale-100 data-[state=closed]:duration-(--duration-instant) data-[state=closed]:ease-in motion-safe:data-[starting-style]:scale-[0.98] motion-safe:data-[state=closed]:scale-[0.98]"
		closeButton={false}
	>
		<Dialog.Header class="sr-only">
			<Dialog.Title>{title}</Dialog.Title>
			<Dialog.Description>{description}</Dialog.Description>
		</Dialog.Header>
		<!-- The input stops short of the close button, so long searches never run under it. -->
		<Command
			bind:value
			class={cn('rounded-none [&_[data-command-input]]:pe-8', className)}
			{...restProps}
		>
			{@render children?.()}
		</Command>
		<!-- Close lives in the search row so it lines up with the input text -->
		<Dialog.Close
			class="text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring absolute end-3 top-2 z-20 inline-flex size-7 items-center justify-center rounded-lg transition-[scale,background-color] duration-(--duration-base) outline-none focus-visible:ring-2 active:scale-[0.96]"
		>
			<XIcon class="size-4" />
			<span class="sr-only">Close</span>
		</Dialog.Close>
	</Dialog.Content>
</Dialog.Root>
