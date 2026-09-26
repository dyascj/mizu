<script lang="ts">
	import ExpandingCard from './expanding-card.svelte';

	let {
		open = $bindable(false),
		onOpenChange,
		onclick
	}: {
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		onclick?: (event: MouseEvent) => void;
	} = $props();
</script>

<ExpandingCard
	bind:open
	{onOpenChange}
	{onclick}
	title="Churn interviews"
	meta="Aug 30"
	summary="Onboarding drove most cancellations."
>
	<p>Summarised from 22 call transcripts.</p>
	<a href="#transcripts">Open transcripts</a>
</ExpandingCard>
