<script lang="ts">
	import type { Snippet } from 'svelte';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import { cn } from '$lib/utils.js';
	import { playground, type CursorStep } from './autoplay.svelte';

	let {
		label,
		href,
		steps = [],
		cursor = '#626afb',
		class: className,
		children
	}: {
		label: string;
		href: string;
		/** A looping script for the ghost cursor. Empty cards stay still. */
		steps?: CursorStep[];
		/** Fill color of the ghost cursor. */
		cursor?: string;
		class?: string;
		children: Snippet;
	} = $props();

	let card = $state<HTMLElement>();
	let position = $state({ x: 0, y: 0 });
	let visible = $state(false);
	let pressing = $state(false);
	let engaged = $state(false);
	let inView = $state(false);

	const running = $derived(playground.autoplay && inView && !engaged);

	$effect(() => {
		if (!card || typeof IntersectionObserver === 'undefined') return;
		const observer = new IntersectionObserver(([entry]) => (inView = entry.isIntersecting), {
			threshold: 0.35
		});
		observer.observe(card);
		return () => observer.disconnect();
	});

	$effect(() => {
		const root = card;
		if (!root || !running || steps.length === 0) {
			visible = false;
			return;
		}
		if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

		let cancelled = false;
		let pending: ReturnType<typeof setTimeout> | undefined;
		const sleep = (ms: number) =>
			new Promise<void>((resolve) => {
				pending = setTimeout(resolve, ms);
			});

		const moveTo = async (element: Element) => {
			const box = root.getBoundingClientRect();
			const rect = element.getBoundingClientRect();
			position = {
				x: rect.left - box.left + rect.width * 0.55,
				y: rect.top - box.top + rect.height * 0.6
			};
			visible = true;
			await sleep(760);
		};

		const act = async (step: CursorStep, element: HTMLElement) => {
			const action = step.action ?? 'click';
			if (action === 'type' && 'value' in element) {
				const field = element as HTMLInputElement;
				for (const character of step.text ?? '') {
					if (cancelled) return;
					field.value += character;
					field.dispatchEvent(new Event('input', { bubbles: true }));
					await sleep(55);
				}
				return;
			}
			if (action === 'hover') {
				element.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }));
				return;
			}
			pressing = true;
			if (action === 'hold') {
				// A synthetic pointer cannot be captured, so hold through the keyboard path.
				element.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
				await sleep(step.hold ?? 1400);
				element.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', bubbles: true }));
			} else {
				await sleep(140);
				element.click();
			}
			pressing = false;
		};

		(async () => {
			await sleep(900);
			while (!cancelled) {
				for (const step of steps) {
					if (cancelled) return;
					const element = root.querySelector<HTMLElement>(step.target);
					if (!element) continue;
					await moveTo(element);
					if (cancelled) return;
					await act(step, element);
					await sleep(step.wait ?? 900);
				}
			}
		})();

		return () => {
			cancelled = true;
			pressing = false;
			clearTimeout(pending);
		};
	});
</script>

<article
	bind:this={card}
	onpointerenter={(event) => event.isTrusted && (engaged = true)}
	onpointerleave={(event) => event.isTrusted && (engaged = false)}
	onfocusin={() => (engaged = true)}
	onfocusout={(event) => {
		if (!card?.contains(event.relatedTarget as Node)) engaged = false;
	}}
	class={cn(
		'bg-secondary/60 dark:bg-card relative isolate flex min-h-80 min-w-0 flex-col overflow-hidden rounded-[2rem]',
		className
	)}
>
	<div class="flex flex-1 items-center justify-center px-6 pt-8 pb-20 sm:px-10">
		{@render children()}
	</div>
	<a
		{href}
		class="bg-card/80 text-foreground hover:bg-card focus-visible:ring-ring group absolute bottom-4 left-4 inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-sm font-medium shadow-xs backdrop-blur transition-colors duration-(--duration-fast) outline-none focus-visible:ring-2"
	>
		{label}
		<ArrowUpRight
			class="size-3.5 opacity-0 transition-[opacity,translate] duration-(--duration-fast) group-hover:translate-x-0.5 group-hover:opacity-100"
		/>
	</a>
	<svg
		viewBox="0 0 24 24"
		aria-hidden="true"
		class="pointer-events-none absolute top-0 left-0 z-10 size-6 drop-shadow-[0_2px_4px_rgb(0_0_0/0.2)] transition-[translate,scale,opacity] ease-in-out"
		style:translate="{position.x}px {position.y}px"
		style:scale={pressing ? 0.82 : 1}
		style:opacity={visible ? 1 : 0}
		style:transition-duration="760ms, var(--duration-instant), var(--duration-slow)"
	>
		<path
			d="M4.4 2.6 20 10.2c.9.4.8 1.7-.2 2l-6 1.8a1 1 0 0 0-.7.7l-1.8 6c-.3 1-1.6 1.1-2 .2L1.8 5.2c-.5-1.1.6-2.1 1.6-1.6Z"
			fill={cursor}
			stroke="white"
			stroke-width="1.6"
			stroke-linejoin="round"
		/>
	</svg>
</article>
