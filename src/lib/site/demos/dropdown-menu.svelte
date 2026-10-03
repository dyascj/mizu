<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { buttonVariants } from '$lib/components/ui/button';
	import { blurIn, duration } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Copy from '@lucide/svelte/icons/copy';
	import FolderInput from '@lucide/svelte/icons/folder-input';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Share2 from '@lucide/svelte/icons/share-2';
	import Trash2 from '@lucide/svelte/icons/trash-2';

	let memory = $state(true);
	let webSearch = $state(false);
	let picked = $state<{ n: number; text: string } | null>(null);

	// Counted, so picking the same action twice still replays the confirmation.
	const pick = (text: string) => (picked = { n: (picked?.n ?? 0) + 1, text });
</script>

<div class="flex flex-col items-center gap-3">
	<DropdownMenu.Root>
		<DropdownMenu.Trigger class={cn(buttonVariants({ variant: 'secondary' }), 'group pe-4')}>
			Chat options
			<ChevronDown
				class="text-muted-foreground size-4 transition-[rotate] duration-(--duration-base) ease-out group-data-[state=open]:rotate-180 motion-reduce:transition-none"
			/>
		</DropdownMenu.Trigger>
		<DropdownMenu.Content class="w-56" align="start">
			<DropdownMenu.Label>Kyoto trip planning</DropdownMenu.Label>
			<DropdownMenu.Item onSelect={() => pick('Renaming the chat')}>
				<Pencil />
				Rename
			</DropdownMenu.Item>
			<DropdownMenu.Item onSelect={() => pick('Duplicated into a new chat')}>
				<Copy />
				Duplicate
				<DropdownMenu.Shortcut>⌘D</DropdownMenu.Shortcut>
			</DropdownMenu.Item>
			<DropdownMenu.Item onSelect={() => pick('Share link copied')}>
				<Share2 />
				Share
			</DropdownMenu.Item>
			<DropdownMenu.Sub>
				<DropdownMenu.SubTrigger>
					<FolderInput />
					Move to project
				</DropdownMenu.SubTrigger>
				<DropdownMenu.SubContent>
					<DropdownMenu.Item onSelect={() => pick('Moved to Travel')}>Travel</DropdownMenu.Item>
					<DropdownMenu.Item onSelect={() => pick('Moved to Research')}>Research</DropdownMenu.Item>
					<DropdownMenu.Item onSelect={() => pick('Moved to Personal')}>Personal</DropdownMenu.Item>
				</DropdownMenu.SubContent>
			</DropdownMenu.Sub>
			<DropdownMenu.Separator />
			<DropdownMenu.CheckboxItem bind:checked={memory}>Use memory</DropdownMenu.CheckboxItem>
			<DropdownMenu.CheckboxItem bind:checked={webSearch}>Search the web</DropdownMenu.CheckboxItem>
			<DropdownMenu.Separator />
			<DropdownMenu.Item variant="destructive" onSelect={() => pick('Chat deleted')}>
				<Trash2 />
				Delete chat
				<DropdownMenu.Shortcut class="text-current opacity-70">⌘⌫</DropdownMenu.Shortcut>
			</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
	<!-- Height reserved up front, so the confirmation never shifts the trigger. -->
	<p class="text-muted-foreground h-5 text-sm" aria-live="polite">
		{#if picked}
			{#key picked.n}
				<span class="block" in:blurIn={{ duration: duration.base, blur: 4, y: 2 }}
					>{picked.text}</span
				>
			{/key}
		{/if}
	</p>
</div>
