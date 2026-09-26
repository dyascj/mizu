<script lang="ts">
	import { untrack } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { TransitionConfig } from 'svelte/transition';
	import {
		duration,
		easeIn,
		easeOut,
		prefersReducedMotion,
		springPresets
	} from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
		/**
		 * The number to show. Changes roll each digit to its new place, forward
		 * when the value rises and backward when it falls.
		 */
		value: number;
		/** BCP 47 locale for grouping, decimals, and digits. Defaults to the runtime locale. */
		locale?: string;
		/** Intl.NumberFormat options, such as currency, percent, or compact notation. */
		format?: Intl.NumberFormatOptions;
		/**
		 * Show exactly this many integer digits, with leading zeros, on wheels
		 * that wrap like a mechanical odometer: with 3, counting past 999 rolls
		 * every wheel forward onto 000. Grouping is off unless `format` turns it on.
		 */
		odometer?: number;
		class?: string;
		ref?: HTMLSpanElement | null;
	};

	let {
		value,
		locale,
		format,
		odometer,
		class: className,
		ref = $bindable(null),
		...rest
	}: Props = $props();

	/** Integer wheels in odometer mode, within what Intl can pad to. */
	const wheels = $derived(
		odometer === undefined ? undefined : Math.min(21, Math.max(1, Math.round(odometer)))
	);
	const formatter = $derived(
		wheels === undefined
			? new Intl.NumberFormat(locale, format)
			: new Intl.NumberFormat(locale, {
					useGrouping: false,
					...format,
					minimumIntegerDigits: wheels
				})
	);
	/** The locale's own glyphs for 0 through 9, so any numbering system can roll. */
	const digits = $derived.by(() => {
		const { numberingSystem } = formatter.resolvedOptions();
		const plain = new Intl.NumberFormat(locale, { numberingSystem, useGrouping: false });
		return Array.from({ length: 10 }, (_, digit) => plain.format(digit));
	});
	const shown = $derived.by(() => {
		if (wheels === undefined) return value;
		const modulo = 10 ** wheels;
		return ((value % modulo) + modulo) % modulo;
	});
	const formatted = $derived(formatter.format(shown));

	// Key each character by its place from the right, so ones stay ones and a
	// new leading digit enters on the left instead of shifting every column.
	const characters = $derived.by(() => {
		const glyphs = Array.from(formatted);
		return glyphs.map((glyph, i) => {
			const digit = digits.indexOf(glyph);
			const place = glyphs.length - i;
			return { glyph, digit, key: digit === -1 ? `${place}:${glyph}` : `${place}` };
		});
	});

	// Which way the last change went: 1 up, -1 down, 0 before any change. It
	// follows the raw value, so an odometer that wraps 999 to 000 still rolls
	// forward. A new format has no direction of its own, so its changes take
	// the short way; formats compare by what they resolve to, so a new but
	// identical options object is not a new format. Set before the columns
	// update, so arriving columns and turning wheels read the same answer.
	const formatKey = $derived(JSON.stringify(formatter.resolvedOptions()));
	let direction = 0;
	let previous: number | undefined;
	$effect.pre(() => {
		const next = value;
		// A format change reruns this with the same value, which reads as 0.
		void formatKey;
		direction = previous === undefined ? 0 : Math.sign(next - previous) || 0;
		previous = next;
	});

	/** Wraps a distance in digits into the five places either side of zero. */
	const around = (offset: number) => (((offset % 10) + 15) % 10) - 5;

	/**
	 * Drives one digit column as a wheel. The strip's own translate always
	 * rests on the current digit; while the wheel turns, each cell is lifted
	 * to where it sits on a ten-digit loop around the spring's position, so
	 * 9 rolls forward onto 0 instead of spinning back through every digit.
	 * The spring keeps its velocity when a new value lands mid-roll, writes
	 * styles directly, and sleeps once it settles.
	 */
	function wheel(getDigit: () => number): Attachment<HTMLElement> {
		return (strip) => {
			const cells = Array.from(strip.children) as HTMLElement[];
			// A wheel lands with a whisper of overshoot, like a mechanical counter.
			const { stiffness, damping } = springPresets.bouncy;
			let digit = untrack(getDigit);
			// A column that arrives with a rising value (9 to 10) rolls up from
			// zero, as if the digit had been there all along.
			let position = direction > 0 ? 0 : digit;
			let before = position;
			let target = digit;
			let frame = 0;
			let time = 0;
			let speed = 0;

			function paint() {
				const resting = position === target;
				for (const [i, cell] of cells.entries()) {
					cell.style.translate = resting ? '' : `0 ${(around(i - position) - (i - digit)) * 100}%`;
				}
				// A fast spin smears a little, the way a real wheel does.
				const blur = resting ? 0 : Math.min(1, Math.max(0, (speed - 4) / 16));
				strip.style.filter = blur > 0 ? `blur(${(blur * 0.025).toFixed(4)}em)` : '';
			}

			// The same integration as svelte/motion's Spring, in frames of 1/60s.
			function step(now: number) {
				const dt = (Math.min(now - time, 1000 / 30) * 60) / 1000;
				time = now;
				const velocity = (position - before) / (dt || 1);
				const offset = target - position;
				const move = (velocity + stiffness * offset - damping * velocity) * dt;
				before = position;
				if (Math.abs(move) < 0.002 && Math.abs(offset) < 0.002) {
					position = before = target;
					frame = speed = 0;
					paint();
					return;
				}
				position += move;
				speed = Math.abs(velocity) * 60;
				paint();
				frame = requestAnimationFrame(step);
			}

			function roll() {
				if (prefersReducedMotion()) {
					cancelAnimationFrame(frame);
					frame = 0;
					position = before = target;
				} else if (!frame) {
					time = performance.now();
					frame = requestAnimationFrame(step);
				}
				// Paint now: the strip already rests on the new digit this frame.
				paint();
			}

			if (position !== target) roll();

			$effect(() => {
				const next = getDigit();
				untrack(() => {
					const sign = direction;
					if (next === digit) return;
					const forward = (((next - digit) % 10) + 10) % 10;
					// Rising values roll forward and falling ones backward; a change
					// with no direction (a new format) takes the short way round.
					target +=
						sign > 0 ? forward : sign < 0 ? forward - 10 : forward > 5 ? forward - 10 : forward;
					digit = next;
					roll();
				});
			});

			return () => {
				cancelAnimationFrame(frame);
				for (const cell of cells) cell.style.translate = '';
				strip.style.filter = '';
			};
		};
	}

	/** New columns open from zero width; the width eases so neighbors never jump. */
	function column(node: HTMLElement, { exit = false } = {}): TransitionConfig {
		if (prefersReducedMotion()) return {};
		const width = node.getBoundingClientRect().width;
		return {
			duration: exit ? duration.fast : duration.base,
			easing: exit ? easeIn : easeOut,
			css: (t) => `width: ${t * width}px; opacity: ${t}; filter: blur(${(1 - t) * 0.1}em)`
		};
	}
