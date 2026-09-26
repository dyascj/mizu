<script lang="ts">
	import Copy from '@lucide/svelte/icons/copy';
	import Check from '@lucide/svelte/icons/check';
	import X from '@lucide/svelte/icons/x';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLButtonAttributes, 'value' | 'children' | 'onclick'> & {
		/** The text written to the clipboard. */
		value: string;
		/** Accessible name for the button. */
		label?: string;
		/** How long the success or failure state shows, in milliseconds. */
		timeout?: number;
		/** Called with the copied text after the clipboard accepts it. */
		onCopy?: (value: string) => void;
		/** Resting fill: transparent until hover, or a quiet gray. */
		variant?: 'ghost' | 'secondary';
		/** Button diameter. */
		size?: 'sm' | 'md';
		/** The button element. */
		ref?: HTMLButtonElement | null;
		/** Classes for the button. */
		class?: string;
	};

	let {
		value,
		label = 'Copy',
		timeout = 1600,
		onCopy,
		variant = 'ghost',
		size = 'md',
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	let status = $state<'idle' | 'copied' | 'error'>('idle');
	let resetTimer: ReturnType<typeof setTimeout> | undefined;

	async function copy() {
		clearTimeout(resetTimer);
		try {
			await navigator.clipboard.writeText(value);
			status = 'copied';
			onCopy?.(value);
		} catch {
			status = 'error';
		}
		resetTimer = setTimeout(() => (status = 'idle'), timeout);
	}

	$effect(() => () => clearTimeout(resetTimer));

	// Entering icons spring in; leaving icons fall away faster on a plain curve.
	const shown =
		'scale-100 opacity-100 blur-none [transition:scale_var(--duration-spring)_var(--ease-spring),opacity_var(--duration-fast)_var(--ease-out),filter_var(--duration-fast)_var(--ease-out)]';
	const hidden =
		'scale-50 opacity-0 blur-[2px] transition-[scale,opacity,filter] duration-(--duration-fast) ease-in';
</script>

<button
	{...restProps}
	bind:this={ref}
	type="button"
	aria-label={label}
	data-status={status}
	onclick={copy}
	class={cn(
		'text-muted-foreground hover:text-foreground focus-visible:ring-ring focus-visible:ring-offset-background inline-grid shrink-0 place-items-center rounded-full transition-[background-color,color,scale] duration-(--duration-fast) ease-out outline-none select-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.92] disabled:pointer-events-none disabled:opacity-50 [&>svg]:col-start-1 [&>svg]:row-start-1',
		variant === 'ghost' ? 'hover:bg-foreground/8' : 'bg-secondary hover:bg-control',
		size === 'sm' ? 'size-8 [&>svg]:size-3.5' : 'size-10 [&>svg]:size-4',
		className
	)}
>
	<Copy aria-hidden="true" class={status === 'idle' ? shown : hidden} />
	<Check aria-hidden="true" class={cn('text-success', status === 'copied' ? shown : hidden)} />
	<X aria-hidden="true" class={cn('text-destructive', status === 'error' ? shown : hidden)} />
</button>
<span class="sr-only" aria-live="polite">
	{status === 'copied' ? 'Copied' : status === 'error' ? 'Copy failed' : ''}
</span>
