<script lang="ts" module>
	export type CodeMorphStep = {
		/** Short tab label, such as "Step 1". */
		label: string;
		/** One line on what changed, shown under the code. */
		title: string;
		/** The code at this step. Leading and trailing blank lines are trimmed. */
		code: string;
	};

	type Kind = 'keyword' | 'string' | 'number' | 'comment' | 'fn' | 'type' | 'punct' | 'plain';
	type Token = { text: string; kind: Kind; row: number; col: number };
	type Placed = Token & { id: number; state: 'idle' | 'stay' | 'enter' | 'exit' };

	const KEYWORDS = new Set(
		'import from export default function return const let var if else new true false null undefined async await try catch finally throw typeof for of in while class extends yield'.split(
			' '
		)
	);

	// Alternatives in priority order, so a number inside a string stays part of
	// the string. Multi-character operators come first so `=>` moves as one
	// piece rather than two.
	const PATTERN =
		/(\/\/[^\n]*|#[^\n]*)|("[^"\n]*"|'[^'\n]*'|`[^`]*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)|(=>|===|!==|&&|\|\||\?\.|\.\.\.|[^\s\w])/g;

	/**
	 * Splits code into tokens with a row and column. Whitespace never becomes a
	 * token, it only moves the cursor, so re-indenting a line moves its tokens
	 * instead of replacing them.
	 */
	function tokenize(code: string): Token[] {
		const out: Token[] = [];
		let row = 0;
		let col = 0;
		let last = 0;
		const advance = (text: string) => {
			for (const ch of text) {
				if (ch === '\n') {
					row++;
					col = 0;
				} else col++;
			}
		};
		for (const m of code.matchAll(PATTERN)) {
			const index = m.index ?? 0;
			advance(code.slice(last, index));
			const text = m[0];
			let kind: Kind = 'plain';
			if (m[1]) kind = 'comment';
			else if (m[2]) kind = 'string';
			else if (m[3]) kind = 'number';
			else if (m[5]) kind = 'punct';
			else if (KEYWORDS.has(text)) kind = 'keyword';
			else if (code[index + text.length] === '(') kind = 'fn';
			else if (/^[A-Z]/.test(text)) kind = 'type';
			out.push({ text, kind, row, col });
			advance(text);
			last = index + text.length;
		}
		return out;
	}

	/**
	 * Longest common subsequence over token text and kind. Returns, for every
	 * token in `b`, the index of its partner in `a`, or -1 when it is new.
	 */
	function match(a: Token[], b: Token[]): number[] {
		const n = a.length;
		const m = b.length;
		const w = m + 1;
		const table = new Uint16Array((n + 1) * w);
		const same = (i: number, j: number) => a[i].text === b[j].text && a[i].kind === b[j].kind;
		for (let i = n - 1; i >= 0; i--)
			for (let j = m - 1; j >= 0; j--)
				table[i * w + j] = same(i, j)
					? table[(i + 1) * w + j + 1] + 1
					: Math.max(table[(i + 1) * w + j], table[i * w + j + 1]);
		const pairs = new Array<number>(m).fill(-1);
		let i = 0;
		let j = 0;
		while (i < n && j < m) {
			if (same(i, j)) {
				pairs[j] = i;
				i++;
				j++;
			} else if (table[(i + 1) * w + j] >= table[i * w + j + 1]) i++;
			else j++;
		}
		return pairs;
	}

	/** Syntax in Mizu's neutral voice: structure recedes, names and values stay forward. */
	const TONES: Record<Kind, string> = {
		keyword: 'text-muted-foreground',
		string: 'text-foreground',
		number: 'text-foreground',
		comment: 'text-muted-foreground italic',
		fn: 'text-foreground font-medium',
		type: 'text-foreground font-medium',
		punct: 'text-muted-foreground',
		plain: 'text-foreground'
	};

	/** Line height in pixels. Tokens sit on this grid, so it is also how far a token travels when a line is inserted above it. */
	const LINE = 22;
	/** Vertical padding of the code area, top and bottom. */
	const PAD = 16;
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { CopyButton } from '$lib/components/ui/copy-button';
	import { blurIn, duration } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** The versions of the code, in order. Each becomes a tab. */
		steps: CodeMorphStep[];
		/** The step on show. Bind it to drive the morph from outside. */
		step?: number;
		/** Called with the new step when the reader picks one. */
		onStepChange?: (step: number) => void;
		/** Accessible name for the row of step tabs. */
		label?: string;
		/** The root element. */
		ref?: HTMLDivElement | null;
		/** Classes for the root. */
		class?: string;
	};

	let {
		steps,
		step = $bindable(0),
		onStepChange,
		label = 'Code steps',
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	const uid = $props.id();
	const sources = $derived(steps.map((s) => s.code.replace(/^\s*\n|\s+$/g, '')));
	const tokens = $derived(sources.map(tokenize));
	const rows = $derived(sources.map((s) => s.split('\n').length));
	const cols = $derived(Math.max(0, ...sources.flatMap((s) => s.split('\n').map((l) => l.length))));
	const maxRows = $derived(Math.max(1, ...rows));

	let nextId = 0;
	const initial = untrack(() => Math.min(Math.max(0, step), steps.length - 1));
	let view = $state<{ step: number; source: string; items: Placed[]; added: Set<number> }>(
		untrack(() => {
			const first = tokens[initial] ?? [];
			nextId = first.length;
			return {
				step: initial,
				source: sources[initial] ?? '',
				items: first.map((t, i) => ({ ...t, id: i, state: 'idle' })),
				added: new Set()
			};
		})
	);

	/**
	 * Diffs the next step against what is on screen, token by token. Shared
	 * tokens keep their identity and glide to their new line and column, the
	 * way a slide transition carries objects across, so the reader sees what
	 * moved instead of rereading the block.
	 */
	function go(next: number) {
		// The same step with new code morphs too, so edited steps never show stale tokens.
		if (!tokens[next] || (next === view.step && sources[next] === view.source)) return;
		// Tokens still fading out from the last change are already leaving and
		// would only muddy this diff.
		const prev = view.items.filter((t) => t.state !== 'exit');
		const target = tokens[next];
		const pairs = match(prev, target);
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- a local lookup, never rendered
		const partnerOf = new Map<number, number>();
		pairs.forEach((partner, j) => partner >= 0 && partnerOf.set(partner, j));
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- replaced whole with each step, never mutated after
		const added = new Set<number>();
		// Kept and leaving tokens stay in their old order and new ones join at
		// the end, so no element moves in the document and every glide is a
		// plain transition.
		const items: Placed[] = prev.map((t, i) => {
			const j = partnerOf.get(i);
			return j === undefined ? { ...t, state: 'exit' } : { ...target[j], id: t.id, state: 'stay' };
		});
		target.forEach((t, j) => {
			if (pairs[j] >= 0) return;
			added.add(t.row);
			items.push({ ...t, id: nextId++, state: 'enter' });
		});
		view = { step: next, source: sources[next], items, added };
	}

	function select(next: number) {
		go(next);
		if (step !== next) {
			step = next;
			onStepChange?.(next);
		}
	}

	// Outside control, and new code for the step on show, drive the same morph.
	$effect(() => {
		const next = step;
		void sources[next];
		untrack(() => go(next));
	});

	let tabs: HTMLButtonElement[] = $state([]);

	function onkeydown(event: KeyboardEvent) {
		const last = steps.length - 1;
		const next = view.step === last ? 0 : view.step + 1;
		const back = view.step === 0 ? last : view.step - 1;
		// The tabs mirror in right-to-left text, so the arrows follow what is on screen.
		const rtl = getComputedStyle(event.currentTarget as Element).direction === 'rtl';
		const target = {
			ArrowRight: rtl ? back : next,
			ArrowLeft: rtl ? next : back,
			Home: 0,
			End: last
		}[event.key];
		if (target === undefined) return;
		event.preventDefault();
		select(target);
		tabs[target]?.focus();
	}

	// The pill slides under the selected tab.
	let pill = $state<{ left: number; width: number }>();
	$effect(() => {
		const tab = tabs[view.step];
		if (!tab) return;
		const measure = () => (pill = { left: tab.offsetLeft, width: tab.offsetWidth });
		measure();
		if (typeof ResizeObserver === 'undefined') return;
		const observer = new ResizeObserver(measure);
		observer.observe(tab);
		return () => observer.disconnect();
	});

	const current = $derived(steps[view.step]);
	const code = $derived(sources[view.step] ?? '');
</script>

<div
	{...restProps}
	bind:this={ref}
	class={cn('bg-card w-full max-w-xl min-w-0 overflow-hidden rounded-2xl shadow-sm', className)}
>
	<div class="flex items-center justify-between gap-3 p-2">
		<div
			role="tablist"
			aria-label={label}
			tabindex="-1"
			class="bg-secondary relative isolate flex min-w-0 [scrollbar-width:none] items-center overflow-x-auto rounded-full p-1"
			{onkeydown}
		>
			{#if pill}
				<span
					aria-hidden="true"
					class="bg-card dark:bg-control absolute top-1 bottom-1 left-0 -z-10 rounded-full shadow-sm transition-[translate,width] duration-(--duration-spring) ease-(--ease-spring) motion-reduce:transition-none"
					style:translate="{pill.left}px 0"
					style:width="{pill.width}px"
				></span>
			{/if}
			{#each steps as s, i (i)}
				<button
					bind:this={tabs[i]}
					type="button"
					role="tab"
					id="{uid}-tab-{i}"
					aria-selected={i === view.step}
					aria-controls="{uid}-panel"
					tabindex={i === view.step ? 0 : -1}
					onclick={() => select(i)}
					class={cn(
						'focus-visible:ring-ring h-8 shrink-0 rounded-full px-3 text-sm font-medium whitespace-nowrap transition-[color,scale] duration-(--duration-fast) ease-out outline-none select-none focus-visible:ring-2 active:scale-[0.96]',
						i === view.step ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
					)}>{s.label}</button
				>
			{/each}
		</div>
		<CopyButton value={code} label="Copy code" size="sm" />
	</div>

	<!-- Code reads left to right in any language. -->
	<div
		role="tabpanel"
		dir="ltr"
		id="{uid}-panel"
		aria-labelledby="{uid}-tab-{view.step}"
		tabindex="0"
		class="focus-visible:ring-ring overflow-x-auto overflow-y-hidden outline-none focus-visible:ring-2 focus-visible:ring-inset"
	>
		<pre class="sr-only">{code}</pre>
		<!-- Fits the current step, so a short step leaves no empty editor below
		     it; the footer rides the edge down in step with the lines. -->
		<div
			aria-hidden="true"
			class="code-morph relative flex font-mono text-[0.8125rem] transition-[height] duration-(--duration-deliberate) ease-in-out motion-reduce:transition-none"
			style:height="{(rows[view.step] ?? 1) * LINE + PAD * 2}px"
			style:line-height="{LINE}px"
			style:padding-block="{PAD}px"
		>
			<!-- Rows that gained code in this step, so the eye knows where to look
			     once the motion settles. -->
			{#each { length: maxRows } as _, r (r)}
				<span
					class={cn(
						'bg-success/10 pointer-events-none absolute inset-x-0 z-20 transition-opacity ease-out',
						view.added.has(r)
							? 'opacity-100 delay-(--duration-slow) duration-(--duration-slow)'
							: 'opacity-0 duration-(--duration-fast)'
					)}
					style:top="{PAD + r * LINE}px"
					style:height="{LINE}px"
				></span>
			{/each}
			<div
				class="bg-card text-muted-foreground sticky left-0 z-10 shrink-0 px-4 text-right tabular-nums select-none"
			>
				{#each { length: maxRows } as _, r (r)}
					<div
						class={cn(
							'transition-opacity duration-(--duration-fast) ease-out',
							r < (rows[view.step] ?? 0) ? 'opacity-100' : 'opacity-0'
						)}
					>
						{r + 1}
					</div>
				{/each}
			</div>
			<div class="relative shrink-0 whitespace-pre" style:width="calc({cols}ch + 1.25rem)">
				{#each view.items as t (t.id)}
					<span
						class={cn(
							'code-morph-token absolute top-0 left-0 rounded-[0.1875rem]',
							t.state === 'exit' ? 'text-destructive bg-destructive/10' : TONES[t.kind],
							t.state === 'enter' && 'code-morph-enter',
							t.state === 'exit' && 'code-morph-exit'
						)}
						style:transform="translate({t.col}ch, {t.row * LINE}px)">{t.text}</span
					>
				{/each}
			</div>
		</div>
	</div>

	<div class="flex h-12 items-center gap-3 px-4 text-sm">
		<span class="text-muted-foreground shrink-0 font-medium tabular-nums"
			>{view.step + 1}/{steps.length}</span
		>
		<div class="grid min-w-0 flex-1">
			{#key view.step}
				<p
					class="col-start-1 row-start-1 truncate"
					in:blurIn={{ duration: duration.base, y: 4, blur: 4 }}
					out:blurIn={{ duration: duration.instant, y: 0, blur: 2 }}
				>
					{current?.title}
				</p>
			{/key}
		</div>
	</div>
</div>

<style>
	/* Moves take a deliberate beat, past the usual UI ceiling on purpose: this
	   is explanatory motion, and the eye has to follow each token to its new
	   place. New tokens wait for the moves to open space; removed ones hold
	   their tint for a beat before they go. */
	.code-morph-token {
		transition:
			transform var(--duration-deliberate) var(--ease-in-out),
			color var(--duration-fast) var(--ease-out),
			background-color var(--duration-fast) var(--ease-out);
	}

	.code-morph-enter {
		animation: code-morph-enter var(--duration-base) var(--ease-out) var(--duration-slow) both;
	}

	.code-morph-exit {
		animation: code-morph-exit var(--duration-slow) var(--ease-in) both;
	}

	@keyframes code-morph-enter {
		from {
			opacity: 0;
			filter: blur(4px);
			translate: 0 4px;
		}
	}

	@keyframes code-morph-exit {
		0%,
		40% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			filter: blur(2px);
			translate: 0 -3px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.code-morph-token {
			transition:
				color var(--duration-fast) var(--ease-out),
				background-color var(--duration-fast) var(--ease-out);
		}

		.code-morph-enter {
			animation: code-morph-fade-in var(--duration-fast) var(--ease-out) both;
		}

		.code-morph-exit {
			animation: code-morph-fade-out var(--duration-fast) var(--ease-in) both;
		}
	}

	@keyframes code-morph-fade-in {
		from {
			opacity: 0;
		}
	}

	@keyframes code-morph-fade-out {
		to {
			opacity: 0;
		}
	}
</style>
