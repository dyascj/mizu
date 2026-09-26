<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { EmailInput, looksLikeEmail } from '$lib/components/ui/email-input';
	import { Label } from '$lib/components/ui/label';

	// Four slips of different shapes: a swap, a swap mid-word, a dropped letter,
	// and a wrong key in the ending.
	const typos = ['gmial.com', 'hotmial.com', 'yaho.com', 'gmail.con'];
	const name = 'maya.chen@';

	// Opens on a typo, so the suggestion is the first thing you see.
	let value = $state(`${name}${typos[0]}`);
	let sent = $state('');
</script>

<div class="flex w-full max-w-sm flex-col items-center gap-5">
	<form
		novalidate
		class="bg-card flex w-full flex-col gap-2 rounded-2xl p-5 shadow-sm"
		onsubmit={(event) => {
			event.preventDefault();
			if (looksLikeEmail(value)) sent = value.trim();
		}}
	>
		<Label for="agent-email">Where should the agent send its report?</Label>
		<EmailInput
			id="agent-email"
			name="email"
			bind:value
			hint={sent ? `Report scheduled for ${sent}` : 'Every Monday at 9am.'}
			onValueChange={() => (sent = '')}
		/>
		<Button type="submit" class="mt-1" disabled={!looksLikeEmail(value)}>Schedule report</Button>
	</form>
	<div class="flex flex-col items-center gap-2">
		<span class="text-muted-foreground text-xs">Try another typo</span>
		<div class="grid grid-cols-2 gap-1.5 sm:flex">
			{#each typos as typo (typo)}
				<button
					type="button"
					aria-pressed={value === `${name}${typo}`}
					onclick={() => {
						value = `${name}${typo}`;
						sent = '';
					}}
					class="bg-secondary hover:bg-control aria-pressed:bg-primary-muted aria-pressed:text-primary focus-visible:ring-ring h-8 rounded-full px-3 font-mono text-xs transition-[background-color,color,scale] duration-(--duration-fast) ease-out outline-none focus-visible:ring-2 active:scale-[0.96]"
				>
					{typo}
				</button>
			{/each}
		</div>
	</div>
</div>
