<script lang="ts">
	import { untrack } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { flip } from 'svelte/animate';
	import type { TransitionConfig } from 'svelte/transition';
	import { Kbd, isApplePlatform, keyLabel, shortcutSpoken } from '$lib/components/ui/kbd';
	import {
		duration as durations,
		easeIn,
		easeOut,
		prefersReducedMotion,
		springs,
		stagger
	} from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** What the shortcut does, such as "Open command menu". Names the field. */
		label: string;
		/**
		 * The shortcut as tokens: modifiers first, then one key, such as
		 * `['Mod', 'K']`. `Mod` is Command on Apple platforms and Control
		 * elsewhere, so one saved shortcut works on both. Empty when unset.
		 */
		value?: string[];
		/** Called with the new shortcut, or an empty list when it is cleared. */
		onChange?: (value: string[]) => void;
		/**
		 * Names the action already using a combination, or returns null when
		 * it is free. A taken combination is refused with "Used by ...".
		 */
		taken?: (combo: string[]) => string | null;
		/** Blocks recording. */
		disabled?: boolean;
		/** The row element. */
		ref?: HTMLDivElement | null;
		/** Classes for the row. */
		class?: string;
	};

	let {
		label,
		value = $bindable([]),
		onChange,
		taken,
		disabled = false,
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	const MODIFIER_KEYS = new Set(['Meta', 'Control', 'Alt', 'Shift', 'OS', 'AltGraph']);
	const ARROWS: Record<string, string> = {
		ArrowUp: '↑',
		ArrowDown: '↓',
		ArrowLeft: '←',
		ArrowRight: '→'
	};

	let mac = $state(false);
	let recording = $state(false);
	/** Modifiers held right now while recording, in platform order. */
	let held = $state<string[]>([]);
	let error = $state<string | null>(null);
	/** Bumped each time a shortcut is saved, so its caps land again. */
	let saved = $state(0);
	let field = $state<HTMLButtonElement | null>(null);
	let errorTimer: ReturnType<typeof setTimeout> | undefined;
	let shake: Animation | undefined;

	$effect(() => {
		mac = isApplePlatform();
		return () => {
			clearTimeout(errorTimer);
			shake?.cancel();
		};
	});

	/** Held modifiers in the order each platform prints them. */
	function modifiers(event: KeyboardEvent): string[] {
		const order: [boolean, string][] = mac
			? [
					[event.ctrlKey, 'Ctrl'],
					[event.altKey, 'Alt'],
					[event.shiftKey, 'Shift'],
					[event.metaKey, 'Mod']
				]
			: [
					[event.ctrlKey, 'Mod'],
					[event.altKey, 'Alt'],
					[event.shiftKey, 'Shift']
				];
		return order.filter(([on]) => on).map(([, name]) => name);
	}

	/** The physical key, so Option+K on a Mac records K rather than "˚". */
	function keyName(event: KeyboardEvent) {
		// Browser autofill dispatches keydown events with no `key` or `code`.
		const code = event.code ?? '';
		const key = event.key ?? '';
		if (code.startsWith('Key')) return code.slice(3);
		if (code.startsWith('Digit')) return code.slice(5);
		if (ARROWS[key]) return ARROWS[key];
		if (key === ' ') return 'Space';
		if (key.length === 1) return key.toUpperCase();
		return key;
	}

	const same = (a: string[], b: string[]) =>
		a.length === b.length && a.every((token, index) => token === b[index]);

	function stop() {
		recording = false;
		held = [];
	}

	function commit(next: string[]) {
		clearTimeout(errorTimer);
		error = null;
		value = next;
		onChange?.(next);
	}

	function fail(text: string) {
		clearTimeout(errorTimer);
		error = text;
		errorTimer = setTimeout(() => (error = null), durations.ambient);
		// A small shake: the field shrugs off a combination it can't take.
		if (!field || prefersReducedMotion() || typeof field.animate !== 'function') return;
		shake?.cancel();
		shake = field.animate(
			[
				{ translate: '0' },
				{ translate: '-4px 0' },
				{ translate: '4px 0' },
				{ translate: '-3px 0' },
				{ translate: '3px 0' },
				{ translate: '0' }
			],
			{ duration: durations.slow }
		);
	}

	function toggle() {
		if (disabled) return;
		error = null;
		held = [];
		recording = !recording;
	}

	// While recording, every key belongs to the field. Listening in the capture
	// phase takes each key before the page's own shortcuts can act on it.
	$effect(() => {
		if (!recording) return;

		const onkeydown = (event: KeyboardEvent) => {
			event.preventDefault();
			event.stopImmediatePropagation();
			const mods = modifiers(event);
			if (MODIFIER_KEYS.has(event.key)) {
				held = mods;
				return;
			}
			if (!mods.length && event.key === 'Escape') return stop();
			if (!mods.length && (event.key === 'Backspace' || event.key === 'Delete')) {
				commit([]);
				return stop();
			}
			const key = keyName(event);
			if (!key) return;
			if (!mods.length && !/^F\d{1,2}$/.test(key)) {
				return fail(`Add ${mac ? '⌘, ⌥ or ⇧' : 'Ctrl, Alt or Shift'}`);
			}
			const combo = [...mods, key];
			const owner = untrack(() => (same(combo, value) ? null : (taken?.(combo) ?? null)));
			if (owner) return fail(`Used by ${owner}`);
			commit(combo);
			saved += 1;
			stop();
		};
		const onkeyup = (event: KeyboardEvent) => {
			event.stopImmediatePropagation();
			held = modifiers(event);
		};
		const onaway = (event: Event) => {
			if (event.type === 'blur' || !field?.contains(event.target as Node)) stop();
		};

		window.addEventListener('keydown', onkeydown, true);
		window.addEventListener('keyup', onkeyup, true);
		window.addEventListener('blur', onaway);
		document.addEventListener('pointerdown', onaway);
		return () => {
			window.removeEventListener('keydown', onkeydown, true);
			window.removeEventListener('keyup', onkeyup, true);
			window.removeEventListener('blur', onaway);
			document.removeEventListener('pointerdown', onaway);
		};
	});

	$effect(() => {
		if (disabled) untrack(stop);
	});

	const caps = $derived(recording ? held : value);
	const spoken = $derived(value.length ? shortcutSpoken(value, mac) : 'none');

	/** A held key resolves out of a blur and springs up to size. */
	function arrive(_node: Element): TransitionConfig {
		if (prefersReducedMotion()) return { duration: 0 };
		const { duration, easing } = springs.bouncy;
		return {
			duration,
			css: (t) =>
				`opacity: ${easeOut(Math.min(1, t * 2))}; filter: blur(${(1 - easeOut(t)) * 3}px); scale: ${0.8 + 0.2 * easing(t)}`
		};
	}

	/** A saved shortcut lands: each cap drops the last few pixels into place, one after another. */
	function land(_node: Element, { index }: { index: number }): TransitionConfig {
		if (prefersReducedMotion()) return { duration: 0 };
		const { duration, easing } = springs.bouncy;
		return {
			delay: index * (stagger / 2),
			duration,
			css: (t) => {
				const s = easing(t);
				return `opacity: ${0.6 + 0.4 * easeOut(t)}; translate: 0 ${(1 - s) * -3}px; scale: ${1.08 - 0.08 * s}`;
			}
		};
	}

	/** Held keys arrive as they are pressed; a saved shortcut lands. */
	function arriveOrLand(node: Element, { index }: { index: number }): TransitionConfig {
		return recording ? arrive(node) : land(node, { index });
	}

	/**
	 * A released key shrinks away. It steps out of the row at once, so the caps
	 * beside it close up while it goes. When a shortcut is saved, the held caps
	 * simply give way to the landing ones.
	 */
	function leave(node: Element): TransitionConfig {
		if (prefersReducedMotion() || !recording) return { duration: 0 };
		if (node instanceof HTMLElement) {
			const { offsetLeft, offsetTop, offsetWidth, offsetHeight } = node;
			Object.assign(node.style, {
				position: 'absolute',
				left: `${offsetLeft}px`,
				top: `${offsetTop}px`,
				width: `${offsetWidth}px`,
				height: `${offsetHeight}px`
			});
		}
		return {
			duration: durations.instant,
			easing: easeIn,
			css: (t) => `opacity: ${t}; scale: ${0.8 + 0.2 * t}`
		};
	}

	const fade = (_node: Element, { out = false }: { out?: boolean } = {}): TransitionConfig => ({
		duration: prefersReducedMotion() ? 0 : out ? durations.instant : durations.fast,
		easing: out ? easeIn : easeOut,
		css: (t) => `opacity: ${t}`
	});
</script>

<div
	bind:this={ref}
	class={cn('flex items-center justify-between gap-4', className)}
	{...restProps}
>
	<div class="relative min-w-0 flex-1">
		<p class="text-foreground text-sm">{label}</p>
		<!-- Hangs under the label without taking room, so labels stay centered on their fields. -->
		<div class="absolute inset-x-0 top-full h-4">
			<p role="status" class="absolute inset-x-0 top-0.5">
				{#key error}
					{#if error}
						<span
							class="text-destructive block truncate text-xs"
							in:arrive
							out:fade={{ out: true }}
						>
							{error}
						</span>
					{/if}
				{/key}
			</p>
		</div>
	</div>

	<button
		bind:this={field}
		type="button"
		{disabled}
		aria-pressed={recording}
		aria-label="{label} shortcut: {spoken}. {recording
			? 'Recording, press the new keys, Escape to cancel, Backspace to clear.'
			: 'Press to change.'}"
		data-recording={recording ? '' : undefined}
		class={cn(
			'relative flex h-9 min-w-24 shrink-0 touch-manipulation items-center justify-end gap-1 rounded-full px-1.5 transition-[background-color,box-shadow] duration-(--duration-fast) ease-out outline-none select-none disabled:pointer-events-none disabled:opacity-50',
			// Recording draws its own edge, so a focus ring on top would double up.
			recording
				? 'bg-card ring-primary ring-[1.5px]'
				: 'bg-secondary hover:bg-muted focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2'
		)}
		onclick={toggle}
	>
		{#if caps.length}
			{#each caps as token, index (`${token}-${recording ? 'held' : saved}`)}
				<span
					class="inline-flex"
					animate:flip={{ duration: springs.snappy.duration, easing: springs.snappy.easing }}
					in:arriveOrLand={{ index }}
					out:leave
				>
					<Kbd class="bg-card text-foreground h-6 min-w-6 font-sans">{keyLabel(token, mac)}</Kbd>
				</span>
			{/each}
		{:else}
			{#key recording}
				<span
					class="text-muted-foreground flex items-center gap-1.5 px-1.5 text-sm whitespace-nowrap"
					in:fade
				>
					{#if recording}
						<span aria-hidden="true" class="mizu-recording-dot bg-destructive size-1.5 rounded-full"
						></span>
						Press keys
					{:else}
						None
					{/if}
				</span>
			{/key}
		{/if}
	</button>
</div>

<style>
	/* A recording light, like a tape deck's: it blinks only while listening. */
	.mizu-recording-dot {
		animation: mizu-recording-blink calc(var(--duration-ambient) / 2) var(--ease-in-out) infinite;
	}

	@keyframes mizu-recording-blink {
		50% {
			opacity: 0.25;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.mizu-recording-dot {
			animation: none;
		}
	}
</style>
