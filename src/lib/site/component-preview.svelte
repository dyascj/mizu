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
			class={cn(
				'relative flex min-h-60 flex-wrap items-center gap-5 rounded-2xl border border-[color:var(--glass-border)] glass p-8',
				center && 'justify-center'
			)}
			data-no-toc
		>
			{@render children()}
		</div>
	</Tabs.Content>
	<Tabs.Content value="code">
		<CodeBlock {code} />
	</Tabs.Content>
</Tabs.Root>
