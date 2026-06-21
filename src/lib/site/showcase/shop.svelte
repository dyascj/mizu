<script lang="ts">
	import Plus from 'phosphor-svelte/lib/Plus';
	import Minus from 'phosphor-svelte/lib/Minus';
	import Sparkle from 'phosphor-svelte/lib/Sparkle';
	import Fire from 'phosphor-svelte/lib/Fire';
	import Storefront from 'phosphor-svelte/lib/Storefront';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Slider } from '$lib/components/ui/slider';
	import { Separator } from '$lib/components/ui/separator';
	import * as ButtonGroup from '$lib/components/ui/button-group';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import * as Dialog from '$lib/components/ui/dialog';

	const menu = [
		{ emoji: '🍜', name: 'Tonkotsu', jp: '豚骨', price: 980 },
		{ emoji: '🍥', name: 'Shoyu', jp: '醤油', price: 880 },
		{ emoji: '🌽', name: 'Miso', jp: '味噌', price: 920 }
	];
	let qty = $state([1, 0, 0]);
	let firmness = $state('normal');
	let spice = $state(2);
	let egg = $state(true);
	let nori = $state(false);
	let chashu = $state(true);

	const total = $derived(
		menu.reduce((sum, m, i) => sum + m.price * qty[i], 0) +
			(egg ? 120 : 0) +
			(chashu ? 280 : 0) +
			(nori ? 90 : 0)
	);
	const yen = (n: number) => '¥' + n.toLocaleString('en-US');

	const prizes = [
		{ name: 'Extra Chashu', rare: 'SSR' },
		{ name: 'Ajitama egg', rare: 'R' },
		{ name: 'Nori sheet', rare: 'N' },
		{ name: 'Garlic clove', rare: 'N' }
	];
	let pull = $state(0);
	const advance = () => (pull = (pull + 1) % prizes.length);
</script>

