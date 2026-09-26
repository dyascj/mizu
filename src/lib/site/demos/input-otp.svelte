<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import * as InputOTP from '$lib/components/ui/input-otp';
	import { cn } from '$lib/utils.js';

	let value = $state('');
	let status = $state<InputOTP.InputOTPStatus>('idle');

	// Stands in for a round trip to the server.
	async function verify(code: string) {
		await new Promise((resolve) => setTimeout(resolve, 600));
		return code === '482913';
	}

	const message = 'col-start-1 row-start-1 flex items-center justify-center gap-1.5';
	const shown = 'opacity-100 transition-opacity duration-(--duration-base) ease-out';
	const hidden = 'opacity-0 transition-opacity duration-(--duration-fast) ease-in';
</script>

<div class="flex flex-col items-center gap-3">
	<p class="text-sm font-medium">Enter the code sent to your phone</p>
	<InputOTP.Root
		aria-label="Verification code"
		maxlength={6}
		bind:value
		bind:status
		onVerify={verify}
	>
		{#snippet children({ cells })}
			{#each cells as cell, index (index)}
				<InputOTP.Slot {cell} />
			{/each}
		{/snippet}
	</InputOTP.Root>
	<!-- Every message shares one cell, so swapping them never shifts the layout. -->
	<p class="grid h-5 text-sm" aria-hidden="true">
		<span class={cn(message, 'text-muted-foreground', status === 'idle' ? shown : hidden)}>
			Try 482913, or paste it
		</span>
		<span class={cn(message, 'text-muted-foreground', status === 'checking' ? shown : hidden)}>
			Checking…
		</span>
		<span class={cn(message, 'text-destructive', status === 'error' ? shown : hidden)}>
			Wrong code, try again
		</span>
		<span class={cn(message, status === 'success' ? shown : hidden)}>
			<Check class="text-success size-4" />
			Verified
		</span>
	</p>
</div>
