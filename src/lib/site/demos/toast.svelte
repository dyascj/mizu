<script lang="ts">
	import { tick } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Toaster, toast } from '$lib/components/ui/toast';
	import Trash from '@lucide/svelte/icons/trash-2';

	type Prompt = { id: string; title: string; meta: string };

	const prompts: Prompt[] = [
		{ id: 'triage', title: 'Support triage', meta: 'Used 214 times this week' },
		{ id: 'release', title: 'Release notes writer', meta: 'Used 38 times this week' },
		{ id: 'review', title: 'Code review buddy', meta: 'Used 97 times this week' }
	];

	let pending = $state<string[]>([]);
	let gone = $state<string[]>([]);
	let undoId: number | undefined;
	let list = $state<HTMLUListElement | null>(null);
	const visible = $derived(prompts.filter((p) => !pending.includes(p.id) && !gone.includes(p.id)));

	async function remove(prompt: Prompt) {
		const index = visible.indexOf(prompt);
		const hadFocus = list?.contains(document.activeElement) ?? false;
		pending.push(prompt.id);
		// A second delete folds into the same snackbar instead of stacking, so the
		// first one never becomes permanent without its countdown being seen.
		const batch = [...pending];
		undoId = toast.undo({
			id: undoId,
			title: batch.length === 1 ? `Deleted ‘${prompt.title}’` : `${batch.length} prompts deleted`,
			onUndo: () => {
				pending = pending.filter((id) => !batch.includes(id));
				undoId = undefined;
			},
			onCommit: () => {
				gone.push(...batch);
				pending = pending.filter((id) => !batch.includes(id));
				undoId = undefined;
			}
		});
		// Hands focus to a neighbour so it isn't dropped on the page.
		if (!hadFocus) return;
		await tick();
		const buttons = list?.querySelectorAll<HTMLButtonElement>('button');
		buttons?.[Math.min(index, buttons.length - 1)]?.focus();
	}

	const runs = [
		() => toast.success({ title: 'Eval finished', description: '94% of 120 cases passed.' }),
		() =>
			toast({ title: 'Fine-tune queued', description: 'Position 3 in line, about 12 minutes.' }),
		() =>
			toast.warning({
				title: 'Usage at 80%',
				description: '8,000 of 10,000 monthly credits used.'
			}),
		() => toast.error({ title: 'Webhook failed', description: 'The endpoint answered with 502.' })
	];
	let run = 0;

	let saveId: number | undefined;
	let attempt = 0;
	function publish() {
		saveId = toast.promise(
			(signal) =>
				new Promise<void>((resolve, reject) => {
					// Alternates so both outcomes show; a Retry after a failure succeeds.
					const fail = attempt++ % 2 === 1;
					const timer = setTimeout(() => (fail ? reject() : resolve()), 1400);
					signal.addEventListener('abort', () => clearTimeout(timer), { once: true });
				}),
			{
				id: saveId,
				loading: 'Publishing prompts',
				success: 'Published to your workspace',
				error: { title: "Couldn't publish", description: 'The workspace is syncing. Try again.' },
				retry: true
			}
		);
	}
</script>

<!-- One <Toaster /> lives at your app root; it's shown here so the demo is self-contained. -->
<Toaster position="bottom-center" />

<div class="bg-card flex w-full max-w-sm flex-col gap-4 rounded-2xl p-2 shadow-sm">
	<div class="px-3 pt-3">
		<p class="font-semibold tracking-tight">Saved prompts</p>
		<p class="text-muted-foreground text-sm">Shared with everyone in Acme Labs</p>
	</div>
	<ul bind:this={list} aria-label="Saved prompts" class="flex min-h-42 flex-col">
		{#each visible as prompt (prompt.id)}
			<li class="hover:bg-secondary flex items-center gap-3 rounded-xl py-2 ps-3 pe-2">
				<div class="min-w-0 flex-1">
					<p class="truncate text-sm font-medium">{prompt.title}</p>
					<p class="text-muted-foreground truncate text-sm">{prompt.meta}</p>
				</div>
				<Button
					variant="ghost"
					size="icon"
					class="text-muted-foreground hover:text-foreground size-9"
					aria-label="Delete {prompt.title}"
					onclick={() => remove(prompt)}
				>
					<Trash class="size-4" />
				</Button>
			</li>
		{/each}
		{#if visible.length === 0 && pending.length === 0}
			<li class="flex flex-1 flex-col items-center justify-center gap-3 py-6 text-center">
				<p class="text-muted-foreground text-sm">No prompts left</p>
				<Button variant="secondary" size="sm" onclick={() => (gone = [])}>Restore demo</Button>
			</li>
		{/if}
	</ul>
	<div class="flex flex-wrap gap-2 px-2 pb-2">
		<Button class="flex-1" onclick={publish}>Publish</Button>
		<Button class="flex-1" variant="secondary" onclick={() => runs[run++ % runs.length]()}>
			Run eval
		</Button>
	</div>
</div>
