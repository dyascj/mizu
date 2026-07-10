<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as InputOTP from '$lib/components/ui/input-otp';

	let value = $state('');
</script>

<div class="mx-auto flex w-full max-w-sm flex-col items-center gap-6 rounded-3xl bg-card p-8 text-center shadow-md">
	<div>
		<h2 class="text-lg font-semibold tracking-tight">Check your email</h2>
		<p class="mt-1 text-sm text-balance text-muted-foreground">
			We sent a six-digit code to <span class="font-medium text-foreground">you@water.com</span>.
		</p>
	</div>

	<InputOTP.Root maxlength={6} bind:value>
		{#snippet children({ cells })}
			<div class="flex items-center gap-1.5">
				{#each cells.slice(0, 3) as cell (cell)}
					<InputOTP.Slot {cell} />
				{/each}
			</div>
			<InputOTP.Separator />
			<div class="flex items-center gap-1.5">
				{#each cells.slice(3, 6) as cell (cell)}
					<InputOTP.Slot {cell} />
				{/each}
			</div>
		{/snippet}
	</InputOTP.Root>

	<div class="flex w-full flex-col gap-2">
		<Button class="w-full" disabled={value.length < 6}>Verify</Button>
		<Button variant="ghost" size="sm" class="w-full text-muted-foreground">Resend code</Button>
	</div>
</div>
