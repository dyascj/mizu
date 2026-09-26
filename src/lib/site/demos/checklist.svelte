<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Checklist, type ChecklistTask } from '$lib/components/ui/checklist';
	import { tick } from 'svelte';

	const tasks: ChecklistTask[] = [
		{
			id: 'sources',
			title: 'Connect your docs',
			description:
				'Answers cite your own files, so the assistant can show where each claim came from.',
			action: 'Connect'
		},
		{
			id: 'instructions',
			title: 'Write custom instructions',
			description:
				'Tell it how you like answers: tone, length, and anything it should always check.',
			action: 'Open editor'
		},
		{
			id: 'model',
			title: 'Pick a default model',
			description:
				'Fast for everyday chats, reasoning for long analysis. Switch per chat any time.',
			action: 'Choose model'
		},
		{
			id: 'invite',
			title: 'Invite a teammate',
			description: 'Shared projects keep prompts, files, and history in one place.',
			action: 'Send invite'
		}
	];

	let dismissed = $state(false);
	let done = $state(['sources']);
	let open = $state(['instructions']);
	let restore = $state<HTMLElement | null>(null);

	async function dismiss() {
		dismissed = true;
		await tick();
		restore?.focus();
	}

	function showAgain() {
		done = ['sources'];
		open = ['instructions'];
		dismissed = false;
	}
</script>

<div class="flex w-full max-w-md flex-col items-center">
	{#if dismissed}
		<Button bind:ref={restore} variant="secondary" onclick={showAgain}>Show checklist again</Button>
	{:else}
		<Checklist
			{tasks}
			bind:done
			bind:open
			title="Set up your assistant"
			onDismiss={dismiss}
			finishedDescription="Your assistant is ready. Find these steps again any time in settings."
		/>
	{/if}
</div>
