<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import Check from '@lucide/svelte/icons/check';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** Any string; the same seed always paints the same aura. */
		seed: string;
		/** Show the selected ring and check. */
		selected?: boolean;
		class?: string;
		ref?: HTMLDivElement | null;
	};

	let {
		seed,
		selected = false,
		class: className,
		ref = $bindable(null),
		...rest
	}: Props = $props();

	// The pastel family the whole system draws from.
	const HUES = ['#ffd9e8', '#e6d9ff', '#cfe9ff', '#ffedd6', '#dffdf1', '#feefff'];

	function hash(input: string) {
		let h = 2166136261;
		for (let i = 0; i < input.length; i++) {
			h ^= input.charCodeAt(i);
			h = Math.imul(h, 16777619);
		}
		return h >>> 0;
	}

	const background = $derived.by(() => {
		const h = hash(seed);
		const pick = (n: number) => HUES[(h >>> (n * 4)) % HUES.length];
		const pos = (n: number, min: number, max: number) =>
			min + (((h >>> (n * 3)) % 97) / 97) * (max - min);
		return [
			`radial-gradient(70% 70% at ${pos(1, 10, 40)}% ${pos(2, 10, 40)}%, ${pick(0)} 0%, transparent 65%)`,
			`radial-gradient(65% 65% at ${pos(3, 60, 90)}% ${pos(4, 15, 50)}%, ${pick(1)} 0%, transparent 65%)`,
			`radial-gradient(75% 75% at ${pos(5, 25, 75)}% ${pos(6, 60, 90)}%, ${pick(2)} 0%, transparent 68%)`,
			`linear-gradient(180deg, ${pick(3)} 0%, ${pick(4)} 100%)`
		].join(', ');
	});
</script>

<div
	bind:this={ref}
	class={cn(
		'relative aspect-square overflow-hidden rounded-xl transition-shadow',
		selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
		className
	)}
	style="background-image: {background};"
	{...rest}
>
	{#if selected}
		<span
			class="absolute right-1.5 bottom-1.5 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm"
		>
			<Check class="size-3" strokeWidth={3} />
		</span>
	{/if}
</div>
