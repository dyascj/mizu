<script lang="ts">
	import AudioLines from '@lucide/svelte/icons/audio-lines';
	import Bot from '@lucide/svelte/icons/bot';
	import Brain from '@lucide/svelte/icons/brain';
	import MessageCircle from '@lucide/svelte/icons/message-circle';
	import Paperclip from '@lucide/svelte/icons/paperclip';
	import Pause from '@lucide/svelte/icons/pause';
	import Play from '@lucide/svelte/icons/play';
	import { prefersReducedMotion } from '$lib/components/ui/motion';
	import { PageDots } from '$lib/components/ui/page-dots';
	import { cn } from '$lib/utils.js';

	const slides = [
		{ icon: MessageCircle, title: 'Ask anything', note: 'Plans, drafts, and answers in seconds.' },
		{ icon: Paperclip, title: 'Bring your files', note: 'Drop in a PDF and ask about page 40.' },
		{ icon: AudioLines, title: 'Talk it through', note: 'Voice mode listens while you walk.' },
		{ icon: Brain, title: 'Remembers what matters', note: 'Your tone and projects, kept.' },
		{ icon: Bot, title: 'Works while you are away', note: 'Agents finish long tasks overnight.' }
	];

	let scroller = $state<HTMLDivElement | null>(null);
	let region = $state<HTMLDivElement | null>(null);
	let toggle = $state<HTMLButtonElement | null>(null);
	let progress = $state(0);

	// Null until the reader picks, so reduced motion can start paused.
	let choice = $state<boolean | null>(null);
	let reduce = $state(false);
	let hovered = $state(false);
	let focused = $state(false);
	let scrolling = $state(false);
	let visible = $state(true);
	const playing = $derived(choice ?? !reduce);
	const running = $derived(playing && !hovered && !focused && !scrolling && visible);

	$effect(() => {
		reduce = prefersReducedMotion();
		const onVisibility = () => (visible = !document.hidden);
		document.addEventListener('visibilitychange', onVisibility);
		return () => document.removeEventListener('visibilitychange', onVisibility);
	});

	$effect(() => {
		const el = scroller;
		if (!el) return;
		let frame = 0;
		const read = () => {
			frame = 0;
			const max = el.scrollWidth - el.clientWidth;
			progress = max > 0 ? (el.scrollLeft / max) * (slides.length - 1) : 0;
		};

		// Only wheel and touch mark a scroll as the reader's, so autoplay's own
		// smooth scrolls never pause autoplay.
		let touching = false;
		let busy = false;
		let quiet: ReturnType<typeof setTimeout> | undefined;
		const settleSoon = () => {
			clearTimeout(quiet);
			quiet = setTimeout(() => {
				if (touching) return;
				busy = false;
				scrolling = false;
			}, 200);
		};
		const start = () => {
			busy = true;
			scrolling = true;
		};
		const onScroll = () => {
			frame ||= requestAnimationFrame(read);
			if (busy) settleSoon();
		};
		const onWheel = () => {
			start();
			settleSoon();
		};
		const onTouchStart = () => {
			touching = true;
			clearTimeout(quiet);
			start();
		};
		const onTouchEnd = () => {
			touching = false;
			settleSoon();
		};

		const passive = { passive: true };
		el.addEventListener('scroll', onScroll, passive);
		el.addEventListener('wheel', onWheel, passive);
		el.addEventListener('touchstart', onTouchStart, passive);
		el.addEventListener('touchend', onTouchEnd, passive);
		el.addEventListener('touchcancel', onTouchEnd, passive);
		return () => {
			el.removeEventListener('scroll', onScroll);
			el.removeEventListener('wheel', onWheel);
			el.removeEventListener('touchstart', onTouchStart);
			el.removeEventListener('touchend', onTouchEnd);
			el.removeEventListener('touchcancel', onTouchEnd);
			cancelAnimationFrame(frame);
			clearTimeout(quiet);
		};
	});

	function goTo(index: number) {
		if (!scroller) return;
		const max = scroller.scrollWidth - scroller.clientWidth;
		scroller.scrollTo({
			left: (index / (slides.length - 1)) * max,
			behavior: prefersReducedMotion() ? 'auto' : 'smooth'
		});
	}

	// Past the last slide it scrolls back to the first, and the pill crawls home
	// through every dot, so the loop reads as a deliberate rewind.
	const advance = () => goTo((Math.round(progress) + 1) % slides.length);

	// The toggle is left out: hovering it to press play must not keep autoplay paused.
	const inside = (node: EventTarget | null) =>
		node instanceof Node && !!region?.contains(node) && !toggle?.contains(node);

	const icon =
		'col-start-1 row-start-1 size-4 [transition:scale_var(--duration-spring)_var(--ease-spring),opacity_var(--duration-fast)_var(--ease-out),filter_var(--duration-fast)_var(--ease-out)] motion-reduce:transition-opacity';
