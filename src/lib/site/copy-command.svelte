<script lang="ts">
	import { Check, Copy, Terminal } from '@lucide/svelte';
	import { cn } from '$lib/utils.js';

	let { command, class: className }: { command: string; class?: string } = $props();

	let copied = $state(false);
	let timer: ReturnType<typeof setTimeout>;

	async function copy() {
		try {
			await navigator.clipboard.writeText(command);
			copied = true;
			clearTimeout(timer);
			timer = setTimeout(() => (copied = false), 1600);
		} catch {
			/* clipboard unavailable */
		}
	}
</script>

<div
	class={cn(
		'flex items-center gap-3 rounded-xl bg-secondary px-4 py-2.5 shadow-xs dark:bg-popover',
		className
	)}
>
	<Terminal class="size-4 shrink-0 text-[color:var(--primary)]" />
	<code class="flex-1 truncate font-mono text-sm">{command}</code>
	<button
		onclick={copy}
		aria-label="Copy command"
		class="inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-[scale,color] duration-150 hover:text-foreground active:scale-[0.96]"
	>
		{#if copied}
			<Check class="size-4 text-[color:var(--success)]" />
		{:else}
			<Copy class="size-4" />
		{/if}
	</button>
</div>
