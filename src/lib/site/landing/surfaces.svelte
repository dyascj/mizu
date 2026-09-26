<script lang="ts">
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import * as Tabs from '$lib/components/ui/tabs';
	import { reveal } from '$lib/components/ui/motion';
	import { getBlock } from '$lib/site/blocks';

	const surfaces = [
		{
			id: 'conversation',
			label: 'Conversation',
			block: 'assistant-chat',
			category: 'featured',
			body: 'Reasoning, tool calls, streaming answers with sources, and a composer that feels instant.'
		},
		{
			id: 'mobile',
			label: 'Mobile app',
			block: 'mobile-assistant',
			category: 'mobile',
			body: 'Bottom navigation, safe areas, offline status, and install prompts for PWAs.'
		},
		{
			id: 'website',
			label: 'Website',
			block: 'product-landing',
			category: 'websites',
			body: 'Launch pages with rotating headlines, live numbers, and motion that stays calm.'
		}
	];

	let current = $state('conversation');
	const active = $derived(surfaces.find((surface) => surface.id === current) ?? surfaces[0]);
</script>

<section aria-labelledby="surfaces-title" class="mx-auto mt-28 max-w-6xl px-5 sm:px-8">
	<div class="flex flex-col items-center text-center" {@attach reveal({ children: true })}>
		<h2
			id="surfaces-title"
			class="max-w-2xl text-4xl leading-[1.05] font-semibold tracking-[-0.04em] text-balance sm:text-5xl"
		>
			One system. <span class="font-serif font-normal tracking-normal italic">Every</span> surface.
		</h2>
		<p class="text-muted-foreground mt-5 max-w-lg leading-relaxed text-balance">
			The same tokens, motion, and components carry a chat, an installable app, and the site that
			launches it.
		</p>
	</div>

	<Tabs.Root bind:value={current} class="mt-10 flex flex-col items-center">
		<Tabs.List aria-label="Surface">
			{#each surfaces as surface (surface.id)}
				<Tabs.Trigger value={surface.id}>{surface.label}</Tabs.Trigger>
			{/each}
		</Tabs.List>
		{#each surfaces as surface (surface.id)}
			<Tabs.Content value={surface.id} class="mt-8 w-full">
				<div class="bg-secondary/60 dark:bg-card rounded-[2.5rem] p-3 sm:p-6">
					{#await getBlock(surface.block)}
						<div class="h-[44rem]" aria-hidden="true"></div>
					{:then block}
						{#if block.Component}
							{@const Block = block.Component}
							<div class="animate-fade-in flex min-h-[44rem] items-center justify-center">
								<Block />
							</div>
						{/if}
					{/await}
				</div>
			</Tabs.Content>
		{/each}
	</Tabs.Root>
	<div class="mt-6 flex flex-wrap items-center justify-between gap-3 px-2">
		<p class="text-muted-foreground max-w-xl text-sm leading-relaxed">{active.body}</p>
		<a
			href="/blocks?category={active.category}"
			class="text-foreground/80 hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
			>Copy this screen <ArrowRight class="size-4" /></a
		>
	</div>
</section>
