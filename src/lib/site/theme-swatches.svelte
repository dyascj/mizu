<script lang="ts">
	import Check from 'phosphor-svelte/lib/Check';
	import { accent, accents, setAccent } from './accent.svelte';
	import { cn } from '$lib/utils.js';

	let { class: className }: { class?: string } = $props();
</script>

<div class={cn('flex flex-wrap items-center gap-1.5', className)}>
	{#each accents as a (a.name)}
		<button
			type="button"
			onclick={() => setAccent(a.name)}
			title={a.name}
			aria-label={`${a.name} accent`}
			aria-pressed={accent.name === a.name}
			class="relative inline-flex size-6 items-center justify-center rounded-full shadow-bevel ring-offset-2 ring-offset-background transition-transform duration-150 hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-95"
			style={`background-color: ${a.color}`}
		>
			{#if accent.name === a.name}
				<Check class="size-3.5 text-white drop-shadow" weight="bold" />
			{/if}
		</button>
	{/each}
</div>
