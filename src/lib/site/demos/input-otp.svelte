<script lang="ts">
	import * as InputOTP from '$lib/components/ui/input-otp';

	let value = $state('');
</script>

<InputOTP.Root maxlength={6} bind:value>
	{#snippet children({ cells })}
		{#each cells as cell (cell)}
			<InputOTP.Slot {cell} />
		{/each}
	{/snippet}
</InputOTP.Root>
