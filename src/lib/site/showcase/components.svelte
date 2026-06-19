<script lang="ts">
	import Plus from 'phosphor-svelte/lib/Plus';
	import Drop from 'phosphor-svelte/lib/Drop';
	import CheckCircle from 'phosphor-svelte/lib/CheckCircle';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Slider } from '$lib/components/ui/slider';
	import { Progress } from '$lib/components/ui/progress';
	import { CircularGauge } from '$lib/components/ui/circular-gauge';
	import * as Card from '$lib/components/ui/card';
	import * as Select from '$lib/components/ui/select';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import * as ToggleGroup from '$lib/components/ui/toggle-group';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Alert from '$lib/components/ui/alert';
	import { Avatar, AvatarImage, AvatarFallback } from '$lib/components/ui/avatar';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Popover from '$lib/components/ui/popover';

	let agree = $state(true);
	let glossy = $state(true);
	let plan = $state('pro');
	let level = $state(64);
	let align = $state('center');
	let fruit = $state('');
</script>

<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
	<Card.Root>
		<Card.Header class="pb-3"><Card.Title class="text-base">Buttons</Card.Title></Card.Header>
		<Card.Content class="flex flex-wrap gap-2">
			<Button size="sm">Primary</Button>
			<Button size="sm" variant="secondary">Secondary</Button>
			<Button size="sm" variant="outline">Outline</Button>
			<Button size="sm" variant="ghost">Ghost</Button>
			<Button size="sm" variant="destructive">Delete</Button>
			<Button size="icon" aria-label="Add"><Plus class="size-4" /></Button>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header class="pb-3"><Card.Title class="text-base">Badges</Card.Title></Card.Header>
		<Card.Content class="flex flex-wrap gap-2">
			<Badge>Primary</Badge>
			<Badge variant="secondary">Secondary</Badge>
			<Badge variant="success">Success</Badge>
			<Badge variant="warning">Warning</Badge>
			<Badge variant="destructive">Error</Badge>
			<Badge variant="outline">Outline</Badge>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header class="pb-3"><Card.Title class="text-base">Text field</Card.Title></Card.Header>
		<Card.Content class="flex flex-col gap-2">
			<Label for="s-email">Email</Label>
			<Input id="s-email" type="email" placeholder="you@mizu.dev" />
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header class="pb-3"><Card.Title class="text-base">Select</Card.Title></Card.Header>
		<Card.Content>
			<Select.Root type="single" bind:value={fruit}>
				<Select.Trigger class="w-full">{fruit || 'Pick a water source'}</Select.Trigger>
				<Select.Content>
					<Select.Item value="Ocean">Ocean</Select.Item>
					<Select.Item value="Lake">Lake</Select.Item>
					<Select.Item value="River">River</Select.Item>
					<Select.Item value="Rain">Rain</Select.Item>
				</Select.Content>
			</Select.Root>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header class="pb-3"><Card.Title class="text-base">Selection</Card.Title></Card.Header>
		<Card.Content class="flex flex-col gap-3">
			<label class="flex items-center justify-between text-sm font-semibold">
				Glossy surfaces <Switch bind:checked={glossy} />
			</label>
			<label class="flex items-center gap-2 text-sm font-semibold">
				<Checkbox bind:checked={agree} /> Accept terms
			</label>
			<RadioGroup.Root bind:value={plan} class="flex gap-4">
				<label class="flex items-center gap-2 text-sm"><RadioGroup.Item value="free" /> Free</label>
				<label class="flex items-center gap-2 text-sm"><RadioGroup.Item value="pro" /> Pro</label>
			</RadioGroup.Root>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header class="pb-3"><Card.Title class="text-base">Slider &amp; progress</Card.Title></Card.Header>
		<Card.Content class="flex flex-col gap-3">
			<div class="flex items-center justify-between text-sm">
				<span class="font-semibold">Clarity</span>
				<span class="font-mono text-muted-foreground tabular-nums">{level}%</span>
			</div>
			<Slider type="single" bind:value={level} max={100} />
			<Progress value={level} />
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header class="pb-3"><Card.Title class="text-base">Toggle group</Card.Title></Card.Header>
		<Card.Content>
			<ToggleGroup.Root type="single" bind:value={align}>
				<ToggleGroup.Item value="left">Left</ToggleGroup.Item>
				<ToggleGroup.Item value="center">Center</ToggleGroup.Item>
				<ToggleGroup.Item value="right">Right</ToggleGroup.Item>
			</ToggleGroup.Root>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header class="pb-3"><Card.Title class="text-base">Tabs</Card.Title></Card.Header>
		<Card.Content>
			<Tabs.Root value="overview">
				<Tabs.List>
					<Tabs.Trigger value="overview">Overview</Tabs.Trigger>
					<Tabs.Trigger value="activity">Activity</Tabs.Trigger>
				</Tabs.List>
				<Tabs.Content value="overview" class="pt-2 text-sm text-muted-foreground">
					A glance at the surface.
				</Tabs.Content>
				<Tabs.Content value="activity" class="pt-2 text-sm text-muted-foreground">
					Recent ripples and changes.
				</Tabs.Content>
			</Tabs.Root>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header class="pb-3"><Card.Title class="text-base">Overlays</Card.Title></Card.Header>
		<Card.Content class="flex flex-wrap items-center gap-2">
			<Dialog.Root>
				<Dialog.Trigger class={buttonVariants({ variant: 'secondary', size: 'sm' })}>
					Dialog
				</Dialog.Trigger>
				<Dialog.Content>
					<Dialog.Header>
						<Dialog.Title>Clear your cache?</Dialog.Title>
						<Dialog.Description>This frees up space and cannot be undone.</Dialog.Description>
					</Dialog.Header>
					<Dialog.Footer>
						<Button>Confirm</Button>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Root>
			<Popover.Root>
				<Popover.Trigger class={buttonVariants({ variant: 'outline', size: 'sm' })}>
					Popover
				</Popover.Trigger>
				<Popover.Content class="text-sm text-muted-foreground">
					A floating glass panel anchored to its trigger.
				</Popover.Content>
			</Popover.Root>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header class="pb-3"><Card.Title class="text-base">Avatars</Card.Title></Card.Header>
		<Card.Content class="flex items-center gap-3">
			<div class="flex -space-x-2">
				<Avatar class="size-9 ring-2 ring-[color:var(--card)]">
					<AvatarImage src="https://i.pravatar.cc/64?img=12" alt="a" />
					<AvatarFallback>RV</AvatarFallback>
				</Avatar>
				<Avatar class="size-9 ring-2 ring-[color:var(--card)]">
					<AvatarImage src="https://i.pravatar.cc/64?img=32" alt="b" />
					<AvatarFallback>KO</AvatarFallback>
				</Avatar>
				<Avatar class="size-9 ring-2 ring-[color:var(--card)]">
					<AvatarFallback>+5</AvatarFallback>
				</Avatar>
			</div>
			<span class="text-sm text-muted-foreground">7 collaborators</span>
		</Card.Content>
	</Card.Root>

	<Card.Root class="items-center justify-center">
		<Card.Content class="flex items-center justify-center pt-6">
			<CircularGauge value={level} label="Focus">
				<Drop class="size-6 text-[color:var(--primary)]" />
			</CircularGauge>
		</Card.Content>
	</Card.Root>

	<Alert.Root variant="success">
		<CheckCircle />
		<Alert.Title>Saved</Alert.Title>
		<Alert.Description>Your changes synced just now.</Alert.Description>
	</Alert.Root>
</div>
