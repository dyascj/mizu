<script lang="ts">
	import * as Dock from '$lib/components/ui/dock';
	import HouseIcon from '@lucide/svelte/icons/house';
	import SearchIcon from '@lucide/svelte/icons/search';
	import ImageIcon from '@lucide/svelte/icons/image';
	import MusicIcon from '@lucide/svelte/icons/music';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
</script>

<!-- Extra bottom padding so the lifted, magnified tiles never clip the frame. -->
<div class="flex w-full items-end justify-center px-4 pt-16 pb-6">
	<Dock.Root>
		<Dock.Item label="Home">
			<HouseIcon class="size-5" />
		</Dock.Item>
		<Dock.Item label="Search">
			<SearchIcon class="size-5" />
		</Dock.Item>
		<Dock.Item label="Gallery">
			<ImageIcon class="size-5" />
		</Dock.Item>
		<Dock.Item label="Music">
			<MusicIcon class="size-5" />
		</Dock.Item>
		<Dock.Item label="Settings">
			<SettingsIcon class="size-5" />
		</Dock.Item>
		<Dock.Item label="Trash">
			<Trash2Icon class="size-5" />
		</Dock.Item>
	</Dock.Root>
</div>
