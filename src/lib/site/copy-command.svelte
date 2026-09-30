<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import Copy from '@lucide/svelte/icons/copy';
	import { cn } from '$lib/utils.js';

	let { command, class: className }: { command: string; class?: string } = $props();

	let copied = $state(false);
	let failed = $state(false);
	let timer: ReturnType<typeof setTimeout>;
	$effect(() => () => clearTimeout(timer));

	async function copy() {
		failed = false;
		try {
			await navigator.clipboard.writeText(command);
			copied = true;
			clearTimeout(timer);
			timer = setTimeout(() => (copied = false), 1600);
		} catch {
			failed = true;
		}
	}
</script>

<div
	class={cn(
		'border-border bg-secondary/50 dark:bg-popover relative flex w-fit max-w-full items-center gap-2.5 rounded-xl border py-1.5 pr-1.5 pl-3.5',
		className
	)}
>
	<span class="text-muted-foreground font-mono text-[0.8125rem] select-none" aria-hidden="true"
		>$</span
	>
	<code class="min-w-0 flex-1 truncate font-mono text-[0.8125rem]">{command}</code>
	<button
		onclick={copy}
		aria-label={failed ? 'Copy failed, try again' : copied ? 'Command copied' : 'Copy command'}
		class="text-muted-foreground hover:text-foreground inline-flex size-7 shrink-0 items-center justify-center rounded-lg transition-[scale,color] duration-200 active:scale-[0.96]"
	>
		{#if copied}
			<Check class="size-4 text-[color:var(--success)]" />
		{:else}
			<Copy class="size-4" />
		{/if}
	</button>
	{#if failed}<span
			role="status"
			class="text-destructive bg-popover absolute right-2 bottom-2 rounded-lg px-2 py-1 text-xs"
			>Copy failed. Select and copy the text.</span
		>{/if}
</div>
