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
		<div class="bg-secondary/60 min-h-72 min-w-0 rounded-2xl p-4 sm:p-8" data-no-toc>
			<div
				class={cn(
					'flex min-h-64 w-full min-w-0 flex-wrap items-center gap-5 [&>*]:min-w-0',
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
