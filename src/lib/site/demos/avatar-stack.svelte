<script lang="ts">
	import { AvatarStack } from '$lib/components/ui/avatar-stack';
	import Bot from '@lucide/svelte/icons/bot';

	const people = [
		{ name: 'Amara Okafor' },
		{ name: 'Jonas Weber' },
		{ name: 'Mei Tanaka' },
		{ name: 'Rafael Costa' },
		{ name: 'Sara Lindqvist' },
		{ name: 'Dev Patel' },
		{ name: 'Ines Moreau' }
	];
</script>

<div
	class="bg-card flex w-full max-w-sm flex-col gap-6 rounded-2xl px-5 pt-5 pb-6 shadow-sm [--avatar-ring:var(--card)]"
>
	<div class="flex items-center gap-3">
		<span
			class="bg-secondary text-muted-foreground grid size-10 shrink-0 place-items-center rounded-full"
		>
			<Bot class="size-4" aria-hidden="true" />
		</span>
		<div class="min-w-0">
			<p class="truncate font-semibold tracking-tight">Pricing research agent</p>
			<p class="text-muted-foreground truncate text-sm">Shared with 7 people · Run 14</p>
		</div>
	</div>
	<!-- Room above for the names that rise over each face. -->
	<div class="flex justify-center pt-8">
		<AvatarStack {people} max={4} label="People with access" />
	</div>
</div>
