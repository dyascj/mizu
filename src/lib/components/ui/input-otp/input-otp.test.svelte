<script lang="ts">
	import * as InputOTP from './index.js';
	import type { InputOTPStatus } from './context.js';

	let {
		onVerify,
		invalid
	}: { onVerify?: (code: string) => boolean | Promise<boolean>; invalid?: boolean } = $props();

	let value = $state('');
	let status = $state<InputOTPStatus>('idle');
</script>

<InputOTP.Root
	aria-label="Verification code"
	aria-invalid={invalid}
	maxlength={6}
	bind:value
	bind:status
	{onVerify}
>
	{#snippet children({ cells })}
		{#each cells as cell, index (index)}
			<InputOTP.Slot {cell} />
		{/each}
	{/snippet}
</InputOTP.Root>
<span data-testid="status">{status}</span>
<button type="button" onclick={() => (status = 'error')}>Reject</button>
