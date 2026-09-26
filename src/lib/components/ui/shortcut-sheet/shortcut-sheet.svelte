<script lang="ts">
	import Search from '@lucide/svelte/icons/search';
	import type { Snippet } from 'svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import {
		Kbd,
		isApplePlatform,
		keyLabel,
		shortcutMatches,
		shortcutSpoken
	} from '$lib/components/ui/kbd';
	import { duration } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';
	import type { Shortcut } from './types.js';

	type Props = {
		/** Every shortcut to list, in display order. Groups appear in the order they first occur. */
		shortcuts: Shortcut[];
		/** Whether the sheet is showing. */
		open?: boolean;
		/** Called when the sheet opens or closes. */
		onOpenChange?: (open: boolean) => void;
		/**
		 * The key that opens the sheet from anywhere on the page, except while
		 * typing in a field. Pressed again, it closes the sheet. `null` turns
		 * the listener off.
		 */
		hotkey?: string | null;
		/**
		 * Called when a listed shortcut is pressed while the sheet is open, after
		 * its row lights up. Plain keys are left to the search field while it
		 * has focus; shortcuts with `Mod` still work from there.
		 */
		onPress?: (shortcut: Shortcut) => void;
		/** The sheet's heading. */
		title?: string;
		/** Renders the pill button that opens the sheet. Turn it off to open the sheet only by key or `open`. */
		trigger?: boolean;
		/** The trigger button. */
		ref?: HTMLButtonElement | null;
		/** Classes for the trigger button. */
		class?: string;
		/** The trigger's label. Defaults to the title. */
		children?: Snippet;
	};

	let {
		shortcuts,
		open = $bindable(false),
		onOpenChange,
		hotkey = '?',
		onPress,
		title = 'Keyboard shortcuts',
		trigger = true,
		ref = $bindable(null),
		class: className,
		children
	}: Props = $props();

	const uid = $props.id();

	let mac = $state(false);
	let query = $state('');
	/** The row lit by the last shortcut pressed. */
	let lit = $state<string | null>(null);
	let litTimer: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		mac = isApplePlatform();
		return () => clearTimeout(litTimer);
	});

	const results = $derived.by(() => {
		const needle = query.trim().toLowerCase();
		const found = shortcuts.filter(
			(shortcut) =>
				!needle ||
				shortcut.label.toLowerCase().includes(needle) ||
				shortcut.group.toLowerCase().includes(needle)
		);
		const groups = [...new Set(found.map((shortcut) => shortcut.group))];
		return {
			found,
			groups: groups.map((group) => ({
				group,
				items: found.filter((shortcut) => shortcut.group === group)
			}))
		};
	});

	function setOpen(value: boolean) {
		if (value === open) return;
		if (value) {
			// Every visit starts from the full list with nothing lit.
			query = '';
			lit = null;
		}
		open = value;
		onOpenChange?.(value);
	}

	function isEditable(target: EventTarget | null) {
		return (
			target instanceof HTMLElement &&
			(target.isContentEditable ||
				target.closest('input, textarea, select, [contenteditable]') !== null)
		);
	}

	function isHotkey(event: KeyboardEvent) {
		return (
			!!hotkey &&
			event.key === hotkey &&
			!event.metaKey &&
			!event.ctrlKey &&
			!event.altKey &&
			!event.repeat
		);
	}

	// Closed: the hotkey opens the sheet from anywhere a reader isn't typing.
	function onWindowKeydown(event: KeyboardEvent) {
		if (open || event.defaultPrevented || !isHotkey(event) || isEditable(event.target)) return;
		// Inert copies of the page, such as a preview behind a modal, stay quiet.
		if (ref?.closest('[inert]')) return;
		event.preventDefault();
		setOpen(true);
	}

	// Open: the hotkey closes it, and any listed shortcut lights its row.
	function onDocumentKeydown(event: KeyboardEvent) {
		if (!open || event.key === 'Escape') return;
		const typing = isEditable(event.target);
		if (!typing && isHotkey(event)) {
			event.preventDefault();
			setOpen(false);
			return;
		}
		const hit = results.found.find((shortcut) => shortcutMatches(shortcut.keys, event, mac));
		if (!hit) return;
		// Plain keys belong to the search field while it has focus.
		if (typing && !hit.keys.some((key) => key.toLowerCase() === 'mod')) return;
		// Undo and redo keep working inside the field.
		if (!(typing && /^z$/i.test(event.key))) event.preventDefault();
		light(hit);
		onPress?.(hit);
	}

	function light(shortcut: Shortcut) {
		lit = shortcut.id;
		clearTimeout(litTimer);
		litTimer = setTimeout(() => (lit = null), duration.deliberate);
		document.getElementById(`${uid}-${shortcut.id}`)?.scrollIntoView?.({ block: 'nearest' });
	}

	const count = $derived(results.found.length);
