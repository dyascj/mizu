<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import Copy from '@lucide/svelte/icons/copy';
	import { cn } from '$lib/utils.js';

	let { code, class: className }: { code: string; class?: string } = $props();

	let copied = $state(false);
	let timer: ReturnType<typeof setTimeout>;

	async function copy() {
		try {
			await navigator.clipboard.writeText(code);
			copied = true;
			clearTimeout(timer);
			timer = setTimeout(() => (copied = false), 1600);
		} catch {
			/* clipboard unavailable */
		}
	}
</script>

<div
	class={cn('group bg-secondary dark:bg-popover relative overflow-hidden rounded-xl', className)}
>
	<button
		onclick={copy}
		aria-label="Copy code"
		class="bg-card/70 text-muted-foreground hover:text-foreground absolute top-2.5 right-2.5 z-10 inline-flex size-8 items-center justify-center rounded-lg shadow-xs transition-[scale,color] duration-150 active:scale-[0.96]"
	>
		{#if copied}
			<Check class="size-4 text-[color:var(--success)]" />
		{:else}
			<Copy class="size-4" />
		{/if}
	</button>
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<pre
		role="region"
		aria-label="Code sample"
		tabindex="0"
		class="max-h-[30rem] overflow-auto p-4 pr-12 text-[0.8125rem] leading-relaxed"><code
			class="font-mono">{code}</code
		></pre>
</div>
