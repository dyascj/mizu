<script lang="ts">
	import { AuraTile } from '$lib/components/ui/aura-tile';

	const styles = ['Aura Waves', 'Neon Dreams', 'Riptide', 'Golden Hour'];
	let selected = $state('Neon Dreams');
</script>

<div role="group" aria-label="Assistant style" class="grid w-full max-w-sm grid-cols-4 gap-3">
	{#each styles as style (style)}
		<button
			type="button"
			aria-pressed={selected === style}
			class="group focus-visible:ring-ring flex flex-col gap-1.5 rounded-xl outline-none focus-visible:ring-2"
			onclick={() => (selected = style)}
		>
			<AuraTile seed={style} selected={selected === style} class="w-full" />
			<span
				class="text-muted-foreground group-hover:text-foreground min-h-8 text-center text-xs leading-snug"
				>{style}</span
			>
		</button>
	{/each}
</div>
