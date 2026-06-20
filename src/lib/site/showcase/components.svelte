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
	import { Kbd, KbdGroup } from '$lib/components/ui/kbd';
	import { Separator } from '$lib/components/ui/separator';
	import * as Select from '$lib/components/ui/select';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import * as ToggleGroup from '$lib/components/ui/toggle-group';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Alert from '$lib/components/ui/alert';
	import * as Avatar from '$lib/components/ui/avatar';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Popover from '$lib/components/ui/popover';
	import * as Tooltip from '$lib/components/ui/tooltip';

	let agree = $state(true);
	let glossy = $state(true);
	let plan = $state('pro');
	let level = $state(64);
	let align = $state('center');
	let fruit = $state('');
</script>

<Tooltip.Provider>
	<div class="flex flex-col gap-6">
		<!-- Top strip: actions, badges, at-a-glance -->
		<div class="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
			<div class="flex flex-col gap-3">
				<p class="text-[0.7rem] font-bold tracking-[0.18em] text-muted-foreground uppercase">
					Actions
				</p>
				<div class="flex flex-wrap items-center gap-2">
					<Button size="sm">Primary</Button>
					<Button size="sm" variant="secondary">Secondary</Button>
					<Button size="sm" variant="outline">Outline</Button>
					<Button size="sm" variant="ghost">Ghost</Button>
					<Button size="icon" class="size-8" aria-label="Add"><Plus class="size-4" /></Button>
				</div>
				<div class="flex flex-wrap items-center gap-2">
					<Badge>Primary</Badge>
					<Badge variant="secondary">Secondary</Badge>
					<Badge variant="success">Success</Badge>
					<Badge variant="warning">Warning</Badge>
					<Badge variant="outline">Outline</Badge>
				</div>
			</div>
			<div class="flex items-center gap-5">
				<div class="flex -space-x-2">
					<Avatar.Root class="size-9 ring-2 ring-[color:var(--card)]">
						<Avatar.Image src="https://i.pravatar.cc/64?img=12" alt="a" />
						<Avatar.Fallback>RV</Avatar.Fallback>
					</Avatar.Root>
					<Avatar.Root class="size-9 ring-2 ring-[color:var(--card)]">
						<Avatar.Image src="https://i.pravatar.cc/64?img=32" alt="b" />
						<Avatar.Fallback>KO</Avatar.Fallback>
					</Avatar.Root>
					<Avatar.Root class="size-9 ring-2 ring-[color:var(--card)]">
						<Avatar.Fallback>+5</Avatar.Fallback>
					</Avatar.Root>
				</div>
				<CircularGauge value={level} size={84} label="Focus">
					<Drop weight="fill" class="size-5 text-[color:var(--primary)]" />
				</CircularGauge>
			</div>
		</div>

		<Separator />

		<div class="grid gap-x-10 gap-y-6 md:grid-cols-2">
			<!-- Inputs -->
			<div class="flex flex-col gap-5">
				<div class="flex flex-col gap-2">
					<Label for="s-email">Email</Label>
					<Input id="s-email" type="email" placeholder="you@mizu.dev" />
				</div>

				<div class="flex flex-col gap-2">
					<Label>Water source</Label>
					<Select.Root type="single" bind:value={fruit}>
						<Select.Trigger class="w-full">{fruit || 'Pick a water source'}</Select.Trigger>
						<Select.Content>
							<Select.Item value="Ocean">Ocean</Select.Item>
							<Select.Item value="Lake">Lake</Select.Item>
							<Select.Item value="River">River</Select.Item>
							<Select.Item value="Rain">Rain</Select.Item>
						</Select.Content>
					</Select.Root>
				</div>

				<div class="flex flex-col gap-2">
					<div class="flex items-center justify-between text-sm">
						<span class="font-semibold">Clarity</span>
						<span class="font-mono tabular-nums text-muted-foreground">{level}%</span>
					</div>
					<Slider type="single" bind:value={level} max={100} />
					<Progress value={level} class="h-1.5" />
				</div>

				<ToggleGroup.Root type="single" bind:value={align}>
					<ToggleGroup.Item value="left">Left</ToggleGroup.Item>
					<ToggleGroup.Item value="center">Center</ToggleGroup.Item>
					<ToggleGroup.Item value="right">Right</ToggleGroup.Item>
				</ToggleGroup.Root>
			</div>

			<!-- Selection + feedback + overlays -->
			<div class="flex flex-col gap-5">
				<div class="flex flex-col gap-3">
					<label class="flex items-center justify-between text-sm font-semibold">
						Glossy surfaces <Switch bind:checked={glossy} />
					</label>
					<label class="flex items-center gap-2 text-sm font-semibold">
						<Checkbox bind:checked={agree} /> Accept terms
					</label>
					<RadioGroup.Root bind:value={plan} class="flex gap-4">
						<label class="flex items-center gap-2 text-sm"
							><RadioGroup.Item value="free" /> Free</label
						>
						<label class="flex items-center gap-2 text-sm"
							><RadioGroup.Item value="pro" /> Pro</label
						>
					</RadioGroup.Root>
				</div>

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

				<Alert.Root variant="success">
					<CheckCircle />
					<Alert.Title>Saved</Alert.Title>
					<Alert.Description>Your changes synced just now.</Alert.Description>
				</Alert.Root>

				<div class="flex flex-wrap items-center gap-2">
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
					<Tooltip.Root>
						<Tooltip.Trigger class={buttonVariants({ variant: 'ghost', size: 'sm' })}>
							Tooltip
						</Tooltip.Trigger>
						<Tooltip.Content>Crystal clear, even up close.</Tooltip.Content>
					</Tooltip.Root>
					<KbdGroup><Kbd>⌘</Kbd><Kbd>K</Kbd></KbdGroup>
				</div>
			</div>
		</div>
	</div>
</Tooltip.Provider>
