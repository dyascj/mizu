<script lang="ts">
	import { ChatBubble } from '$lib/components/ui/chat-bubble';
	import { Label } from '$lib/components/ui/label';
	import { NetworkStatus } from '$lib/components/ui/network-status';
	import { Switch } from '$lib/components/ui/switch';
	import * as ToggleGroup from '$lib/components/ui/toggle-group';

	// A real app omits forceStatus and follows the browser's connection events.
	let offline = $state(true);
	let variant = $state<'pill' | 'inline'>('pill');
</script>

<div class="flex w-full flex-col items-center gap-5">
	<div class="flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
		<ToggleGroup.Root
			type="single"
			aria-label="Indicator style"
			bind:value={() => variant, (value) => value && (variant = value as typeof variant)}
		>
			<ToggleGroup.Item size="sm" value="pill">Pill</ToggleGroup.Item>
			<ToggleGroup.Item size="sm" value="inline">Inline</ToggleGroup.Item>
		</ToggleGroup.Root>
		<div class="flex items-center gap-2">
			<Switch id="network-offline" bind:checked={offline} />
			<Label for="network-offline">Simulate offline</Label>
		</div>
	</div>

	<div
		class="bg-card relative flex h-72 w-full max-w-md flex-col justify-end gap-2 overflow-hidden rounded-3xl p-4 shadow-sm"
	>
		{#if variant === 'pill'}
			<NetworkStatus forceStatus={offline ? 'offline' : 'online'} />
		{/if}
		<ChatBubble role="user">Move my 3pm with Priya to Thursday.</ChatBubble>
		<ChatBubble role="assistant">Done. I also let her know the new time.</ChatBubble>
		<ChatBubble role="user">And draft the agenda for it.</ChatBubble>
		<p class="text-muted-foreground mt-1 text-right text-xs">
			{offline ? 'Queued on this device' : 'Delivered'}
		</p>
		{#if variant === 'inline'}
			<NetworkStatus variant="inline" forceStatus={offline ? 'offline' : 'online'} />
		{/if}
	</div>
</div>
