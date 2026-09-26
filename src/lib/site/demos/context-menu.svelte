<script lang="ts">
	import * as ContextMenu from '$lib/components/ui/context-menu';
	import { blurIn, duration } from '$lib/components/ui/motion';
	import Copy from '@lucide/svelte/icons/copy';
	import FolderInput from '@lucide/svelte/icons/folder-input';
	import GitBranch from '@lucide/svelte/icons/git-branch';
	import Link from '@lucide/svelte/icons/link';
	import Quote from '@lucide/svelte/icons/quote';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import Trash2 from '@lucide/svelte/icons/trash-2';

	const hintId = $props.id();
	let readAloud = $state(false);
	let done = $state<{ n: number; text: string } | null>(null);

	const report = (text: string) => (done = { n: (done?.n ?? 0) + 1, text });
	const projects = ['Kyoto trip', 'Weekend plans', 'Photo ideas'];
</script>

<div class="flex w-full max-w-sm flex-col gap-3">
	<ContextMenu.Root>
		<ContextMenu.Trigger
			tabindex={0}
			role="group"
			aria-label="Assistant reply"
			aria-describedby={hintId}
			class="bg-card focus-visible:ring-ring focus-visible:ring-offset-background flex touch-manipulation flex-col gap-2 rounded-2xl p-5 shadow-sm outline-none select-none [-webkit-touch-callout:none] focus-visible:ring-2 focus-visible:ring-offset-2"
		>
			<p class="text-muted-foreground text-xs font-medium">Assistant</p>
			<p class="text-sm text-pretty">
				Book the Arashiyama bamboo grove before 8am. By nine the path fills with tour groups, and
				the light through the stalks is best while the sun is still low.
			</p>
			<p class="text-muted-foreground text-xs">
				Right-click the reply, long-press on touch, or press Shift F10.
			</p>
			<span id={hintId} class="sr-only">Press Shift F10 for actions</span>
		</ContextMenu.Trigger>
		<ContextMenu.Content class="w-52">
			<ContextMenu.Item onSelect={() => report('Copied to clipboard')}>
				<Copy />
				Copy text
				<ContextMenu.Shortcut>⌘C</ContextMenu.Shortcut>
			</ContextMenu.Item>
			<ContextMenu.Item onSelect={() => report('Quoted in your reply')}>
				<Quote />
				Quote in reply
			</ContextMenu.Item>
			<ContextMenu.Item onSelect={() => report('Regenerating the reply')}>
				<RefreshCw />
				Regenerate
			</ContextMenu.Item>
			<ContextMenu.Item onSelect={() => report('Branched into a new chat')}>
				<GitBranch />
				Branch from here
			</ContextMenu.Item>
			<ContextMenu.Item disabled>
				<Link />
				Share link
			</ContextMenu.Item>
			<ContextMenu.Sub>
				<ContextMenu.SubTrigger>
					<FolderInput />
					Move to project
				</ContextMenu.SubTrigger>
				<ContextMenu.SubContent class="w-44">
					{#each projects as project (project)}
						<ContextMenu.Item onSelect={() => report(`Moved to ${project}`)}>
							{project}
						</ContextMenu.Item>
					{/each}
				</ContextMenu.SubContent>
			</ContextMenu.Sub>
			<ContextMenu.Separator />
			<ContextMenu.CheckboxItem bind:checked={readAloud}
				>Read replies aloud</ContextMenu.CheckboxItem
			>
			<ContextMenu.Separator />
			<ContextMenu.Item variant="destructive" onSelect={() => report('Reply deleted')}>
				<Trash2 />
				Delete
			</ContextMenu.Item>
		</ContextMenu.Content>
	</ContextMenu.Root>
	<!-- A reserved line, so the reply above never moves when a result appears. -->
	<p class="text-muted-foreground h-5 text-center text-sm" aria-live="polite">
		{#if done}
			{#key done.n}
				<span class="block" in:blurIn={{ duration: duration.base, blur: 4, y: 2 }}>{done.text}</span
				>
			{/key}
		{/if}
	</p>
</div>