</script>

<div
	bind:this={region}
	role="group"
	aria-label="Feature tour"
	class="flex w-full max-w-sm flex-col items-center gap-3"
	onpointerover={(event) => {
		if (event.pointerType !== 'touch') hovered = inside(event.target);
	}}
	onpointerleave={() => (hovered = false)}
	onfocusin={(event) => {
		// Only keyboard focus pauses; a clicked dot would otherwise hold it forever.
		if (inside(event.target) && (event.target as HTMLElement).matches(':focus-visible')) {
			focused = true;
		}
	}}
	onfocusout={(event) => {
		if (!inside(event.relatedTarget)) focused = false;
	}}
>
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div
		bind:this={scroller}
		tabindex="0"
		role="region"
		aria-label="What your assistant can do"
		aria-roledescription="carousel"
		aria-live={running ? 'off' : 'polite'}
		class="focus-visible:ring-ring flex w-full snap-x snap-mandatory [scrollbar-width:none] gap-3 overflow-x-auto overscroll-x-contain rounded-2xl outline-none focus-visible:ring-2 [&::-webkit-scrollbar]:hidden"
	>
		{#each slides as slide, i (slide.title)}
			{@const Icon = slide.icon}
			<div
				role="group"
				aria-roledescription="slide"
				aria-label="{i + 1} of {slides.length}"
				class="bg-secondary flex h-44 w-full shrink-0 snap-center snap-always flex-col justify-end rounded-2xl p-5"
			>
				<span class="bg-card mb-auto grid size-9 place-items-center rounded-full shadow-xs">
					<Icon class="size-4" />
				</span>
				<p class="font-semibold tracking-tight">{slide.title}</p>
				<p class="text-muted-foreground mt-0.5 text-sm">{slide.note}</p>
			</div>
		{/each}
	</div>
	<!-- A spacer as wide as the toggle keeps the dots centered under the cards. -->
	<div class="flex items-center gap-3">
		<span aria-hidden="true" class="size-8"></span>
		<PageDots
			count={slides.length}
			{progress}
			onIndexChange={goTo}
			duration={3000}
			playing={running}
			onElapsed={advance}
			label="Slides"
		/>
		<button
			bind:this={toggle}
			type="button"
			aria-label="Pause autoplay"
			aria-pressed={!playing}
			onclick={() => (choice = !playing)}
			class="text-muted-foreground hover:text-foreground hover:bg-foreground/8 focus-visible:ring-ring grid size-8 place-items-center rounded-full transition-[background-color,color,scale] duration-(--duration-fast) ease-out outline-none focus-visible:ring-2 active:scale-[0.92]"
		>
			<Pause
				aria-hidden="true"
				class={cn(icon, playing ? 'scale-100 opacity-100' : 'scale-25 opacity-0 blur-xs')}
			/>
			<Play
				aria-hidden="true"
				class={cn(icon, playing ? 'scale-25 opacity-0 blur-xs' : 'scale-100 opacity-100')}
			/>
		</button>
	</div>
</div>
