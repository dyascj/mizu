<script lang="ts">
	import * as ContextMenu from '$lib/components/ui/context-menu';
	import Copy from '@lucide/svelte/icons/copy';
	import Droplets from '@lucide/svelte/icons/droplets';
	import WavesLadder from '@lucide/svelte/icons/waves-ladder';
	import Trash2 from '@lucide/svelte/icons/trash-2';

	let showGlow = $state(true);
	let depth = $state('shallow');
</script>

<ContextMenu.Root>
	<ContextMenu.Trigger
		class="glass border-border text-muted-foreground flex h-36 w-72 items-center justify-center rounded-xl border border-dashed text-sm select-none"
	>
		Right-click this file
	</ContextMenu.Trigger>
	<ContextMenu.Content class="w-52">
		<ContextMenu.Label>Design brief</ContextMenu.Label>
		<ContextMenu.Item>
			<Copy />
			Copy link
			<ContextMenu.Shortcut>⌘C</ContextMenu.Shortcut>
		</ContextMenu.Item>
		<ContextMenu.Item>
			<Droplets />
			Duplicate
		</ContextMenu.Item>
		<ContextMenu.Separator />
		<ContextMenu.CheckboxItem bind:checked={showGlow}>Show preview</ContextMenu.CheckboxItem>
		<ContextMenu.Separator />
		<ContextMenu.RadioGroup bind:value={depth}>
			<ContextMenu.RadioItem value="shallow">Compact</ContextMenu.RadioItem>
			<ContextMenu.RadioItem value="deep">Comfortable</ContextMenu.RadioItem>
		</ContextMenu.RadioGroup>
		<ContextMenu.Separator />
		<ContextMenu.Sub>
			<ContextMenu.SubTrigger>
				<WavesLadder />
				Move to
			</ContextMenu.SubTrigger>
			<ContextMenu.SubContent>
				<ContextMenu.Item>Drafts</ContextMenu.Item>
				<ContextMenu.Item>Archive</ContextMenu.Item>
			</ContextMenu.SubContent>
		</ContextMenu.Sub>
		<ContextMenu.Separator />
		<ContextMenu.Item class="text-[color:var(--destructive)]">
			<Trash2 />
			Delete file
		</ContextMenu.Item>
	</ContextMenu.Content>
</ContextMenu.Root>
