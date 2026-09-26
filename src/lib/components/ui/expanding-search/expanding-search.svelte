<script lang="ts">
	import X from '@lucide/svelte/icons/x';
	import { flushSync } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLFormElement>, 'onsubmit' | 'children'> & {
		/** The query. Bindable. */
		value?: string;
		/** Whether the field is open. Bindable. */
		open?: boolean;
		/** Accessible name for the button and the field. */
		label?: string;
		/** Shown in the open, empty field. */
		placeholder?: string;
		/**
		 * How wide the field opens, in pixels. The component reserves this width
		 * even while closed, so opening never pushes its neighbours around. It
		 * never grows past its container.
		 */
		width?: number;
		/**
		 * A key that opens the field from anywhere on the page, unless focus is in
		 * another field. `null` turns it off.
		 */
		shortcut?: string | null;
		/** Called with the query when it is submitted with Enter. */
		onSearch?: (query: string) => void;
		/** Called when the field opens or closes. */
		onOpenChange?: (open: boolean) => void;
		/** The form element. */
		ref?: HTMLFormElement | null;
		/** Classes for the wrapper that reserves the open width. */
		class?: string;
	};

	let {
		value = $bindable(''),
		open = $bindable(false),
		label = 'Search',
		placeholder = 'Search',
		width = 280,
		shortcut = '/',
		onSearch,
		onOpenChange,
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	const uid = $props.id();
	const inputId = `${uid}-input`;

	let input = $state<HTMLInputElement | null>(null);
	let trigger = $state<HTMLButtonElement | null>(null);

	function change(next: boolean) {
		// The field has to be visible before focus can move into it, and focusing
		// in the same event lets phones raise the keyboard.
		flushSync(() => {
			open = next;
			if (!next) value = '';
		});
		onOpenChange?.(next);
	}

	function expand() {
		change(true);
		input?.focus();
	}

	function isEditable(target: EventTarget | null) {
		if (!(target instanceof HTMLElement)) return false;
		return (
			target.isContentEditable ||
			target.tagName === 'INPUT' ||
			target.tagName === 'TEXTAREA' ||
			target.tagName === 'SELECT'
		);
	}

	// Opening a search is occasional, so the shortcut plays the same opening as
	// a click; the motion shows where the field came from.
	$effect(() => {
		if (!shortcut) return;
		const key = shortcut;
		const onkeydown = (event: KeyboardEvent) => {
			if (event.key !== key || open || event.defaultPrevented) return;
			if (event.metaKey || event.ctrlKey || event.altKey || isEditable(event.target)) return;
			// Inert copies stay quiet.
			if (ref?.closest('[inert]')) return;
			event.preventDefault();
			expand();
		};
		document.addEventListener('keydown', onkeydown);
		return () => document.removeEventListener('keydown', onkeydown);
	});

	// Clearing hides the button under the pointer, so focus goes back to the field.
	function clear() {
		value = '';
		input?.focus();
	}
</script>

<!-- A size container, so the field inside can match the reserved width with
     container units and never reflow while the pill opens around it. -->
<div class={cn('@container flex max-w-full justify-end', className)} style:width="{width}px">
	<form
		{...restProps}
		bind:this={ref}
		role="search"
		data-open={open || undefined}
		onsubmit={(event) => {
			event.preventDefault();
			onSearch?.(value);
		}}
		onfocusout={(event) => {
			if (!open || value !== '') return;
			if (ref?.contains(event.relatedTarget as Node | null)) return;
			change(false);
		}}
		class={cn(
			'bg-secondary text-foreground relative h-10 w-10 shrink-0 overflow-hidden rounded-full shadow-xs',
			// Width, not a scale, so rounded-full stays exact at every step. It opens
			// on a spring and closes faster, getting out of the way.
			'transition-[width,scale] duration-(--duration-fast) ease-in motion-reduce:transition-none',
			'data-open:w-[100cqw] data-open:duration-(--duration-spring-snappy) data-open:ease-(--ease-spring-snappy)',
			'has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-background has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-offset-2',
			'has-[>button[data-trigger]:active]:scale-[0.96]'
		)}
	>
		<!-- Pinned to the left edge, so it rides the growing edge across instead of
		     needing an animation of its own. -->
		<svg
			viewBox="0 0 16 16"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
			class={cn(
				'pointer-events-none absolute top-3 left-3 size-4 transition-colors duration-(--duration-fast) ease-out',
				open && 'text-muted-foreground'
			)}
		>
			<circle cx="7" cy="7" r="4.25" />
			<path d="m10.25 10.25 3 3" />
		</svg>

		<button
			bind:this={trigger}
			type="button"
			data-trigger
			aria-label={label}
			aria-expanded={open}
			aria-controls={inputId}
			aria-keyshortcuts={shortcut ?? undefined}
			onclick={expand}
			class={cn(
				'hover:bg-foreground/8 absolute inset-0 rounded-full outline-none',
				open && 'invisible'
			)}
		></button>

		<label for={inputId} class="sr-only">{label}</label>
		<!-- Full width from the start, so typed text never reflows while the pill
		     is still opening around it. -->
		<input
			bind:this={input}
			bind:value
			id={inputId}
			type="search"
			autocomplete="off"
			spellcheck={false}
			enterkeyhint="search"
			onkeydown={(event) => {
				if (event.key !== 'Escape') return;
				event.preventDefault();
				change(false);
				trigger?.focus();
			}}
			class={cn(
				'absolute inset-y-0 left-0 w-[100cqw] bg-transparent pr-10 pl-9 text-base outline-none sm:text-sm [&::-webkit-search-cancel-button]:appearance-none',
				!open && 'invisible'
			)}
		/>
		<!-- A placeholder of its own, held back until the width has mostly settled,
		     so the words never appear squeezed inside a half-open pill. Typing hides
		     it at once, like a native placeholder. -->
		<span
			aria-hidden="true"
			class={cn(
				'text-muted-foreground pointer-events-none absolute top-1/2 left-9 -translate-y-1/2 text-base whitespace-nowrap sm:text-sm',
				open && value === ''
					? 'opacity-100 transition-opacity delay-(--duration-fast) duration-(--duration-fast) ease-out motion-reduce:delay-0'
					: value !== ''
						? 'opacity-0'
						: 'opacity-0 transition-opacity duration-(--duration-instant) ease-in'
			)}
		>
			{placeholder}
		</span>

		<button
			type="button"
			aria-label="Clear search"
			inert={!(open && value !== '')}
			onclick={clear}
			class={cn(
				'text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute top-1.5 right-1.5 inline-grid size-7 place-items-center rounded-full outline-none focus-visible:ring-2',
				open && value !== ''
					? 'scale-100 opacity-100 blur-none [transition:scale_var(--duration-spring-snappy)_var(--ease-spring-snappy),opacity_var(--duration-fast)_var(--ease-out),filter_var(--duration-fast)_var(--ease-out),color_var(--duration-fast)_var(--ease-out)]'
					: 'pointer-events-none scale-25 opacity-0 blur-[4px] transition-[scale,opacity,filter] duration-(--duration-instant) ease-in motion-reduce:scale-100 motion-reduce:blur-none'
			)}
		>
			<X class="size-3.5" aria-hidden="true" />
		</button>
	</form>
</div>
