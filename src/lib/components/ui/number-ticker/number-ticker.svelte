<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import type { TransitionConfig } from 'svelte/transition';
	import { duration, easeIn, easeOut, prefersReducedMotion } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
		/** The number to show. Changes roll each digit to its new place. */
		value: number;
		/** BCP 47 locale for grouping, decimals, and digits. Defaults to the runtime locale. */
		locale?: string;
		/** Intl.NumberFormat options, such as currency, percent, or compact notation. */
		format?: Intl.NumberFormatOptions;
		class?: string;
		ref?: HTMLSpanElement | null;
	};

	let { value, locale, format, class: className, ref = $bindable(null), ...rest }: Props = $props();

	const formatter = $derived(new Intl.NumberFormat(locale, format));
	/** The locale's own glyphs for 0 through 9, so any numbering system can roll. */
	const digits = $derived.by(() => {
		const { numberingSystem } = formatter.resolvedOptions();
		const plain = new Intl.NumberFormat(locale, { numberingSystem, useGrouping: false });
		return Array.from({ length: 10 }, (_, digit) => plain.format(digit));
	});
	const formatted = $derived(formatter.format(value));

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
						class="ease-spring absolute inset-x-0 top-0 flex flex-col items-center transition-[translate] duration-(--duration-spring)"
						style:translate="0 {character.digit * -10}%"
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
