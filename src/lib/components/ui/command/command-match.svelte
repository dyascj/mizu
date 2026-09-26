<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';
	import { getCommandContext } from './context.js';

	type Props = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
		/** The result's label. The part the search matches stays full strength. */
		text: string;
		/** Classes for the label. */
		class?: string;
	};

	let { text, class: className, ...restProps }: Props = $props();
	const context = getCommandContext();

	/**
	 * A contiguous run first, so "set" marks "Settings" as one piece instead of
	 * scattered letters; the letters in order are the fallback.
	 */
	function match(label: string, query: string): [number, number][] {
		if (!query) return [];
		const hay = label.toLowerCase();
		const needle = query.toLowerCase();
		const at = hay.indexOf(needle);
		if (at !== -1) return [[at, at + needle.length]];
		const ranges: [number, number][] = [];
		let from = 0;
		for (const char of needle) {
			const i = hay.indexOf(char, from);
			if (i === -1) return [];
			const last = ranges.at(-1);
			if (last && last[1] === i) last[1] = i + 1;
			else ranges.push([i, i + 1]);
			from = i + 1;
		}
		return ranges;
	}

	const parts = $derived.by(() => {
		const ranges = match(text, (context?.search ?? '').trim());
		if (!ranges.length) return null;
		const out: { text: string; hit: boolean }[] = [];
		let cursor = 0;
		for (const [start, end] of ranges) {
			if (start > cursor) out.push({ text: text.slice(cursor, start), hit: false });
			out.push({ text: text.slice(start, end), hit: true });
			cursor = end;
		}
		if (cursor < text.length) out.push({ text: text.slice(cursor), hit: false });
		return out;
	});
</script>

<!-- Dims what the search skipped rather than bolding what it found, so labels
     never reflow as letters change weight. -->
<span
	class={cn('min-w-0 flex-1 truncate', parts && 'text-muted-foreground', className)}
	{...restProps}
	>{#if parts}{#each parts as part, i (i)}{#if part.hit}<span class="text-foreground"
					>{part.text}</span
				>{:else}{part.text}{/if}{/each}{:else}{text}{/if}</span
>