</script>

<svelte:window onkeydown={onWindowKeydown} />
<svelte:document onkeydown={onDocumentKeydown} />

<Dialog.Root {open} onOpenChange={setOpen}>
	{#if trigger}
		<Dialog.Trigger
			bind:ref
			aria-keyshortcuts={hotkey ?? undefined}
			class={cn(
				'bg-secondary text-secondary-foreground hover:bg-muted focus-visible:ring-ring focus-visible:ring-offset-background inline-flex h-10 max-w-full shrink-0 touch-manipulation items-center gap-2.5 rounded-full pr-2.5 pl-4 text-sm font-medium whitespace-nowrap transition-[background-color,scale] duration-(--duration-fast) ease-out outline-none select-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.96] motion-reduce:transition-[background-color]',
				className
			)}
		>
			{#if children}
				{@render children()}
			{:else}
				{title}
			{/if}
			{#if hotkey}
				<Kbd match={hotkey} aria-hidden="true" class="bg-background">{hotkey}</Kbd>
			{/if}
		</Dialog.Trigger>
	{/if}
	<Dialog.Content
		class={cn(
			'max-w-[32.5rem] gap-0 overflow-hidden p-0',
			// A power-user surface opened and shut in quick succession: it lands
			// rather than pops, and leaves faster than it came.
			'transition-[opacity,scale] duration-(--duration-fast) ease-out data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0 data-[state=closed]:scale-[0.98] data-[state=closed]:duration-(--duration-instant) data-[state=closed]:ease-in motion-reduce:scale-100'
		)}
	>
		<div class="flex flex-col">
			<div class="flex h-14 shrink-0 items-center pr-14 pl-5">
				<Dialog.Title class="truncate text-base tracking-tight">{title}</Dialog.Title>
				<Dialog.Description class="sr-only">
					Press a listed shortcut to see its row light up.
				</Dialog.Description>
			</div>

			<div class="relative mx-3 shrink-0">
				<Search
					class="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
					aria-hidden="true"
				/>
				<Input
					type="search"
					bind:value={query}
					aria-label="Search shortcuts"
					aria-controls="{uid}-list"
					placeholder="Search shortcuts"
					spellcheck={false}
					autocomplete="off"
					class="pl-10 [&::-webkit-search-cancel-button]:hidden"
				/>
			</div>

			<p class="sr-only" aria-live="polite">
				{query.trim() ? `${count} ${count === 1 ? 'shortcut' : 'shortcuts'}` : ''}
			</p>

			<!-- A fixed height, so filtering never resizes the sheet or moves the field.
			     Focusable, so the list can be scrolled from the keyboard. -->
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<div
				id="{uid}-list"
				role="region"
				aria-label="Shortcuts"
				tabindex="0"
				class="focus-visible:ring-ring mt-2 h-[min(22rem,calc(100dvh-10rem))] scroll-py-3 overflow-y-auto overscroll-contain px-3 pb-3 outline-none focus-visible:ring-2 focus-visible:ring-inset"
			>
				{#each results.groups as { group, items }, groupIndex (group)}
					<!-- Ids come from the position, never the label: a label with a
					     space would split into two broken references. -->
					<section aria-labelledby="{uid}-group-{groupIndex}">
						<h3
							id="{uid}-group-{groupIndex}"
							class="text-muted-foreground px-2 pt-4 pb-1 text-xs font-medium"
						>
							{group}
						</h3>
						<ul>
							{#each items as shortcut (shortcut.id)}
								{@const on = lit === shortcut.id}
								<li
									id="{uid}-{shortcut.id}"
									data-lit={on ? '' : undefined}
									class={cn(
										'text-foreground flex h-10 items-center justify-between gap-4 rounded-xl px-2 text-sm transition-[background-color] ease-out',
										// Lights at once, then fades like an afterglow; the slow fade is
										// what reads as "that worked".
										on ? 'bg-accent duration-0' : 'duration-(--duration-deliberate)'
									)}
								>
									<span class="truncate">{shortcut.label}</span>
									<span class="sr-only">{shortcutSpoken(shortcut.keys, mac)}</span>
									<span aria-hidden="true" class="flex shrink-0 gap-1">
										{#each shortcut.keys as key, index (index)}
											<Kbd
												pressed={on}
												class="bg-accent data-[pressed]:bg-primary data-[pressed]:text-primary-foreground h-6 min-w-6 font-sans"
											>
												{keyLabel(key, mac)}
											</Kbd>
										{/each}
									</span>
								</li>
							{/each}
						</ul>
					</section>
				{:else}
					<p class="text-muted-foreground px-2 py-10 text-center text-sm">
						No shortcuts match “{query.trim()}”
					</p>
				{/each}
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