</script>

<span
	bind:this={ref}
	class={cn('inline-block whitespace-nowrap tabular-nums', className)}
	{...rest}
>
	<span class="sr-only">{formatted}</span>
	<span aria-hidden="true">
		{#each characters as character (character.key)}
			<span
				class="inline-block"
				class:ticker-column={character.digit !== -1}
				in:column
				out:column={{ exit: true }}
			>
				{#if character.digit === -1}
					{character.glyph}
				{:else}
					<span class="invisible">{character.glyph}</span>
					<span
						class="absolute inset-x-0 top-0 flex flex-col items-center"
						style:translate="0 {character.digit * -10}%"
						{@attach wheel(() => character.digit)}
					>
						{#each digits as glyph (glyph)}<span class="ticker-cell">{glyph}</span>{/each}
					</span>
				{/if}
			</span>
		{/each}
	</span>
</span>

<style>
	/* Each column shows one line plus a feathered margin above and below. The
	   margin is padding cancelled by a negative margin, so the line box and the
	   baseline stay exactly where plain text would put them. */
	.ticker-column,
	.ticker-cell {
		padding-block: var(--ticker-feather);
	}

	.ticker-column {
		--ticker-feather: 0.25em;
		position: relative;
		margin-block: calc(var(--ticker-feather) * -1);
		mask-image: linear-gradient(
			transparent,
			black var(--ticker-feather),
			black calc(100% - var(--ticker-feather)),
			transparent
		);
	}
</style>
