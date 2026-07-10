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
		<div class="min-h-60 rounded-2xl bg-card p-8 shadow-sm" data-no-toc>
			<div
				class={cn('flex min-h-44 w-full flex-wrap items-center gap-5', center && 'justify-center')}
			>
				{@render children()}
			</div>
		</div>
	</Tabs.Content>
	<Tabs.Content value="code">
		<CodeBlock {code} />
	</Tabs.Content>
</Tabs.Root>
