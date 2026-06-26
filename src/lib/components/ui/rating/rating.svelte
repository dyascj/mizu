<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import DropletIcon from '@lucide/svelte/icons/droplet';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> & {
		value?: number;
		max?: number;
		readonly?: boolean;
		disabled?: boolean;
		size?: number;
		name?: string;
		allowHalf?: boolean;
		class?: string;
		onValueChange?: (value: number) => void;
	};

	let {
		value = $bindable(0),
		max = 5,
		readonly = false,
		disabled = false,
		size = 24,
		name,
		allowHalf = false,
		class: className,
		onValueChange,
		...rest
	}: Props = $props();

	let hover = $state<number | null>(null);

	const interactive = $derived(!readonly && !disabled);
	const step = $derived(allowHalf ? 0.5 : 1);
	/* The score that actually paints: a live hover preview when interactive,
	   otherwise the committed value (clamped to range). */
	const display = $derived(hover ?? Math.max(0, Math.min(max, value ?? 0)));

	function clamp(v: number) {
		return Math.max(0, Math.min(max, Math.round(v / step) * step));
	}

	function commit(v: number) {
		const next = clamp(v);
		if (next === value) return;
		value = next;
		onValueChange?.(next);
	}

	/* Fraction (0, 0.5, 1) filled for the droplet at 1-based position `i`. */
	function fillOf(i: number) {
		const d = display - (i - 1);
		if (d >= 1) return 1;
		if (d >= 0.5 && allowHalf) return 0.5;
		if (d > 0 && !allowHalf) return 1;
		return 0;
	}

	/* Resolve the droplet (and half, when enabled) under the pointer from a
	   container-level event, so the droplets themselves stay non-interactive
	   and never nest an interactive control inside the slider. */
	function valueFromEvent(e: MouseEvent): number | null {
		const el = (e.target as HTMLElement).closest<HTMLElement>('[data-rating-index]');
		if (!el) return null;
		const i = Number(el.dataset.ratingIndex);
		if (!allowHalf) return i;
		const { left, width } = el.getBoundingClientRect();
		return e.clientX - left < width / 2 ? i - 0.5 : i;
	}

	function handleMove(e: MouseEvent) {
		if (!interactive) return;
		const v = valueFromEvent(e);
		if (v !== null) hover = v;
	}

	function handleClick(e: MouseEvent) {
		if (!interactive) return;
		const v = valueFromEvent(e);
		if (v !== null) commit(v);
	}

	function onkeydown(e: KeyboardEvent) {
		if (!interactive) return;
		let next = value ?? 0;
		switch (e.key) {
			case 'ArrowRight':
			case 'ArrowUp':
				next = (value ?? 0) + step;
				break;
			case 'ArrowLeft':
			case 'ArrowDown':
				next = (value ?? 0) - step;
				break;
			case 'Home':
				next = 0;
				break;
			case 'End':
				next = max;
				break;
			default:
				return;
		}
		e.preventDefault();
		commit(next);
	}
</script>

<div
	role="slider"
	aria-valuemin={0}
	aria-valuemax={max}
	aria-valuenow={value ?? 0}
	aria-label={rest['aria-label'] ?? `Rating, ${value ?? 0} of ${max}`}
	aria-readonly={readonly || undefined}
	aria-disabled={disabled || undefined}
	tabindex={interactive ? 0 : -1}
	{onkeydown}
	onmousemove={handleMove}
	onclick={handleClick}
	onmouseleave={() => (hover = null)}
	class={cn(
		'inline-flex items-center gap-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
		interactive && 'cursor-pointer',
		disabled && 'pointer-events-none opacity-50',
		className
	)}
	{...rest}
>
	{#each { length: max } as _, idx (idx)}
		{@const i = idx + 1}
		{@const fill = fillOf(i)}
		<span
			data-rating-index={i}
			aria-hidden="true"
			class={cn(
				'relative inline-grid place-items-center transition-[scale] duration-150 ease-out',
				interactive && 'hover:scale-110 active:scale-[0.96]'
			)}
			style="width: {size}px; height: {size}px;"
		>
			<!-- Empty outline base -->
			<DropletIcon
				class="absolute inset-0 m-auto text-muted-foreground/40"
				{size}
				strokeWidth={1.75}
			/>
			<!-- Filled overlay, clipped to the fill fraction. The inner icon keeps
			     the full droplet's position so a half clip reveals its left half. -->
			{#if fill > 0}
				<span
					class="absolute top-0 left-0 h-full overflow-hidden"
					style="width: {fill === 0.5 ? size / 2 : size}px;"
					aria-hidden="true"
				>
					<DropletIcon
						class="absolute top-0 left-0 text-mizu-500 drop-shadow-[0_1px_3px_color-mix(in_oklab,var(--primary)_55%,transparent)]"
						{size}
						fill="currentColor"
						strokeWidth={1.75}
					/>
				</span>
			{/if}
		</span>
	{/each}

	{#if name}
		<input type="hidden" {name} value={value ?? 0} />
	{/if}
</div>
