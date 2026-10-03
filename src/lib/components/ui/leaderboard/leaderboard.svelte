<script lang="ts" module>
	export type LeaderboardItem = {
		/** Stable identity, so a row keeps its place in the DOM as it moves. */
		id: string;
		name: string;
		score: number;
		/** Image URL for the avatar. Initials show without one. */
		avatar?: string;
	};
</script>

<script lang="ts">
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import type { AnimationConfig } from 'svelte/animate';
	import type { HTMLOlAttributes } from 'svelte/elements';
	import type { TransitionConfig } from 'svelte/transition';
	import { duration, easeIn, prefersReducedMotion, springs } from '$lib/components/ui/motion';
	import { NumberTicker } from '$lib/components/ui/number-ticker';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLOlAttributes, 'children'> & {
		/** Entries in any order. They are ranked by score, highest first, then by name. */
		items: LeaderboardItem[];
		/**
		 * Places each entry just gained (positive) or lost (negative), by id. Shown
		 * as a brief arrow; clear it after a moment to let the cue fade.
		 */
		moves?: Record<string, number>;
		/** Names the list for assistive technology. */
		label?: string;
		/** Spoken after each score, such as "points". */
		unit?: string;
		/** Intl.NumberFormat options for the scores. */
		format?: Intl.NumberFormatOptions;
		/** BCP 47 locale for scores and ordinals. */
		locale?: string;
		/** The list element. */
		ref?: HTMLOListElement | null;
		/** Classes for the list. */
		class?: string;
	};

	let {
		items,
		moves = {},
		label = 'Leaderboard',
		unit = 'points',
		format,
		locale,
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	// Remembers, per entry, which way its rank last changed and its last
	// movement, so the rank rolls the way the row travels and the arrow keeps
	// its value while it fades out. A plain record: it keeps history and does
	// not drive rendering on its own.
	const seen: Record<string, { rank: number; direction: number; move: number }> = {};

	const rows = $derived.by(() =>
		[...items]
			.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
			.map((item, i) => {
				const rank = i + 1;
				const move = moves[item.id] ?? 0;
				const prev = seen[item.id];
				const direction =
					prev && prev.rank !== rank ? (rank < prev.rank ? 1 : -1) : (prev?.direction ?? 1);
				const shownMove = move || prev?.move || 0;
				seen[item.id] = { rank, direction, move: shownMove };
				return { ...item, rank, direction, move, shownMove };
			})
	);

	const number = $derived(new Intl.NumberFormat(locale, format));
	// Ordinal suffixes are English words, so other languages hear a plain rank.
	const english = $derived((locale ?? 'en-US').toLowerCase().split(/[-_]/)[0] === 'en');
	const plural = $derived(new Intl.PluralRules(locale ?? 'en-US', { type: 'ordinal' }));
	const rankFormat = $derived(new Intl.NumberFormat(locale ?? 'en-US'));
	function ordinal(n: number) {
		if (!english) return rankFormat.format(n);
		const suffix: Record<string, string> = { one: 'st', two: 'nd', few: 'rd', other: 'th' };
		return `${n}${suffix[plural.select(n)] ?? 'th'}`;
	}

	function initials(name: string) {
		return name
			.split(/\s+/)
			.map((part) => part[0] ?? '')
			.join('')
			.slice(0, 2);
	}

	/**
	 * Rows glide to their new rank from wherever they are on screen, so a
	 * change mid-flight carries on smoothly. Critically damped: a row never
	 * overshoots into the slot of the entry it just passed.
	 */
	function glide(_node: Element, { from, to }: { from: DOMRect; to: DOMRect }): AnimationConfig {
		const dy = from.top - to.top;
		if (!dy || prefersReducedMotion()) return { duration: 0 };
		const { duration: settle, easing } = springs.snappy;
		return { duration: settle, easing, css: (_t, u) => `translate: 0 ${u * dy}px` };
	}

	/** The old rank rolls out the way the row is heading and the new one follows it in. */
	function roll(
		_node: Element,
		{ direction, exit = false }: { direction: number; exit?: boolean }
	): TransitionConfig {
		if (prefersReducedMotion()) {
			return { duration: duration.fast, css: (t) => `opacity: ${t}` };
		}
		const { duration: settle, easing } = springs.snappy;
		const offset = (exit ? -direction : direction) * 100;
		return {
			duration: exit ? duration.fast : settle,
			easing: exit ? easeIn : easing,
			css: (t, u) => `opacity: ${t}; translate: 0 ${u * offset}%`
		};
	}
</script>

<ol
	bind:this={ref}
	aria-label={label}
	class={cn('bg-card @container flex w-full flex-col rounded-2xl p-1.5 shadow-sm', className)}
	{...restProps}
>
	{#each rows as row (row.id)}
		<!-- Climbers pass over fallers, so crossing rows never interleave. -->
		<li
			animate:glide
			class={cn(
				'bg-card relative flex h-13 items-center gap-2.5 rounded-[18px] px-3',
				row.move > 0 ? 'z-[2]' : row.move < 0 ? 'z-[1]' : 'z-0'
			)}
		>
			<!-- A restrained podium: the leader inverts, second and third get a quiet
			     fill, everyone else is plain muted text. -->
			<span
				aria-hidden="true"
				class={cn(
					'relative grid size-7 shrink-0 place-items-center overflow-hidden rounded-full text-sm tabular-nums transition-colors duration-(--duration-base) ease-out',
					row.rank === 1 && 'bg-primary text-primary-foreground font-semibold',
					(row.rank === 2 || row.rank === 3) && 'bg-secondary text-foreground font-semibold',
					row.rank > 3 && 'text-muted-foreground'
				)}
			>
				{#key row.rank}
					<span
						class="col-start-1 row-start-1"
						in:roll={{ direction: row.direction }}
						out:roll={{ direction: row.direction, exit: true }}
					>
						{row.rank}
					</span>
				{/key}
			</span>
			<!-- Narrow lists drop the avatar so names keep their room. -->
			<span
				aria-hidden="true"
				class="bg-secondary text-foreground grid size-8 shrink-0 place-items-center overflow-hidden rounded-full text-xs font-medium @max-[22rem]:hidden"
			>
				{#if row.avatar}
					<img src={row.avatar} alt="" draggable="false" class="size-full object-cover" />
				{:else}
					{initials(row.name)}
				{/if}
			</span>
			<span class="text-foreground min-w-0 flex-1 truncate text-sm">
				<span class="sr-only">{`${ordinal(row.rank)}, `}</span>{row.name}<span class="sr-only"
					>{`, ${number.format(row.score)} ${unit}`}</span
				>
			</span>
			<!-- Scales in on a spring and falls away faster on a plain curve. -->
			<span
				aria-hidden="true"
				class={cn(
					'flex w-8 shrink-0 items-center justify-end gap-0.5 text-xs font-medium tabular-nums',
					row.shownMove > 0 ? 'text-foreground' : 'text-muted-foreground',
					row.move
						? 'blur-none [transition:scale_var(--duration-spring)_var(--ease-spring),opacity_var(--duration-fast)_var(--ease-out),filter_var(--duration-fast)_var(--ease-out)]'
						: 'scale-25 opacity-0 blur-[4px] transition-[scale,opacity,filter] duration-(--duration-base) ease-in motion-reduce:scale-100 motion-reduce:blur-none'
				)}
			>
				<ArrowUp class={cn('size-3', row.shownMove < 0 && 'rotate-180')} />
				{Math.abs(row.shownMove) || ''}
			</span>
			<span
				aria-hidden="true"
				class="text-foreground min-w-12 shrink-0 text-end text-sm font-medium"
			>
				<NumberTicker value={row.score} {locale} {format} />
			</span>
		</li>
	{/each}
</ol>
