<script lang="ts">
	import type { Snippet } from 'svelte';
	import * as Tabs from '$lib/components/ui/tabs';
	import CodeBlock from './code-block.svelte';
	import { cn } from '$lib/utils.js';

	let {
		code,
		children,
		center = true,
		class: className
	}: { code: string; children: Snippet; center?: boolean; class?: string } = $props();
</script>

<Tabs.Root value="preview" class={cn('w-full', className)}>
	<Tabs.List>
		<Tabs.Trigger value="preview">Preview</Tabs.Trigger>
		<Tabs.Trigger value="code">Code</Tabs.Trigger>
	</Tabs.List>
	<Tabs.Content value="preview">
		<div
			class="relative min-h-60 overflow-hidden rounded-2xl bg-card p-8 shadow-sm dark:border dark:border-border"
			data-no-toc
		>
			<!-- a whisper of aura in the corners; the components float above it -->
			<div
				aria-hidden="true"
				class="orb-pink pointer-events-none absolute -top-16 -left-16 size-56 rounded-full opacity-60 blur-2xl"
			></div>
			<div
				aria-hidden="true"
				class="orb-blue pointer-events-none absolute -right-16 -bottom-20 size-64 rounded-full opacity-60 blur-2xl"
			></div>
			<div
				class={cn(
					'relative flex min-h-44 w-full flex-wrap items-center gap-5',
					center && 'justify-center'
				)}
			>
				{@render children()}
			</div>
		</div>
	</Tabs.Content>
	<Tabs.Content value="code">
		<CodeBlock {code} />
	</Tabs.Content>
</Tabs.Root>
