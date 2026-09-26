<script lang="ts">
	import { ImageHotspots } from '$lib/components/ui/image-hotspots';

	// The drawing's frame, cropped close to the phone.
	const frame = { x: 20, y: 8, w: 260, h: 384 };
	const at = (x: number, y: number) => ({ x: (x - frame.x) / frame.w, y: (y - frame.y) / frame.h });

	// Points on the drawing below, in its own units.
	const hotspots = [
		{
			...at(136, 46),
			title: 'Model picker',
			body: 'Switch between fast and deep models mid-chat.'
		},
		{
			...at(232, 46),
			title: 'Context meter',
			body: 'Fills as the chat grows. Tap to see what it remembers.'
		},
		{
			...at(136, 263),
			title: 'Sources',
			body: 'Every claim links to where it came from.'
		},
		{
			...at(64, 352),
			title: 'Attach files',
			body: 'Drop in PDFs, sheets, or screenshots. They stay in this chat.'
		},
		{
			...at(236, 352),
			title: 'Voice mode',
			body: 'Talk it through hands-free. Interrupt any time.'
		}
	];

	// The phone itself: what the card should never sit on.
	const phone = { ...at(24, 12), w: 252 / frame.w, h: 376 / frame.h };
</script>

<!-- An assistant's chat screen, drawn in theme tokens so it follows light and dark. -->
{#snippet screen()}
	<svg
		viewBox="{frame.x} {frame.y} {frame.w} {frame.h}"
		class="size-full overflow-visible drop-shadow-lg"
	>
		<rect x="24" y="12" width="252" height="376" rx="32" class="fill-card" />
		<!-- Header: model picker and context meter. -->
		<rect x="44" y="32" width="104" height="28" rx="14" class="fill-secondary" />
		<text x="58" y="50.5" class="fill-foreground text-[11px] font-medium">Atlas 3</text>
		<path
			d="M126 44l4 4 4-4"
			fill="none"
			stroke-width="1.6"
			stroke-linecap="round"
			stroke-linejoin="round"
			class="stroke-muted-foreground"
		/>
		<circle cx="232" cy="46" r="11" fill="none" stroke-width="3" class="stroke-secondary" />
		<circle
			cx="232"
			cy="46"
			r="11"
			fill="none"
			stroke-width="3"
			stroke-linecap="round"
			stroke-dasharray="44 100"
			transform="rotate(-90 232 46)"
			class="stroke-foreground"
		/>
		<!-- The question. -->
		<rect x="120" y="84" width="136" height="44" rx="18" class="fill-primary" />
		<rect x="136" y="98" width="100" height="6" rx="3" class="fill-primary-foreground/70" />
		<rect x="136" y="110" width="64" height="6" rx="3" class="fill-primary-foreground/70" />
		<!-- The answer, with its sources underneath. -->
		<rect x="44" y="150" width="200" height="6" rx="3" class="fill-foreground/25" />
		<rect x="44" y="166" width="184" height="6" rx="3" class="fill-foreground/25" />
		<rect x="44" y="182" width="196" height="6" rx="3" class="fill-foreground/25" />
		<rect x="44" y="198" width="120" height="6" rx="3" class="fill-foreground/25" />
		<rect x="44" y="222" width="172" height="6" rx="3" class="fill-foreground/25" />
		<rect x="44" y="238" width="96" height="6" rx="3" class="fill-foreground/25" />
		<rect x="44" y="254" width="60" height="18" rx="9" class="fill-secondary" />
		<rect x="110" y="254" width="52" height="18" rx="9" class="fill-secondary" />
		<rect x="168" y="254" width="44" height="18" rx="9" class="fill-secondary" />
		<rect x="54" y="261" width="40" height="4" rx="2" class="fill-muted-foreground/60" />
		<rect x="120" y="261" width="32" height="4" rx="2" class="fill-muted-foreground/60" />
		<rect x="178" y="261" width="24" height="4" rx="2" class="fill-muted-foreground/60" />
		<!-- Composer: attach, prompt, and voice. -->
		<rect x="40" y="332" width="220" height="40" rx="20" class="fill-secondary" />
		<path
			d="M70 347l-8.5 8.5a4 4 0 0 1-5.7-5.7l9-9a2.6 2.6 0 0 1 3.7 3.7l-8.6 8.6"
			fill="none"
			stroke-width="1.6"
			stroke-linecap="round"
			stroke-linejoin="round"
			class="stroke-muted-foreground"
		/>
		<text x="84" y="356" class="fill-muted-foreground text-[11px]">Ask anything</text>
		<circle cx="236" cy="352" r="14" class="fill-primary" />
		<rect x="233" y="344" width="6" height="11" rx="3" class="fill-primary-foreground" />
		<path
			d="M229.5 352.5a6.5 6.5 0 0 0 13 0M236 359v3"
			fill="none"
			stroke-width="1.6"
			stroke-linecap="round"
			class="stroke-primary-foreground"
		/>
	</svg>
{/snippet}

<div class="flex w-full max-w-2xl flex-col gap-4">
	<ImageHotspots
		label="Assistant chat screen, feature tour"
		image={screen}
		aspect={frame.w / frame.h}
		{hotspots}
		subject={phone}
		active={2}
		class="aspect-[1/2] sm:aspect-video"
	/>
	<div class="flex items-baseline justify-between gap-4 px-1">
		<div class="min-w-0">
			<p class="font-semibold tracking-tight">What's new in chat</p>
			<p class="text-muted-foreground text-sm">Tap a point, or use the arrow keys.</p>
		</div>
		<p class="text-muted-foreground shrink-0 text-sm tabular-nums">5 features</p>
	</div>
</div>
