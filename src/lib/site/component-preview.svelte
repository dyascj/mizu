<script lang="ts">
	import type { Snippet } from 'svelte';
	import { BitsConfig, Tabs, ToggleGroup } from 'bits-ui';
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
	let dir = $state<'ltr' | 'rtl'>('ltr');
	let frame = $state<HTMLElement>();
	let canFullscreen = $state(false);
	let fullscreen = $state(false);

	$effect(() => {
		canFullscreen = document.fullscreenEnabled;
		const sync = () => (fullscreen = document.fullscreenElement === frame);
		document.addEventListener('fullscreenchange', sync);
		return () => document.removeEventListener('fullscreenchange', sync);
	});

	const tabs = [
		{ value: 'preview', label: 'Preview', icon: Eye },
		{ value: 'code', label: 'Code', icon: CodeXml }
	];
	const sizes = [
		{ value: 'fit', label: 'Fit', icon: Scan },
		{ value: 'mobile', label: 'Mobile', icon: Smartphone }
	] as const;
	const dirs = [
		{ value: 'ltr', label: 'Left to right' },
		{ value: 'rtl', label: 'Right to left' }
	] as const;

	const toggleGroup =
		'border-border bg-secondary/60 hidden items-center rounded-lg border p-0.5 sm:flex';
	const toggleItem =
		'text-muted-foreground hover:text-foreground data-[state=on]:bg-background data-[state=on]:text-foreground focus-visible:ring-ring inline-flex h-7 min-w-7 items-center justify-center rounded-md text-[0.6875rem] font-medium transition-colors outline-none focus-visible:ring-2 data-[state=on]:shadow-xs';
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
				<!-- Single-choice groups: arrow keys move between options, a click can never clear one. -->
				<ToggleGroup.Root
					type="single"
					value={size}
					onValueChange={(v) => v && (size = v as typeof size)}
					aria-label="Preview size"
					class={toggleGroup}
				>
					{#each sizes as s (s.value)}
						<ToggleGroup.Item
							value={s.value}
							aria-label={s.label}
							title={s.label}
							class={toggleItem}
						>
							<s.icon class="size-3.5" aria-hidden="true" />
						</ToggleGroup.Item>
					{/each}
				</ToggleGroup.Root>
				<ToggleGroup.Root
					type="single"
					value={dir}
					onValueChange={(v) => v && (dir = v as typeof dir)}
					aria-label="Text direction"
					class={toggleGroup}
				>
					{#each dirs as d (d.value)}
						<ToggleGroup.Item
							value={d.value}
							aria-label={d.label}
							title={d.label}
							class={cn(toggleItem, 'px-1.5')}
						>
							{d.value.toUpperCase()}
						</ToggleGroup.Item>
					{/each}
				</ToggleGroup.Root>
				{#if canFullscreen}
					<button
						type="button"
						aria-label="Fullscreen preview"
						title="Fullscreen"
						onclick={() => frame?.requestFullscreen().catch(() => {})}
						class="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex size-8 items-center justify-center rounded-lg transition-colors outline-none focus-visible:ring-2"
					>
						<Maximize2 class="size-3.5" />
					</button>
				{/if}
			</div>
		{/if}
	</div>

	<Tabs.Content
		value="preview"
		class="focus-visible:ring-ring mt-3 rounded-[1.75rem] outline-none focus-visible:ring-2"
	>
		<div
			bind:this={frame}
			{dir}
			data-no-toc
			class="border-border bg-secondary/40 flex min-h-80 min-w-0 items-center justify-center overflow-hidden rounded-[1.75rem] border p-4 sm:min-h-[30rem] sm:p-8 [&:fullscreen]:rounded-none [&:fullscreen]:bg-[var(--background)]"
		>
			<!-- Overlays portal into the frame when they must inherit its direction, or
			     when it is fullscreen and nothing outside it paints. -->
			<BitsConfig defaultPortalTo={fullscreen || dir === 'rtl' ? frame : undefined}>
				<div
					class={cn(
						'flex w-full min-w-0 flex-wrap items-center gap-5 [&>*]:min-w-0',
						center && 'justify-center',
						size === 'mobile' &&
							'border-border bg-background max-w-[24.375rem] self-stretch rounded-[1.5rem] border p-4 shadow-xs'
					)}
				>
					<!-- Remount on a direction change: components read it when they mount. -->
					{#key dir}
						{@render children()}
					{/key}
				</div>
			</BitsConfig>
		</div>
	</Tabs.Content>
	<Tabs.Content
		value="code"
		class="focus-visible:ring-ring mt-3 rounded-[1.75rem] outline-none focus-visible:ring-2"
	>
		<CodeBlock {code} {filename} />
	</Tabs.Content>
</Tabs.Root>
