<script lang="ts">
	import Anchor from 'phosphor-svelte/lib/Anchor';
	import Lightbulb from 'phosphor-svelte/lib/Lightbulb';
	import Broadcast from 'phosphor-svelte/lib/Broadcast';
	import Eye from 'phosphor-svelte/lib/Eye';
	import Warning from 'phosphor-svelte/lib/Warning';
	import ArrowUp from 'phosphor-svelte/lib/ArrowUp';
	import ArrowDown from 'phosphor-svelte/lib/ArrowDown';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Progress } from '$lib/components/ui/progress';
	import { CircularGauge } from '$lib/components/ui/circular-gauge';
	import { Switch } from '$lib/components/ui/switch';
	import { Slider } from '$lib/components/ui/slider';
	import { Separator } from '$lib/components/ui/separator';
	import * as ToggleGroup from '$lib/components/ui/toggle-group';
	import * as Alert from '$lib/components/ui/alert';

	let ballast = $state(38);
	let lights = $state(true);
	let sonar = $state(true);
	let periscope = $state(false);
	let view = $state('sonar');

	const blips = [
		{ x: 64, y: 30 },
		{ x: 28, y: 58 },
		{ x: 78, y: 70 }
	];
</script>

<div class="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
	<!-- Status + sonar -->
	<section
		class="relative rounded-2xl border border-[color:var(--glass-border)] glass-strong gloss p-5"
	>
		<div class="flex items-center justify-between">
			<p class="font-display text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">
				深海 Nautilus
			</p>
			<Badge variant="success" class="gap-1.5">
				<span class="size-1.5 rounded-full bg-current"></span> Nominal
			</Badge>
		</div>

		<div class="mt-4 flex items-end justify-between">
			<div>
				<p class="text-[0.65rem] tracking-wider text-muted-foreground uppercase">Depth</p>
				<p class="font-mono text-3xl font-bold tabular-nums text-foreground">
					1,204<span class="text-base text-muted-foreground">m</span>
				</p>
			</div>
			<div class="text-right">
				<p class="text-[0.65rem] tracking-wider text-muted-foreground uppercase">Heading</p>
				<p class="font-mono text-xl font-bold tabular-nums">214°</p>
			</div>
		</div>

		<div class="mt-4 flex justify-center">
			<div
				class="sonar relative grid size-44 place-items-center rounded-full border border-[color:var(--glass-border)] bg-[color:var(--card)]/40"
			>
				<div class="absolute size-2/3 rounded-full border border-[color:var(--glass-border)]"></div>
				<div class="absolute size-1/3 rounded-full border border-[color:var(--glass-border)]"></div>
				<div class="absolute h-px w-full bg-[color:var(--glass-border)]"></div>
				<div class="absolute h-full w-px bg-[color:var(--glass-border)]"></div>
				{#if sonar}
					<div class="sonar-sweep absolute inset-0 rounded-full"></div>
					{#each blips as b, i (i)}
						<span
							class="sonar-blip absolute size-1.5 rounded-full bg-[color:var(--primary)] shadow-aqua"
							style="left: {b.x}%; top: {b.y}%; animation-delay: {i * 0.6}s;"
						></span>
					{/each}
				{/if}
				<Anchor class="size-5 text-[color:var(--primary)]" />
			</div>
		</div>

		<div class="mt-4 flex justify-center">
			<ToggleGroup.Root type="single" bind:value={view}>
				<ToggleGroup.Item value="sonar">Sonar</ToggleGroup.Item>
				<ToggleGroup.Item value="map">Map</ToggleGroup.Item>
				<ToggleGroup.Item value="cam">Cam</ToggleGroup.Item>
			</ToggleGroup.Root>
		</div>
	</section>

	<!-- Gauges + systems + controls -->
	<div class="flex flex-col gap-4">
		<section class="rounded-2xl border border-[color:var(--glass-border)] glass p-4">
			<div class="flex items-center justify-around">
				<CircularGauge value={72} size={92} label="O₂" />
				<CircularGauge value={88} size={92} label="Power" />
			</div>
			<Separator class="my-4" />
			<div class="flex flex-col gap-1.5">
				<div class="flex items-center justify-between text-sm">
					<span class="text-muted-foreground">Hull integrity</span>
					<span class="font-mono tabular-nums text-foreground">96%</span>
				</div>
				<Progress value={96} />
			</div>
			<div class="mt-3 flex flex-col gap-1.5">
				<div class="flex items-center justify-between text-sm">
					<span class="text-muted-foreground">Ballast</span>
					<span class="font-mono tabular-nums text-foreground">{ballast}%</span>
				</div>
				<Slider type="single" bind:value={ballast} max={100} />
			</div>
		</section>

		<section
			class="grid grid-cols-2 gap-2.5 rounded-2xl border border-[color:var(--glass-border)] glass p-4"
		>
			<label class="flex items-center justify-between gap-2 text-sm font-semibold">
				<span class="flex items-center gap-2"><Lightbulb class="size-4" /> Lights</span>
				<Switch bind:checked={lights} />
			</label>
			<label class="flex items-center justify-between gap-2 text-sm font-semibold">
				<span class="flex items-center gap-2"><Broadcast class="size-4" /> Sonar</span>
				<Switch bind:checked={sonar} />
			</label>
			<label class="flex items-center justify-between gap-2 text-sm font-semibold">
				<span class="flex items-center gap-2"><Eye class="size-4" /> Periscope</span>
				<Switch bind:checked={periscope} />
			</label>
			<label class="flex items-center justify-between gap-2 text-sm font-semibold">
				<span class="flex items-center gap-2"><Anchor class="size-4" /> Pump</span>
				<Switch checked />
			</label>
		</section>

		<Alert.Root variant="warning">
			<Warning />
			<Alert.Title>Pressure climbing</Alert.Title>
			<Alert.Description>Approaching crush depth. Recommend ascent.</Alert.Description>
		</Alert.Root>

		<div class="flex gap-2">
			<Button class="grow"><ArrowUp class="size-4" /> Surface</Button>
			<Button variant="secondary" class="grow"><ArrowDown class="size-4" /> Dive</Button>
			<Button variant="destructive" aria-label="Emergency blow"><Warning class="size-4" /></Button>
		</div>
	</div>
</div>

<style>
	.sonar-sweep {
		background: conic-gradient(
			from 0deg,
			color-mix(in oklab, var(--primary) 45%, transparent),
			transparent 40%
		);
		animation: sonar-spin 4s linear infinite;
	}
	.sonar-blip {
		animation: sonar-pulse 2.4s ease-out infinite;
	}
	@keyframes sonar-spin {
		to {
			transform: rotate(360deg);
		}
	}
	@keyframes sonar-pulse {
		0%,
		100% {
			opacity: 0.25;
			transform: scale(0.8);
		}
		50% {
			opacity: 1;
			transform: scale(1.3);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.sonar-sweep,
		.sonar-blip {
			animation: none;
		}
	}
</style>
