<script lang="ts">
	import { Nudge } from '$lib/components/ui/nudge';
	import { Button } from '$lib/components/ui/button';
	import { toast } from '$lib/components/ui/toast';

	let visible = $state(true);

	function dismiss() {
		visible = false;
		setTimeout(() => (visible = true), 1200);
	}
</script>

<div class="flex min-h-32 w-full max-w-sm items-center">
	{#if visible}
		<Nudge
			title="Just found a cafe you might like"
			description="Quiet, good espresso, 2.1 miles from work."
			onDismiss={dismiss}
		>
			{#snippet actions()}
				<Button size="sm" onclick={() => toast.success('Directions on the way')}>Take me there</Button>
				<Button size="sm" variant="ghost" onclick={dismiss}>Not now</Button>
			{/snippet}
		</Nudge>
	{/if}
</div>
