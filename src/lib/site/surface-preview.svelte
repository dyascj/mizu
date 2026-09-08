<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { ChatInput } from '$lib/components/ui/chat-input';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Switch } from '$lib/components/ui/switch';
	import { Label } from '$lib/components/ui/label';
	const surfaces = ['background', 'card', 'muted', 'popover'] as const;
	const names = { background: 'Page', card: 'Card', muted: 'Muted', popover: 'Popover' };
	let submitted = $state<Record<string, string>>({});
</script>

<div class="grid gap-4 sm:grid-cols-2" data-surface-preview>
	{#each surfaces as surface (surface)}
		<section
			class="min-w-0 space-y-5 rounded-2xl p-5 shadow-sm"
			style:background={`var(--${surface})`}
			data-surface={surface}
		>
			<h3 class="text-sm font-medium">{names[surface]}</h3>
			<div class="space-y-2">
				<Label for={`surface-${surface}`}>Project name</Label>
				<Input id={`surface-${surface}`} placeholder="Untitled project" />
			</div>
			<ChatInput
				label={`Message on ${names[surface].toLowerCase()}`}
				placeholder="Ask a follow-up..."
				onSubmit={(message) => {
					submitted[surface] = message;
				}}
			/>
			{#if submitted[surface]}<p
					role="status"
					class="text-muted-foreground text-xs [overflow-wrap:anywhere]"
				>
					Preview received: {submitted[surface]}
				</p>{/if}
			<div class="flex flex-wrap items-center justify-between gap-4">
				<div class="flex items-center gap-2">
					<Checkbox id={`updates-${surface}`} /><Label for={`updates-${surface}`}>Updates</Label>
				</div>
				<div class="flex items-center gap-2">
					<Switch id={`sync-${surface}`} checked /><Label for={`sync-${surface}`}>Sync</Label>
				</div>
			</div>
		</section>
	{/each}
</div>
