<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { buttonVariants } from '$lib/components/ui/button';
	import Droplets from '@lucide/svelte/icons/droplets';
	import Settings from '@lucide/svelte/icons/settings';
	import WavesLadder from '@lucide/svelte/icons/waves-ladder';
	import LogOut from '@lucide/svelte/icons/log-out';

	let showRipples = $state(true);
	let showFoam = $state(false);
	let clarity = $state('clear');
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger class={buttonVariants({ variant: 'secondary' })}>
		Project actions
	</DropdownMenu.Trigger>
	<DropdownMenu.Content class="w-56" align="start">
		<DropdownMenu.Label>Project</DropdownMenu.Label>
		<DropdownMenu.Group>
			<DropdownMenu.Item>
				<Droplets />
				New file
				<DropdownMenu.Shortcut>⌘D</DropdownMenu.Shortcut>
			</DropdownMenu.Item>
			<DropdownMenu.Item>
				<Settings />
				Project settings
				<DropdownMenu.Shortcut>⌘F</DropdownMenu.Shortcut>
			</DropdownMenu.Item>
		</DropdownMenu.Group>
		<DropdownMenu.Separator />
		<DropdownMenu.CheckboxItem bind:checked={showRipples}>Show previews</DropdownMenu.CheckboxItem>
		<DropdownMenu.CheckboxItem bind:checked={showFoam}>Show archived</DropdownMenu.CheckboxItem>
		<DropdownMenu.Separator />
		<DropdownMenu.Label>View</DropdownMenu.Label>
		<DropdownMenu.RadioGroup bind:value={clarity}>
			<DropdownMenu.RadioItem value="clear">Comfortable</DropdownMenu.RadioItem>
			<DropdownMenu.RadioItem value="murky">Compact</DropdownMenu.RadioItem>
		</DropdownMenu.RadioGroup>
		<DropdownMenu.Separator />
		<DropdownMenu.Sub>
			<DropdownMenu.SubTrigger>
				<WavesLadder />
				Move to
			</DropdownMenu.SubTrigger>
			<DropdownMenu.SubContent>
				<DropdownMenu.Item>Drafts</DropdownMenu.Item>
				<DropdownMenu.Item>In review</DropdownMenu.Item>
				<DropdownMenu.Item>Archive</DropdownMenu.Item>
			</DropdownMenu.SubContent>
		</DropdownMenu.Sub>
		<DropdownMenu.Separator />
		<DropdownMenu.Item>
			<LogOut />
			Leave project
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
