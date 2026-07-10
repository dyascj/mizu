<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import XIcon from '@lucide/svelte/icons/x';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> & {
		value?: string[];
		placeholder?: string;
		disabled?: boolean;
		max?: number;
		name?: string;
		dedupe?: boolean;
		validate?: (tag: string) => boolean;
		class?: string;
		onValueChange?: (value: string[]) => void;
	};

	let {
		value = $bindable([]),
		placeholder,
		disabled = false,
		max,
		name,
		dedupe = true,
		validate,
		class: className,
		onValueChange,
		...rest
	}: Props = $props();

	let draft = $state('');
	let inputEl = $state<HTMLInputElement | null>(null);

	const atMax = $derived(max != null && value.length >= max);

	function setValue(next: string[]) {
		value = next;
		onValueChange?.(next);
	}

	function addTag(raw: string) {
		const tag = raw.trim();
		if (!tag || disabled || atMax) return;
		if (dedupe && value.includes(tag)) return;
		if (validate && !validate(tag)) return;
		setValue([...value, tag]);
	}

	function removeAt(index: number) {
		if (disabled) return;
		setValue(value.filter((_, i) => i !== index));
	}

	function commitDraft() {
		if (!draft.trim()) return;
		addTag(draft);
		draft = '';
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ',') {
			e.preventDefault();
			commitDraft();
		} else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
			e.preventDefault();
			removeAt(value.length - 1);
		}
	}
</script>

<div
	class={cn(
		'flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-xl border border-input bg-card/70 px-2 py-1.5 text-sm outline-none transition-[box-shadow,border-color] duration-150 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/35',
		disabled && 'cursor-not-allowed opacity-50',
		className
	)}
	onmousedown={(e) => {
		if (e.target === e.currentTarget) inputEl?.focus();
	}}
	{...rest}
>
	<ul class="contents">
		{#each value as tag, i (tag + i)}
			<li
				class="bg-primary relative inline-flex items-center gap-1 overflow-hidden rounded-full border border-transparent py-0.5 pr-1 pl-2.5 text-xs font-semibold text-primary-foreground shadow-xs"
			>
				<span class="relative z-10">{tag}</span>
				<button
					type="button"
					{disabled}
					onclick={() => removeAt(i)}
					class="relative z-10 inline-grid size-4 place-items-center rounded-full text-primary-foreground/80 outline-none transition-[background-color,color] duration-150 hover:bg-white/25 hover:text-primary-foreground focus-visible:ring-2 focus-visible:ring-white/70 disabled:pointer-events-none"
				>
					<XIcon class="size-3" />
					<span class="sr-only">Remove {tag}</span>
				</button>
			</li>
		{/each}
	</ul>

	<input
		bind:this={inputEl}
		bind:value={draft}
		type="text"
		{disabled}
		placeholder={atMax ? undefined : placeholder}
		aria-label="Add a tag"
		readonly={atMax}
		{onkeydown}
		onblur={commitDraft}
		class="flex-1 basis-24 bg-transparent text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
	/>

	{#if name}
		{#each value as tag, i (tag + i)}
			<input type="hidden" {name} value={tag} />
		{/each}
	{/if}
</div>
