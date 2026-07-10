<script lang="ts">
	import * as ContextMenu from '$lib/components/ui/context-menu';
	import { Copy, Droplets, WavesLadder, Trash2 } from '@lucide/svelte';

	let showGlow = $state(true);
	let depth = $state('shallow');
</script>

<ContextMenu.Root>
	<ContextMenu.Trigger
		class="flex h-36 w-72 select-none items-center justify-center rounded-xl glass border border-dashed border-border text-sm text-muted-foreground"
	>
		Right-click the pool
	</ContextMenu.Trigger>
	<ContextMenu.Content class="w-52">
		<ContextMenu.Label>Pool</ContextMenu.Label>
		<ContextMenu.Item>
			<Copy />
			Copy surface
			<ContextMenu.Shortcut>⌘C</ContextMenu.Shortcut>
		</ContextMenu.Item>
		<ContextMenu.Item>
			<Droplets />
			Refill
		</ContextMenu.Item>
		<ContextMenu.Separator />
		<ContextMenu.CheckboxItem bind:checked={showGlow}>Aura glow</ContextMenu.CheckboxItem>
		<ContextMenu.Separator />
		<ContextMenu.RadioGroup bind:value={depth}>
			<ContextMenu.RadioItem value="shallow">Shallow</ContextMenu.RadioItem>
			<ContextMenu.RadioItem value="deep">Deep</ContextMenu.RadioItem>
		</ContextMenu.RadioGroup>
		<ContextMenu.Separator />
		<ContextMenu.Sub>
			<ContextMenu.SubTrigger>
				<WavesLadder />
				Effects
			</ContextMenu.SubTrigger>
			<ContextMenu.SubContent>
				<ContextMenu.Item>Ripple</ContextMenu.Item>
				<ContextMenu.Item>Caustics</ContextMenu.Item>
			</ContextMenu.SubContent>
		</ContextMenu.Sub>
		<ContextMenu.Separator />
		<ContextMenu.Item class="text-[color:var(--destructive)]">
			<Trash2 />
			Drain pool
		</ContextMenu.Item>
	</ContextMenu.Content>
</ContextMenu.Root>
