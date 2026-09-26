<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import type { HTMLAttributes } from 'svelte/elements';
	import { SpringValue, springPresets } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = HTMLAttributes<HTMLTableSectionElement> & {
		/** The body element. */
		ref?: HTMLTableSectionElement | null;
		/** Classes for the body. */
		class?: string;
		/** The rows, usually `DataTableRow`s keyed by row id. */
		children?: Snippet;
	};

	let { ref = $bindable(null), class: className, children, ...restProps }: Props = $props();

	type Track = { top: number; y: SpringValue };

	/**
	 * Rows glide to their new places when the order changes, from wherever
	 * they visibly were, instead of jumping. Sorting keeps the reader's eye on
	 * the row they were looking at.
	 */
	const glide: Attachment<HTMLTableSectionElement> = (body) => {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- bookkeeping for animation, never rendered
		const tracks = new Map<HTMLTableRowElement, Track>();

		const rows = () =>
			[...body.children].filter((row): row is HTMLTableRowElement => row.tagName === 'TR');

		function track(row: HTMLTableRowElement) {
			const y = new SpringValue(0, {
				// No bounce: a row that overshoots would briefly sit in the wrong order.
				preset: springPresets.smooth,
				onUpdate: (value) => (row.style.translate = value ? `0 ${value}px` : '')
			});
			const entry = { top: row.offsetTop, y };
			tracks.set(row, entry);
			return entry;
		}

		/** Remembers where every row rests now, without animating. */
		function measure() {
			for (const row of rows()) {
				const entry = tracks.get(row) ?? track(row);
				entry.top = row.offsetTop;
			}
		}

		const mutations = new MutationObserver(() => {
			const present = new Set(rows());
			for (const [row, entry] of tracks) {
				if (present.has(row)) continue;
				entry.y.stop();
				tracks.delete(row);
			}
			for (const row of present) {
				const entry = tracks.get(row);
				if (!entry) {
					track(row);
					continue;
				}
				const top = row.offsetTop;
				const offset = entry.top + entry.y.current - top;
				entry.top = top;
				if (Math.abs(offset - entry.y.current) < 0.5) continue;
				entry.y.jump(offset);
				entry.y.set(0);
			}
		});
		// Layout changes that are not reorders, such as a resize, only update the record.
		const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);

		measure();
		mutations.observe(body, { childList: true });
		resize?.observe(body);
		return () => {
			mutations.disconnect();
			resize?.disconnect();
			for (const entry of tracks.values()) entry.y.stop();
		};
	};
</script>

<tbody
	{...restProps}
	bind:this={ref}
	{@attach glide}
	class={cn('[&_tr:last-child]:border-0', className)}
>
	{@render children?.()}
</tbody>
