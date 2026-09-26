<script lang="ts" module>
	export type SaveState = 'saved' | 'unsaved' | 'saving';
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { blurIn, duration, easeIn, prefersReducedMotion } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/**
		 * Where the document stands. One dot means there are changes, it splits
		 * into three that pulse while saving, and the three gather back into the
		 * middle as a check draws.
		 */
		state: SaveState;
		/** When the last save landed. The saved label ages from it: just now, minutes ago, then the time. */
		savedAt?: Date | number | null;
		/** Pins "now" instead of the live clock, for tests and replays. */
		now?: number;
		/** BCP 47 locale for the time of day on older saves. */
		locale?: string;
		/** Said while saving. */
		savingLabel?: string;
		/** Said while there are changes waiting to save. */
		unsavedLabel?: string;
		/** Announced to screen readers when a save lands. */
		savedAnnouncement?: string;
		/** The status element. */
		ref?: HTMLDivElement | null;
		class?: string;
	};

	let {
		state: status,
		savedAt = null,
		now,
		locale,
		savingLabel = 'Saving',
		unsavedLabel = 'Unsaved changes',
		savedAnnouncement = 'All changes saved',
		ref = $bindable(null),
		class: className,
		...rest
	}: Props = $props();

	const MINUTE = 60_000;

	// The live clock only starts in the browser, and only while a save is
	// showing its age. Until then the label says a plain "Saved", so the
	// server and the first client render agree.
	let clock = $state<number | null>(null);
	const current = $derived(now ?? clock);
	const savedTime = $derived(savedAt === null ? null : new Date(savedAt).getTime());

	$effect(() => {
		if (now !== undefined || status !== 'saved' || savedTime === null) return;
		clock = Date.now();
		// Checked twice a minute; the words change at most once a minute.
		const id = setInterval(() => (clock = Date.now()), MINUTE / 2);
		return () => clearInterval(id);
	});

	/** How long ago, in the words a person would use. */
	function savedLabel() {
		if (savedTime === null || current === null) return 'Saved';
		const ago = current - savedTime;
		if (ago < 45_000) return 'Saved just now';
		if (ago < 60 * MINUTE) return `Saved ${Math.max(1, Math.floor(ago / MINUTE))} min ago`;
		return `Saved at ${new Date(savedTime).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })}`;
	}

	const label = $derived(
		status === 'saving' ? savingLabel : status === 'unsaved' ? unsavedLabel : savedLabel()
	);

	// Announces a save landing, never the in-between states.
	let previous = untrack(() => status);
	let announcement = $state('');
	$effect(() => {
		const next = status;
		if (next === previous) return;
		announcement = next === 'saved' ? savedAnnouncement : '';
		previous = next;
	});

	function leave(_node: Element) {
		if (prefersReducedMotion())
			return { duration: duration.fast, css: (t: number) => `opacity: ${t}` };
		return {
			duration: duration.fast,
			easing: easeIn,
			css: (t: number, u: number) =>
				`opacity: ${t}; filter: blur(${u * 3}px); translate: 0 ${u * -3}px`
		};
	}

	const dots = [-5, 0, 5];
</script>

<div
	bind:this={ref}
	data-state={status}
	class={cn(
		// A fixed width, as wide as the longest thing it says, so the icon never
		// shifts and old and new words cross in the same spot.
		'text-muted-foreground flex w-40 shrink-0 items-center gap-2 text-sm whitespace-nowrap',
		className
	)}
	{...rest}
>
	<span aria-hidden="true" class="relative grid size-4 shrink-0 place-items-center">
		{#each dots as x, i (i)}
			{@const middle = i === 1}
			<span
				class="absolute size-1 [transition:translate_var(--duration-spring)_var(--ease-spring),scale_var(--duration-spring)_var(--ease-spring),opacity_var(--duration-base)_var(--ease-out)]"
				style:translate="{status === 'saving' ? x : 0}px 0"
				style:scale={status === 'saving' ? 1 : status === 'unsaved' ? (middle ? 1.5 : 1) : 0.5}
				style:opacity={status === 'saving' || (status === 'unsaved' && middle) ? 1 : 0}
			>
				<span
					class={cn('block size-full rounded-full bg-current', status === 'saving' && 'save-pulse')}
					style:animation-delay="calc(var(--duration-fast) * {i})"
				></span>
			</span>
		{/each}
		<svg viewBox="0 0 16 16" class="text-foreground absolute size-4" fill="none">
			<path
				d="M3.75 8.25l2.75 2.75 5.75-6"
				stroke="currentColor"
				stroke-width="1.6"
				stroke-linecap="round"
				stroke-linejoin="round"
				pathLength="1"
				stroke-dasharray="1 1"
				stroke-dashoffset={status === 'saved' ? 0 : 1}
				class={cn(
					status === 'saved'
						? 'opacity-100 [transition:stroke-dashoffset_var(--duration-slow)_var(--ease-out)_var(--duration-instant),opacity_var(--duration-fast)_var(--ease-out)_var(--duration-instant)]'
						: 'opacity-0 transition-[stroke-dashoffset,opacity] duration-(--duration-fast) ease-in'
				)}
			/>
		</svg>
	</span>
	<span class="grid min-w-0 flex-1">
		{#key label}
			<span
				class="col-start-1 row-start-1 truncate"
				in:blurIn={{ duration: duration.base, blur: 3, y: 3 }}
				out:leave
			>
				{label}
			</span>
		{/key}
	</span>
	<span class="sr-only" aria-live="polite">{announcement}</span>
</div>

<style>
	.save-pulse {
		animation: save-pulse calc(var(--duration-ambient) / 2) var(--ease-in-out) infinite;
	}

	@keyframes save-pulse {
		0%,
		100% {
			opacity: 0.25;
		}
		40% {
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.save-pulse {
			animation: none;
		}
	}
</style>
