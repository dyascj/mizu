<script lang="ts" module>
	import type { CodeLanguage } from './highlight.js';

	export type CodeFile = {
		/** File name, shown on its tab. Also picks the language from its extension. */
		name: string;
		/** The source. Leading and trailing blank lines are trimmed. */
		code: string;
		/** Overrides the language guessed from the name. `text` turns highlighting off. */
		language?: CodeLanguage;
	};
</script>

<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { CopyButton } from '$lib/components/ui/copy-button';
	import { cn } from '$lib/utils.js';
	import { highlight, languageOf } from './highlight.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** The files, one tab each. A single file shows its name without tabs to switch. */
		files: CodeFile[];
		/** The name of the file showing. Bindable. Defaults to the first. */
		value?: string;
		/** Called with the file name when the reader switches tabs. */
		onValueChange?: (name: string) => void;
		/** Accessible name for the tab list. */
		label?: string;
		/** Shows line numbers, which stay put while long lines scroll sideways. */
		lineNumbers?: boolean;
		/** The block element. */
		ref?: HTMLDivElement | null;
		/**
		 * Classes for the block. The code area is 18rem tall; change it with
		 * `[--code-block-height:24rem]`.
		 */
		class?: string;
	};

	let {
		files,
		value = $bindable(),
		onValueChange,
		label = 'Files',
		lineNumbers = true,
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	const uid = $props.id();

	const trimmed = $derived(files.map((file) => file.code.replace(/^\s*\n|\s+$/g, '')));
	const highlighted = $derived(
		files.map((file, index) => highlight(trimmed[index], file.language ?? languageOf(file.name)))
	);
	const active = $derived(
		Math.max(
			0,
			files.findIndex((file) => file.name === value)
		)
	);

	const tabs: HTMLButtonElement[] = [];
	let list: HTMLDivElement | null = null;
	let underline: HTMLSpanElement | null = null;
	/** Set after the first measurement, so the underline never slides in from nowhere. */
	let measured = $state(false);

	function select(index: number) {
		const name = files[index]?.name;
		if (name === undefined || name === value) return;
		value = name;
		onValueChange?.(name);
	}

	// The underline is one element that travels between tabs: measured from
	// the tab's box, inset to its label, and moved with the snappy spring.
	function measure() {
		const tab = tabs[active];
		if (!tab || !underline) return;
		underline.style.translate = `${tab.offsetLeft + 12}px 0`;
		underline.style.width = `${Math.max(0, tab.offsetWidth - 24)}px`;
		measured = true;
	}

	$effect(() => {
		void active;
		void files.length;
		measure();
	});

	// Fonts and container width change tab widths after the first paint.
	$effect(() => {
		if (!list || typeof ResizeObserver === 'undefined') return;
		const observer = new ResizeObserver(() => measure());
		observer.observe(list);
		return () => observer.disconnect();
	});

	function onkeydown(event: KeyboardEvent, index: number) {
		const count = files.length;
		const next =
			event.key === 'ArrowRight'
				? (index + 1) % count
				: event.key === 'ArrowLeft'
					? (index - 1 + count) % count
					: event.key === 'Home'
						? 0
						: event.key === 'End'
							? count - 1
							: null;
		if (next === null) return;
		event.preventDefault();
		select(next);
		tabs[next]?.focus();
	}
</script>

<div
	{...restProps}
	bind:this={ref}
	data-slot="code-block"
	class={cn(
		'bg-secondary text-secondary-foreground w-full overflow-hidden rounded-2xl',
		// Quiet, neutral highlighting. Every token carries data-token, so a theme
		// can color them: [&_[data-token=string]]:text-success, for example.
		'[&_[data-token=comment]]:text-muted-foreground [&_[data-token=string]]:text-muted-foreground [&_[data-token=comment]]:italic [&_[data-token=keyword]]:font-medium [&_[data-token=number]]:font-medium',
		className
	)}
>
	<div
		class="flex h-11 items-stretch justify-between gap-2 pr-1.5 pl-2 shadow-[inset_0_-1px_0_var(--border)]"
	>
		<div
			bind:this={list}
			role="tablist"
			aria-label={label}
			class="relative flex min-w-0 [scrollbar-width:none] overflow-x-auto"
		>
			{#each files as file, index (file.name)}
				{@const selected = index === active}
				<button
					bind:this={tabs[index]}
					id="{uid}-tab-{index}"
					type="button"
					role="tab"
					aria-selected={selected}
					aria-controls="{uid}-panel-{index}"
					tabindex={selected ? 0 : -1}
					class={cn(
						'group/tab focus-visible:ring-ring relative shrink-0 touch-manipulation px-3 font-mono text-[13px] transition-colors duration-(--duration-fast) ease-out outline-none select-none focus-visible:ring-2 focus-visible:ring-inset',
						selected ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
					)}
					onclick={() => select(index)}
					onkeydown={(event) => onkeydown(event, index)}
				>
					<!-- Press feedback on the label only, so the underline is never
					     measured mid-scale. -->
					<span
						class="inline-block transition-[scale] duration-(--duration-fast) ease-out group-active/tab:scale-[0.96] motion-reduce:transition-none"
					>
						{file.name}
					</span>
				</button>
			{/each}
			<!-- Sits on the header's divider, so the two read as one line. -->
			<span
				bind:this={underline}
				aria-hidden="true"
				class={cn(
					'bg-primary pointer-events-none absolute bottom-0 left-0 h-0.5 rounded-full',
					measured
						? 'ease-spring-snappy transition-[translate,width] duration-(--duration-spring-snappy) motion-reduce:transition-none'
						: 'opacity-0'
				)}
			></span>
		</div>
		<div class="flex shrink-0 items-center">
			<CopyButton
				value={trimmed[active] ?? ''}
				label="Copy {files[active]?.name ?? 'code'}"
				size="sm"
			/>
		</div>
	</div>

	<!-- Every file keeps its own scroll box, stacked in one cell, so switching
	     is a true crossfade and each file remembers where you scrolled to. -->
	<div class="relative h-(--code-block-height,18rem)">
		{#each files as file, index (file.name)}
			{@const selected = index === active}
			<div
				id="{uid}-panel-{index}"
				role="tabpanel"
				aria-labelledby="{uid}-tab-{index}"
				tabindex={selected ? 0 : -1}
				inert={!selected}
				class={cn(
					'focus-visible:ring-ring absolute inset-0 overflow-auto overscroll-contain outline-none focus-visible:ring-2 focus-visible:ring-inset',
					'transition-[opacity,filter] ease-out motion-reduce:transition-opacity',
					selected
						? 'opacity-100 blur-none duration-(--duration-base)'
						: 'opacity-0 blur-[4px] duration-(--duration-fast) motion-reduce:blur-none'
				)}
			>
				<pre class="min-w-max py-3 font-mono text-[13px] leading-6"><code
						>{#each highlighted[index] as line, number (number)}<span class="flex min-h-6"
								>{#if lineNumbers}<span
										aria-hidden="true"
										class="bg-secondary text-muted-foreground sticky left-0 w-11 shrink-0 pr-4 text-right tabular-nums select-none"
										>{number + 1}</span
									>{/if}<span class={cn('pr-5 whitespace-pre', !lineNumbers && 'pl-4')}
									>{#each line as token, t (t)}{#if token.kind === 'plain'}{token.text}{:else}<span
												data-token={token.kind}>{token.text}</span
											>{/if}{/each}</span
								></span
							>{/each}</code
					></pre>
			</div>
		{/each}
	</div>
</div>
