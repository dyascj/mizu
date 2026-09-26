<script lang="ts">
	import { InlineEdit } from '$lib/components/ui/inline-edit';
	import Bot from '@lucide/svelte/icons/bot';

	let name = $state('Research assistant');
	let instructions = $state(
		'Answer from the team wiki first. Cite every source, and say so when you are not sure.'
	);
</script>

<section
	aria-label="Assistant settings"
	class="bg-card flex w-full max-w-sm flex-col gap-3 rounded-2xl p-5 shadow-sm"
>
	<span
		class="bg-secondary text-muted-foreground grid size-11 place-items-center rounded-full"
		aria-hidden="true"
	>
		<Bot class="size-5" />
	</span>
	<div class="flex flex-col gap-1">
		<InlineEdit
			label="Name"
			bind:value={name}
			placeholder="Name your assistant"
			class="text-lg leading-7 font-semibold tracking-tight"
		/>
		<p class="text-muted-foreground text-sm">GPT-class model · 12 knowledge files</p>
	</div>
	<div class="flex flex-col gap-1">
		<p class="text-muted-foreground text-xs font-medium">Instructions</p>
		<InlineEdit
			label="Instructions"
			bind:value={instructions}
			placeholder="Tell the assistant how to behave"
			multiline
			class="text-sm leading-6"
		/>
	</div>
</section>
