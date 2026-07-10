<script lang="ts">
	import { AuraTile } from '$lib/components/ui/aura-tile';

	const styles = ['Aura Waves', 'Neon Dreams', 'Riptide', 'Golden Hour'];
	let selected = $state('Neon Dreams');
</script>

<div class="grid w-full max-w-sm grid-cols-4 gap-3">
	{#each styles as style (style)}
		<button
			type="button"
			class="group flex flex-col gap-1.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
			onclick={() => (selected = style)}
		>
			<AuraTile seed={style} selected={selected === style} class="w-full" />
			<span class="truncate text-xs text-muted-foreground group-hover:text-foreground">{style}</span
			>
		</button>
	{/each}
</div>
