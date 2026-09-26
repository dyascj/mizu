<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';
	import { isApplePlatform, isPlatformKey, keyLabel, keyMatches } from './keys.js';

	type Props = HTMLAttributes<HTMLElement> & {
		/**
		 * The real key this cap stands for. When set, the cap sinks while that
		 * key is held anywhere on the page, like a keyboard answering back. Use
		 * a key name such as `"k"`, `"Enter"`, or `"?"`, or a modifier: `"mod"`
		 * (Command on Apple platforms, Control elsewhere), `"shift"`, `"alt"`,
		 * or `"ctrl"`. Without children the cap prints the key's label for the
		 * reader's platform.
		 */
		match?: string;
		/** Holds the cap down from outside, such as while a shortcut plays back. */
		pressed?: boolean;
		/** The element. */
		ref?: HTMLElement | null;
		/** Classes for the cap. */
		class?: string;
		/** The label. Optional when `match` names the key. */
		children?: Snippet;
	};

	let {
		match,
		pressed = false,
		ref = $bindable(null),
		class: className,
		children,
		...rest
	}: Props = $props();

	/** Unknown until mounted, so server and client render the same markup. */
	let mac = $state<boolean | null>(null);
	let held = $state(false);

	onMount(() => {
		mac = isApplePlatform();
	});

	$effect(() => {
		if (!match || mac === null) return;
		const token = match;
		const apple = mac;
		const down = (event: KeyboardEvent) => {
			if (keyMatches(token, event, apple)) held = true;
		};
		const up = (event: KeyboardEvent) => {
			// macOS sends no keyup for other keys while Command is held, so
			// letting go of Command has to release every cap.
			if (keyMatches(token, event, apple) || (apple && event.key === 'Meta')) held = false;
		};
		// A key released in another window never reports its keyup here.
		const release = () => (held = false);
		window.addEventListener('keydown', down);
		window.addEventListener('keyup', up);
		window.addEventListener('blur', release);
		return () => {
			window.removeEventListener('keydown', down);
			window.removeEventListener('keyup', up);
			window.removeEventListener('blur', release);
			held = false;
		};
	});

	const live = $derived(match !== undefined || pressed);
	const down = $derived(pressed || held);
	/** The platform label waits for the platform, holding its space meanwhile. */
	const waiting = $derived(!children && !!match && isPlatformKey(match) && mac === null);
</script>

<kbd
	bind:this={ref}
	data-pressed={down ? '' : undefined}
	class={cn(
		'bg-muted text-muted-foreground inline-flex h-5 min-w-5 items-center justify-center rounded-xs px-1.5 font-mono text-xs font-medium shadow-xs',
		// A cap that answers the keyboard stands on a short skirt and drops onto
		// it when pressed. It goes down at once, like a real switch, and comes
		// back up a touch slower.
		live &&
			'shadow-[0_1.5px_0_0_var(--border-strong)] transition-[translate,box-shadow,background-color,color] duration-(--duration-fast) ease-out motion-reduce:transition-[background-color,color]',
		live &&
			down &&
			'bg-control text-foreground translate-y-[1.5px] shadow-none duration-0 motion-reduce:translate-y-0',
		waiting && 'invisible',
		className
	)}
	{...rest}
>
	{#if children}
		{@render children()}
	{:else if match}
		{keyLabel(match, mac ?? false)}
	{/if}
</kbd>
