<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { buttonVariants } from '$lib/components/ui/button';
	import { Droplets, Settings, WavesLadder, LogOut } from '@lucide/svelte';

	let showRipples = $state(true);
	let showFoam = $state(false);
	let clarity = $state('clear');
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger class={buttonVariants({ variant: 'secondary' })}>
		Water settings
	</DropdownMenu.Trigger>
	<DropdownMenu.Content class="w-56" align="start">
		<DropdownMenu.Label>Surface</DropdownMenu.Label>
		<DropdownMenu.Group>
			<DropdownMenu.Item>
				<Droplets />
				Add droplet
				<DropdownMenu.Shortcut>⌘D</DropdownMenu.Shortcut>
			</DropdownMenu.Item>
			<DropdownMenu.Item>
				<Settings />
				Calibrate flow
				<DropdownMenu.Shortcut>⌘F</DropdownMenu.Shortcut>
			</DropdownMenu.Item>
		</DropdownMenu.Group>
		<DropdownMenu.Separator />
		<DropdownMenu.CheckboxItem bind:checked={showRipples}>Show ripples</DropdownMenu.CheckboxItem>
		<DropdownMenu.CheckboxItem bind:checked={showFoam}>Show foam</DropdownMenu.CheckboxItem>
		<DropdownMenu.Separator />
		<DropdownMenu.Label>Clarity</DropdownMenu.Label>
		<DropdownMenu.RadioGroup bind:value={clarity}>
			<DropdownMenu.RadioItem value="clear">Crystal clear</DropdownMenu.RadioItem>
			<DropdownMenu.RadioItem value="murky">Murky</DropdownMenu.RadioItem>
		</DropdownMenu.RadioGroup>
		<DropdownMenu.Separator />
		<DropdownMenu.Sub>
			<DropdownMenu.SubTrigger>
				<WavesLadder />
				Currents
			</DropdownMenu.SubTrigger>
			<DropdownMenu.SubContent>
				<DropdownMenu.Item>Tide</DropdownMenu.Item>
				<DropdownMenu.Item>Eddy</DropdownMenu.Item>
				<DropdownMenu.Item>Drift</DropdownMenu.Item>
			</DropdownMenu.SubContent>
		</DropdownMenu.Sub>
		<DropdownMenu.Separator />
		<DropdownMenu.Item>
			<LogOut />
			Drain
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
