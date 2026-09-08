<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import XIcon from '@lucide/svelte/icons/x';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> & {
		value?: string[];
		placeholder?: string;
		disabled?: boolean;
		/** Maximum tags, rounded and clamped to the inclusive range 0 to 1000. */
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

	const normalizedMax = $derived(
		max == null
			? undefined
			: Math.min(1000, Math.max(0, Math.round(Number.isFinite(max) ? max : 1000)))
	);
	const atMax = $derived(normalizedMax != null && value.length >= normalizedMax);

	function setValue(next: string[]) {
		value = next;
		onValueChange?.(next);
	}

	function addTag(raw: string) {
		const tag = raw.trim();
		if (!tag || disabled || atMax) return false;
		if (dedupe && value.includes(tag)) return false;
		if (validate && !validate(tag)) return false;
		setValue([...value, tag]);
		return true;
	}

	function removeAt(index: number) {
		if (disabled) return;
		setValue(value.filter((_, i) => i !== index));
	}

	function commitDraft() {
		if (!draft.trim()) return;
		if (addTag(draft)) draft = '';
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.isComposing) return;
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
		'bg-control focus-within:ring-ring flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-2xl px-2.5 py-2 text-sm transition-[box-shadow,border-color] duration-200 outline-none focus-within:ring-2',
		!placeholder && !value.length && !draft && 'ring-input ring-1',
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
				class="bg-primary text-primary-foreground inline-flex min-h-7 max-w-full items-center gap-1 rounded-full pr-1 pl-2.5 text-xs font-medium shadow-xs"
			>
				<span class="min-w-0 break-all">{tag}</span>
				<button
					type="button"
					{disabled}
					onclick={() => removeAt(i)}
					class="text-primary-foreground/80 hover:text-primary-foreground inline-grid size-6 shrink-0 place-items-center rounded-full transition-[background-color,color] duration-200 outline-none hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-white/70 disabled:pointer-events-none"
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
		class="text-foreground placeholder:text-muted-foreground min-w-0 flex-1 basis-24 bg-transparent text-base outline-none disabled:cursor-not-allowed sm:text-sm"
	/>

	{#if name}
		{#each value as tag, i (tag + i)}
			<input type="hidden" {name} value={tag} />
		{/each}
	{/if}
</div>
