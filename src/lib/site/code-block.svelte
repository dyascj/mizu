<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import Copy from '@lucide/svelte/icons/copy';
	import FileCode from '@lucide/svelte/icons/file-code';
	import { cn } from '$lib/utils.js';

	/** With `filename`, renders as a file viewer: a header bar and line numbers. */
	let {
		code,
		filename,
		class: className
	}: { code: string; filename?: string; class?: string } = $props();

	let copied = $state(false);
	let failed = $state(false);
	let timer: ReturnType<typeof setTimeout>;
	$effect(() => () => clearTimeout(timer));

	async function copy() {
		failed = false;
		try {
			await navigator.clipboard.writeText(code);
			copied = true;
			clearTimeout(timer);
			timer = setTimeout(() => (copied = false), 1600);
		} catch {
			failed = true;
		}
	}
</script>

{#if filename}
	<div class={cn('border-border overflow-hidden rounded-[1.25rem] border', className)}>
		<div
			class="border-border text-muted-foreground flex h-11 items-center gap-2 border-b px-4 text-[0.8125rem]"
		>
			<FileCode class="size-4 shrink-0" aria-hidden="true" />
			<span class="min-w-0 flex-1 truncate font-mono">{filename}</span>
			<button
				onclick={copy}
				aria-label={failed ? 'Copy failed, try again' : copied ? 'Code copied' : 'Copy code'}
				class="hover:text-foreground inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 transition-[scale,color] duration-200 active:scale-[0.96]"
			>
				{#if copied}<Check class="size-4 text-[color:var(--success)]" />{:else}<Copy
						class="size-4"
					/>{/if}
				<span aria-hidden="true">{failed ? 'Failed' : copied ? 'Copied' : 'Copy'}</span>
			</button>
		</div>
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<pre
			role="region"
			aria-label={filename}
			tabindex="0"
			class="bg-secondary/60 dark:bg-popover max-h-[32rem] overflow-auto py-4 text-[0.8125rem] leading-relaxed"><code
				class="block w-max min-w-full font-mono [counter-reset:line]"
				>{#each code.split('\n') as line, i (i)}<span
						class="before:text-muted-foreground block pr-6 [counter-increment:line] before:mr-5 before:inline-block before:w-10 before:text-right before:content-[counter(line)] before:select-none"
						>{line || ' '}</span
					>{/each}</code
			></pre>
	</div>
{:else}
	<div
		class={cn('group bg-secondary dark:bg-popover relative overflow-hidden rounded-xl', className)}
	>
		<button
			onclick={copy}
			aria-label={failed ? 'Copy failed, try again' : copied ? 'Code copied' : 'Copy code'}
			class="bg-card/70 text-muted-foreground hover:text-foreground absolute top-2.5 right-2.5 z-10 inline-flex size-8 items-center justify-center rounded-lg shadow-xs transition-[scale,color] duration-200 active:scale-[0.96]"
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
		{#if failed}<span
				role="status"
				class="text-destructive bg-popover absolute right-2 bottom-2 rounded-lg px-2 py-1 text-xs"
				>Copy failed. Select and copy the text.</span
			>{/if}
	</div>
{/if}
