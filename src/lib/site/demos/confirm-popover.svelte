<script lang="ts">
	import { ConfirmPopover } from '$lib/components/ui/confirm-popover';
	import { duration } from '$lib/components/ui/motion';
	import Ban from '@lucide/svelte/icons/ban';
	import KeyRound from '@lucide/svelte/icons/key-round';

	let revoked = $state(false);
	let restore: ReturnType<typeof setTimeout> | undefined;

	$effect(() => () => clearTimeout(restore));
</script>

<div
	class="bg-card flex w-full max-w-sm items-center gap-3 rounded-full py-2 pr-2 pl-5 shadow-sm sm:pl-3"
>
	<span
		class="bg-secondary text-muted-foreground grid size-10 shrink-0 place-items-center rounded-full max-sm:hidden"
	>
		<KeyRound class="size-4" />
	</span>
	<div class="min-w-0 flex-1">
		<p
			class="truncate text-sm font-medium transition-colors duration-(--duration-base) {revoked
				? 'text-muted-foreground line-through'
				: ''}"
		>
			Production agent key
		</p>
		<p class="text-muted-foreground truncate text-xs">
			{revoked ? 'Revoked just now' : 'sk-...a91f · used 2 min ago'}
		</p>
	</div>
	<ConfirmPopover
		title="Revoke this key?"
		description="Agents using it stop working right away. This can't be undone."
		confirmLabel="Revoke"
		doneLabel="Revoked"
		announcement="Key revoked"
		align="end"
		onConfirm={() => {
			revoked = true;
			clearTimeout(restore);
			// Brings the key back with the button, so the demo can run again.
			restore = setTimeout(() => (revoked = false), duration.ambient);
		}}
	>
		<Ban />
		Revoke
	</ConfirmPopover>
</div>
