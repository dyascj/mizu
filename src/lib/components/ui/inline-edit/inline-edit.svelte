<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import Pencil from '@lucide/svelte/icons/pencil';
	import { tick } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** The saved text. Updated when an edit is saved. */
		value?: string;
		/** Called with the new text when an edit changes it. Not called when nothing changed. */
		onSave?: (value: string) => void;
		/** What the text is, such as "Name". Names the button and the field for screen readers. */
		label: string;
		/** Shown, muted, while the text is empty. */
		placeholder?: string;
		/**
		 * Edits in a textarea that grows with its text. Enter saves and
		 * Shift+Enter adds a line break. Without it, runs of whitespace collapse
		 * to single spaces on save.
		 */
		multiline?: boolean;
		/** Blocks editing. */
		disabled?: boolean;
		/** How long the check shows after a save, in milliseconds. */
		savedDuration?: number;
		/** The root element. */
		ref?: HTMLDivElement | null;
		/**
		 * Classes for the text. Put typography here: the display and the editor
		 * share it exactly, so the swap does not move a glyph.
		 */
		class?: string;
	};

	let {
		value = $bindable(''),
		onSave,
		label,
		placeholder = '',
		multiline = false,
		disabled = false,
		savedDuration = 1600,
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	let editing = $state(false);
	let draft = $state('');
	let saved = $state(false);
	let savedTimer: ReturnType<typeof setTimeout> | undefined;
	let button = $state<HTMLButtonElement | null>(null);
	let field = $state<HTMLInputElement | HTMLTextAreaElement | null>(null);

	const empty = $derived(value.trim() === '');

	async function start() {
		if (disabled) return;
		draft = value;
		editing = true;
		await tick();
		field?.focus();
		// The caret lands at the end, where most edits start.
		field?.setSelectionRange(field.value.length, field.value.length);
	}

	/**
	 * Ends the edit. Keyboard exits hand focus back to the text; a click
	 * elsewhere leaves focus wherever the click put it.
	 */
	async function finish(commit: boolean, keyboard: boolean) {
		if (!editing) return;
		editing = false;
		const next = multiline ? draft.trim() : draft.replace(/\s+/g, ' ').trim();
		if (commit && next !== value) {
			value = next;
			onSave?.(next);
			saved = true;
			clearTimeout(savedTimer);
			savedTimer = setTimeout(() => (saved = false), savedDuration);
		}
		if (keyboard) {
			await tick();
			button?.focus();
		}
	}

	function onkeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !(multiline && event.shiftKey) && !event.isComposing) {
			event.preventDefault();
			finish(true, true);
		} else if (event.key === 'Escape') {
			event.preventDefault();
			event.stopPropagation();
			finish(false, true);
		}
	}

	$effect(() => () => clearTimeout(savedTimer));

	// One box, padding, font, and line height for the display and the editor,
	// so the swap does not move a single glyph.
	const box = $derived(
		cn(
			'col-start-1 row-start-1 block w-full py-1 pe-9 text-start',
			multiline
				? 'rounded-2xl ps-3 break-words whitespace-pre-wrap'
				: 'truncate rounded-full ps-3 whitespace-pre',
			className
		)
	);

	const shown =
		'scale-100 opacity-100 blur-none [transition:scale_var(--duration-spring-snappy)_var(--ease-spring-snappy),opacity_var(--duration-base)_var(--ease-out),filter_var(--duration-base)_var(--ease-out)]';
	const hidden =
		'scale-25 opacity-0 blur-[4px] transition-[scale,opacity,filter] duration-(--duration-fast) ease-in motion-reduce:scale-100 motion-reduce:blur-none';
</script>

<!-- Pulled out by its own padding, so the text lines up with the content
     around it while the tint still has room to breathe. -->
<div
	{...restProps}
	bind:this={ref}
	data-slot="inline-edit"
	data-editing={editing || undefined}
	class="group/edit relative -mx-3 grid"
>
	<!-- Hidden while editing, but still sizing the cell, so the editor inherits
	     its exact width and starting height. While editing, its text mirrors
	     the draft so a textarea grows with it; the trailing space keeps a new
	     empty line from collapsing. The box preserves whitespace, so the text
	     hugs the tags. -->
	<button
		bind:this={button}
		type="button"
		{disabled}
		onclick={start}
		tabindex={editing ? -1 : undefined}
		aria-label="Edit {label}: {empty ? placeholder : value}"
		aria-hidden={editing || undefined}
		class={cn(
			box,
			'cursor-text transition-[background-color] duration-(--duration-fast) ease-out outline-none',
			'hover:bg-secondary focus-visible:ring-ring focus-visible:ring-2',
			'disabled:cursor-default disabled:hover:bg-transparent',
			editing && 'invisible',
			empty && !editing && 'text-muted-foreground'
		)}>{editing ? `${draft} ` : empty ? placeholder : value}</button
	>

	{#if editing}
		{#if multiline}
			<textarea
				bind:this={field}
				bind:value={draft}
				aria-label={label}
				{placeholder}
				rows={1}
				onblur={() => finish(true, false)}
				{onkeydown}
				class={cn(
					box,
					'bg-control text-foreground placeholder:text-muted-foreground ring-ring h-full resize-none overflow-hidden ring-2 outline-none'
				)}></textarea>
		{:else}
			<input
				bind:this={field}
				bind:value={draft}
				aria-label={label}
				{placeholder}
				onblur={() => finish(true, false)}
				{onkeydown}
				class={cn(
					box,
					'bg-control text-foreground placeholder:text-muted-foreground ring-ring h-full ring-2 outline-none'
				)}
			/>
		{/if}
	{/if}

	<!-- A pencil on hover or focus, a check right after saving. Pinned to the
	     first line so it stays put as the text grows. -->
	<span
		aria-hidden="true"
		class={cn(
			'text-muted-foreground pointer-events-none absolute end-2 top-1 grid size-6 place-items-center [&>*]:col-start-1 [&>*]:row-start-1',
			(editing || disabled) && 'invisible'
		)}
	>
		<!-- The wrapper owns the hover fade and the icon owns the swap, so the
		     two never fight over one opacity. -->
		<span
			class="opacity-0 transition-opacity duration-(--duration-fast) ease-out group-hover/edit:opacity-100 group-has-[:focus-visible]/edit:opacity-100"
		>
			<Pencil class={cn('size-4', saved ? hidden : shown)} />
		</span>
		<Check class={cn('text-foreground size-4', saved ? shown : hidden)} />
	</span>
	<span class="sr-only" aria-live="polite">{saved ? `${label} saved` : ''}</span>
</div>
