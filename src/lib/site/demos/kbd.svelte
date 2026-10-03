<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import {
		Kbd,
		KbdGroup,
		isApplePlatform,
		shortcutMatches,
		shortcutSpoken
	} from '$lib/components/ui/kbd';
	import { duration, stagger } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	const chord = ['Mod', 'Enter'];

	let mac = $state(false);
	let sent = $state(false);
	/** Caps held down by a click, pressed one after another like fingers would. */
	let playing = $state<boolean[]>([false, false]);
	let timers: ReturnType<typeof setTimeout>[] = [];
	let sentTimer: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		mac = isApplePlatform();
		return () => {
			timers.forEach(clearTimeout);
			clearTimeout(sentTimer);
		};
	});

	// A second send restarts the confirmation instead of cutting it short.
	function send() {
		sent = true;
		clearTimeout(sentTimer);
		sentTimer = setTimeout(() => (sent = false), duration.ambient);
	}

	function play() {
		timers.forEach(clearTimeout);
		timers = [];
		chord.forEach((_, index) =>
			timers.push(setTimeout(() => (playing[index] = true), index * stagger * 2))
		);
		timers.push(
			setTimeout(
				() => {
					playing = [false, false];
					send();
				},
				chord.length * stagger * 2 + duration.instant
			)
		);
	}

	function onkeydown(event: KeyboardEvent) {
		if (event.repeat || !shortcutMatches(chord, event, mac)) return;
		event.preventDefault();
		send();
	}
</script>

<svelte:window {onkeydown} />

<div class="text-muted-foreground flex items-center gap-2 text-sm">
	<span>Press</span>
	<button
		type="button"
		aria-label="{shortcutSpoken(chord, mac)}, send the prompt"
		class="focus-visible:ring-ring focus-visible:ring-offset-background -mx-1 flex touch-manipulation items-center rounded-lg px-1 pt-0.5 pb-1 outline-none select-none focus-visible:ring-2 focus-visible:ring-offset-2"
		onclick={play}
	>
		<KbdGroup>
			<Kbd match="mod" pressed={playing[0]} />
			<Kbd match="Enter" pressed={playing[1]}>Enter</Kbd>
		</KbdGroup>
	</button>
	<span class="grid">
		<span
			class={cn(
				'col-start-1 row-start-1 transition-[opacity,filter,translate] motion-reduce:transition-opacity',
				sent
					? '-translate-y-1 opacity-0 blur-[3px] duration-(--duration-fast) ease-in motion-reduce:translate-y-0 motion-reduce:blur-none'
					: 'duration-(--duration-base) ease-out'
			)}
		>
			to send the prompt
		</span>
		<span
			aria-hidden="true"
			class={cn(
				'text-foreground col-start-1 row-start-1 inline-flex items-center gap-1.5 whitespace-nowrap transition-[opacity,filter,translate] motion-reduce:transition-opacity',
				sent
					? 'duration-(--duration-base) ease-out'
					: 'translate-y-1 opacity-0 blur-[3px] duration-(--duration-fast) ease-in motion-reduce:translate-y-0 motion-reduce:blur-none'
			)}
		>
			<Check class="size-3.5" />
			Prompt sent
		</span>
	</span>
	<span class="sr-only" aria-live="polite">{sent ? 'Prompt sent' : ''}</span>
</div>
