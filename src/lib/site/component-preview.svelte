<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Tabs } from 'bits-ui';
	import CodeXml from '@lucide/svelte/icons/code-xml';
	import Eye from '@lucide/svelte/icons/eye';
	import Maximize2 from '@lucide/svelte/icons/maximize-2';
	import Scan from '@lucide/svelte/icons/scan';
	import Smartphone from '@lucide/svelte/icons/smartphone';
	import CodeBlock from './code-block.svelte';
	import { cn } from '$lib/utils.js';

	let {
		code,
		children,
		center = true,
		filename = 'example.svelte',
		class: className
	}: {
		code: string;
		children: Snippet;
		center?: boolean;
		filename?: string;
		class?: string;
	} = $props();

	let tab = $state('preview');
	let size = $state<'fit' | 'mobile'>('fit');
	let frame = $state<HTMLElement>();

	const tabs = [
		{ value: 'preview', label: 'Preview', icon: Eye },
		{ value: 'code', label: 'Code', icon: CodeXml }
	];
	const sizes = [
		{ value: 'fit', label: 'Fit', icon: Scan },
		{ value: 'mobile', label: 'Mobile', icon: Smartphone }
	] as const;
</script>

<Tabs.Root bind:value={tab} class={cn('w-full', className)}>
	<div class="flex items-center justify-between gap-3">
		<Tabs.List class="flex items-center gap-5">
			{#each tabs as t (t.value)}
				<Tabs.Trigger
					value={t.value}
					class="text-muted-foreground hover:text-foreground data-[state=active]:text-foreground after:bg-foreground focus-visible:ring-ring relative inline-flex h-9 items-center gap-1.5 rounded-sm text-[0.8125rem] font-medium transition-colors outline-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:opacity-0 after:transition-opacity after:content-[''] focus-visible:ring-2 data-[state=active]:after:opacity-100"
				>
					<t.icon class="size-3.5" aria-hidden="true" />
					{t.label}
				</Tabs.Trigger>
			{/each}
		</Tabs.List>

		{#if tab === 'preview'}
			<div class="flex items-center gap-1.5">
				<div
					role="radiogroup"
					aria-label="Preview size"
					class="border-border bg-secondary/60 hidden items-center rounded-lg border p-0.5 sm:flex"
				>
					{#each sizes as s (s.value)}
						<button
							type="button"
							role="radio"
							aria-checked={size === s.value}
							aria-label={s.label}
							title={s.label}
							onclick={() => (size = s.value)}
							class="text-muted-foreground hover:text-foreground aria-checked:bg-background aria-checked:text-foreground focus-visible:ring-ring inline-flex size-7 items-center justify-center rounded-md transition-colors outline-none focus-visible:ring-2 aria-checked:shadow-xs"
						>
							<s.icon class="size-3.5" aria-hidden="true" />
						</button>
					{/each}
				</div>
				<button
					type="button"
					aria-label="Fullscreen preview"
					title="Fullscreen"
					onclick={() => frame?.requestFullscreen?.()}
					class="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex size-8 items-center justify-center rounded-lg transition-colors outline-none focus-visible:ring-2"
				>
					<Maximize2 class="size-3.5" />
				</button>
			</div>
		{/if}
	</div>

	<Tabs.Content
		value="preview"
		class="focus-visible:ring-ring mt-3 rounded-[1.75rem] outline-none focus-visible:ring-2"
	>
		<div
			bind:this={frame}
			data-no-toc
			class="border-border bg-secondary/40 flex min-h-80 min-w-0 items-center justify-center overflow-hidden rounded-[1.75rem] border p-4 sm:min-h-[30rem] sm:p-8 [&:fullscreen]:rounded-none [&:fullscreen]:bg-[var(--background)]"
		>
			<div
				class={cn(
					'flex w-full min-w-0 flex-wrap items-center gap-5 [&>*]:min-w-0',
					center && 'justify-center',
					size === 'mobile' &&
						'border-border bg-background max-w-[24.375rem] self-stretch rounded-[1.5rem] border p-4 shadow-xs'
				)}
			>
				{@render children()}
			</div>
		</div>
	</Tabs.Content>
	<Tabs.Content
		value="code"
		class="focus-visible:ring-ring mt-3 rounded-[1.75rem] outline-none focus-visible:ring-2"
	>
		<CodeBlock {code} {filename} />
	</Tabs.Content>
</Tabs.Root>
