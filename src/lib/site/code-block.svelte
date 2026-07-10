<script lang="ts">
	import { Check, Copy } from '@lucide/svelte';
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
	class={cn(
		'group relative overflow-hidden rounded-xl border border-border bg-popover',
		className
	)}
>
	<button
		onclick={copy}
		aria-label="Copy code"
		class="absolute top-2.5 right-2.5 z-10 inline-flex size-8 items-center justify-center rounded-lg border border-border bg-card/70 text-muted-foreground shadow-xs transition-[scale,color] duration-150 hover:text-foreground active:scale-[0.96]"
	>
		{#if copied}
			<Check class="size-4 text-[color:var(--success)]" />
		{:else}
			<Copy class="size-4" />
		{/if}
	</button>
	<pre class="max-h-[30rem] overflow-auto p-4 pr-12 text-[0.8125rem] leading-relaxed"><code
			class="font-mono">{code}</code
		></pre>
</div>