<div class="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
	<!-- Menu -->
	<section
		class="relative rounded-2xl border border-[color:var(--glass-border)] glass-strong gloss p-5"
	>
		<div class="flex items-center justify-between">
			<p
				class="flex items-center gap-2 font-display text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase"
			>
				<Storefront class="size-4" /> らーめん Ramen-ya
			</p>
			<Badge variant="success">Open</Badge>
		</div>

		<div class="mt-4 flex flex-col gap-2">
			{#each menu as m, i (m.name)}
				<div class="flex items-center gap-3 rounded-2xl border border-border bg-secondary/30 p-3">
					<div
						class="grid size-12 shrink-0 place-items-center rounded-xl bg-[color:var(--card)] text-2xl shadow-bevel"
					>
						{m.emoji}
					</div>
					<div class="min-w-0 grow">
						<p class="font-semibold">{m.name} <span class="text-muted-foreground">{m.jp}</span></p>
						<p class="font-mono text-sm tabular-nums text-muted-foreground">{yen(m.price)}</p>
					</div>
					<ButtonGroup.Root>
						<Button
							variant="secondary"
							size="icon"
							aria-label="Less"
							onclick={() => (qty[i] = Math.max(0, qty[i] - 1))}
						>
							<Minus class="size-4" />
						</Button>
						<div
							class="grid w-9 place-items-center border-y border-border bg-card font-mono text-sm tabular-nums"
						>
							{qty[i]}
						</div>
						<Button variant="secondary" size="icon" aria-label="More" onclick={() => (qty[i] += 1)}>
							<Plus class="size-4" />
						</Button>
					</ButtonGroup.Root>
				</div>
			{/each}
		</div>

		<Separator class="my-4" />

		<div class="grid gap-4 sm:grid-cols-2">
			<div>
				<p class="mb-2 text-sm font-semibold">Noodle firmness</p>
				<RadioGroup.Root bind:value={firmness} class="flex flex-col gap-1.5">
					<label class="flex items-center gap-2 text-sm"
						><RadioGroup.Item value="soft" /> Yawamen (soft)</label
					>
					<label class="flex items-center gap-2 text-sm"
						><RadioGroup.Item value="normal" /> Futsuu (normal)</label
					>
					<label class="flex items-center gap-2 text-sm"
						><RadioGroup.Item value="firm" /> Barikata (firm)</label
					>
				</RadioGroup.Root>
			</div>
			<div>
				<p class="mb-2 text-sm font-semibold">Toppings</p>
				<div class="flex flex-col gap-1.5 text-sm">
					<label class="flex items-center gap-2"
						><Checkbox bind:checked={egg} /> Ajitama egg
						<span class="text-muted-foreground">+¥120</span></label
					>
					<label class="flex items-center gap-2"
						><Checkbox bind:checked={chashu} /> Chashu pork
						<span class="text-muted-foreground">+¥280</span></label
					>
					<label class="flex items-center gap-2"
						><Checkbox bind:checked={nori} /> Nori
						<span class="text-muted-foreground">+¥90</span></label
					>
				</div>
				<div class="mt-3 mb-1 flex items-center justify-between text-sm">
					<span class="flex items-center gap-1.5 font-semibold"
						><Fire class="size-4 text-[color:var(--destructive)]" /> Spice</span
					>
					<span class="font-mono tabular-nums text-muted-foreground">{spice}/5</span>
				</div>
				<Slider type="single" bind:value={spice} max={5} />
			</div>
		</div>
	</section>

	<!-- Order + gacha -->
	<div class="flex flex-col gap-4">
		<section class="rounded-2xl border border-[color:var(--glass-border)] glass p-4">
			<h4 class="mb-3 text-sm font-bold">Your order</h4>
			<div class="flex flex-col gap-1.5 text-sm">
				{#each menu as m, i (m.name)}
					{#if qty[i] > 0}
						<div class="flex justify-between">
							<span class="text-muted-foreground">{m.name} × {qty[i]}</span>
							<span class="font-mono tabular-nums">{yen(m.price * qty[i])}</span>
						</div>
					{/if}
				{/each}
				{#if egg}<div class="flex justify-between text-muted-foreground">
						<span>Ajitama egg</span><span class="font-mono tabular-nums">¥120</span>
					</div>{/if}
				{#if chashu}<div class="flex justify-between text-muted-foreground">
						<span>Chashu pork</span><span class="font-mono tabular-nums">¥280</span>
					</div>{/if}
				{#if nori}<div class="flex justify-between text-muted-foreground">
						<span>Nori</span><span class="font-mono tabular-nums">¥90</span>
					</div>{/if}
			</div>
			<Separator class="my-3" />
			<div class="flex items-center justify-between">
				<span class="text-sm font-semibold">Total</span>
				<span class="font-mono text-lg font-bold tabular-nums">{yen(total)}</span>
			</div>
			<Button class="mt-3 w-full">Checkout</Button>
		</section>

		<section
			class="rounded-2xl border border-[color:var(--glass-border)] glass-strong gloss p-4 text-center"
		>
			<p class="flex items-center justify-center gap-1.5 font-display text-sm font-bold">
				<Sparkle weight="fill" class="size-4 text-[color:var(--primary)]" /> Lucky Bowl Gacha
			</p>
			<p class="mt-1 text-xs text-muted-foreground">Pull for a free topping with any order.</p>
			<Dialog.Root>
				<Dialog.Trigger class={buttonVariants({ size: 'sm' }) + ' mt-3'} onclick={advance}>
					🎰 Pull · ¥300
				</Dialog.Trigger>
				<Dialog.Content>
					<Dialog.Header>
						<Dialog.Title class="text-center">You pulled!</Dialog.Title>
					</Dialog.Header>
					<div class="flex flex-col items-center gap-3 py-2">
						<div
							class="grid size-20 place-items-center rounded-2xl gradient-primary gloss text-4xl shadow-aqua"
						>
							🍥
						</div>
						<div class="text-center">
							<p class="font-display text-lg font-extrabold">{prizes[pull].name}</p>
							<Badge
								variant={prizes[pull].rare === 'SSR'
									? 'success'
									: prizes[pull].rare === 'R'
										? 'secondary'
										: 'outline'}
							>
								{prizes[pull].rare}
							</Badge>
						</div>
					</div>
					<Dialog.Footer>
						<Button class="w-full">Add to bowl</Button>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Root>
		</section>
	</div>
</div>
