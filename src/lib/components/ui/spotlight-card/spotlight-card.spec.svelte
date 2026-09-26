<script lang="ts">
	import SpotlightCard from './spotlight-card.svelte';
	import SpotlightGroup from './spotlight-group.svelte';

	let {
		grouped = true,
		onpointermove,
		onpointerleave
	}: {
		grouped?: boolean;
		onpointermove?: (event: PointerEvent) => void;
		onpointerleave?: (event: PointerEvent) => void;
	} = $props();
</script>

{#snippet icon()}
	<svg data-testid="icon"></svg>
{/snippet}

{#if grouped}
	<SpotlightGroup data-testid="group">
		<SpotlightCard data-testid="first" {icon}><h3>Long context</h3></SpotlightCard>
		<SpotlightCard data-testid="second"><h3>Tool use</h3></SpotlightCard>
	</SpotlightGroup>
{:else}
	<SpotlightCard data-testid="alone" {icon} {onpointermove} {onpointerleave}>
		<h3>Long context</h3>
	</SpotlightCard>
{/if}
