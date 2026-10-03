<script lang="ts" module>
	export type AvatarStackPerson = {
		/** Full name. Read aloud, shown above the face, and used for initials. */
		name: string;
		/** Photo URL. Without one, the face shows initials on a gray tint. */
		src?: string;
	};
</script>

<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import * as Avatar from '$lib/components/ui/avatar';
	import { SpringValue, springPresets } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** Everyone in the group, in order. */
		people: AvatarStackPerson[];
		/** Faces shown before the rest collapse into a "+N" face. */
		max?: number;
		/** Face diameter in pixels. */
		size?: number;
		/** Accessible name for the group, such as "Project members". */
		label?: string;
		/** Called when a face is chosen. */
		onSelect?: (person: AvatarStackPerson) => void;
		/** Called with everyone hidden behind the "+N" face when it is chosen. */
		onMore?: (hidden: AvatarStackPerson[]) => void;
		/** The toolbar element. */
		ref?: HTMLDivElement | null;
		/**
		 * Classes for the toolbar. Each face sits in a cutout ring painted with
		 * `--avatar-ring`, which defaults to the page background; set it to
		 * `var(--card)` inside a card.
		 */
		class?: string;
	};

	let {
		people,
		max = 5,
		size = 40,
		label = 'Members',
		onSelect,
		onMore,
		ref = $bindable(null),
		class: className,
		onpointerenter: onpointerenterProp,
		onpointerleave: onpointerleaveProp,
		onfocusin: onfocusinProp,
		onfocusout: onfocusoutProp,
		onkeydown: onkeydownProp,
		...restProps
	}: Props = $props();

	// Stacked, each face hides a third of the one before it. Fanned, a small
	// gap, close enough to still read as one group.
	const closedStep = $derived(size * 0.68);
	const openStep = $derived(size * 1.14);

	// Opaque tints, since overlapping translucent ones would show each other
	// through. Mixed from the muted fill, so they stay off the page in both
	// themes.
	const tints = [
		'bg-[color-mix(in_oklab,var(--foreground)_8%,var(--muted))]',
		'bg-[color-mix(in_oklab,var(--foreground)_14%,var(--muted))]',
		'bg-[color-mix(in_oklab,var(--foreground)_20%,var(--muted))]',
		'bg-[color-mix(in_oklab,var(--foreground)_11%,var(--muted))]',
		'bg-[color-mix(in_oklab,var(--foreground)_17%,var(--muted))]'
	];

	const initials = (name: string) =>
		name
			.split(/\s+/)
			.filter(Boolean)
			.map((part) => part[0])
			.join('')
			.slice(0, 2)
			.toUpperCase();

	const listNames = (names: string[]) =>
		names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;

	const shown = $derived(people.slice(0, Math.max(0, max)));
	const hidden = $derived(people.slice(Math.max(0, max)));
	const count = $derived(shown.length + (hidden.length > 0 ? 1 : 0));
	const mid = $derived((count - 1) / 2);

	// Roving tab stop: the whole stack is one stop, and arrows move within it.
	let active = $state(0);
	const buttons: HTMLButtonElement[] = [];
	let hovered = false;
	let focused = false;

	// One spring drives every face, so fanning never re-renders the stack. A
	// touch of bounce, so it springs open rather than slides.
	const step = new SpringValue(0, { preset: springPresets.bouncy, onUpdate: place });

	function place(value: number) {
		if (!ref) return;
		// Right to left, the first face sits on the right.
		const sign = getComputedStyle(ref).direction === 'rtl' ? -1 : 1;
		const slots = ref.querySelectorAll<HTMLElement>(':scope > [data-slot="avatar-stack-item"]');
		slots.forEach((slot, index) => {
			slot.style.transform = `translateX(${(sign * (index - mid) * value).toFixed(2)}px)`;
		});
	}

	function update() {
		step.set(hovered || focused ? openStep : closedStep);
	}

	// Jumps into its resting spread on mount and when the group changes size.
	$effect(() => {
		void count;
		step.jump(hovered || focused ? openStep : closedStep);
	});

	$effect(() => () => step.stop());

	$effect(() => {
		if (active > count - 1) active = Math.max(0, count - 1);
	});

	function onpointerenter(event: PointerEvent) {
		if (event.pointerType === 'touch') return;
		hovered = true;
		update();
	}

	function onpointerleave(event: PointerEvent) {
		if (event.pointerType === 'touch') return;
		hovered = false;
		update();
	}

	function onfocusin(event: FocusEvent) {
		// A mouse click also focuses; only keyboard focus holds the fan open.
		if (!(event.target as HTMLElement).matches(':focus-visible')) return;
		focused = true;
		update();
	}

	function onfocusout(event: FocusEvent) {
		if (ref?.contains(event.relatedTarget as Node | null)) return;
		focused = false;
		update();
	}

	function onkeydown(event: KeyboardEvent) {
		const last = count - 1;
		// Mirrored, the next face is to the left, so the arrows swap.
		const rtl = getComputedStyle(event.currentTarget as HTMLElement).direction === 'rtl';
		const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
		const back = rtl ? 'ArrowRight' : 'ArrowLeft';
		const next =
			event.key === forward
				? Math.min(active + 1, last)
				: event.key === back
					? Math.max(active - 1, 0)
					: event.key === 'Home'
						? 0
						: event.key === 'End'
							? last
							: null;
		if (next === null) return;
		event.preventDefault();
		active = next;
		buttons[next]?.focus();
	}

	const face =
		'group/face focus-visible:ring-ring focus-visible:ring-offset-background ring-[var(--avatar-ring,var(--background))] relative flex size-full touch-manipulation items-center justify-center rounded-full ring-2 outline-none select-none transition-[translate,scale] duration-(--duration-fast) ease-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-105 motion-safe:focus-visible:-translate-y-0.5 motion-safe:focus-visible:scale-105 focus-visible:ring-offset-2 active:scale-[0.96]';
	/**
	 * Names center over their face, except at the ends of the stack, where
	 * they line up with its outer edge so a long name never spills past it.
	 */
	function tagPlacement(index: number) {
		if (count > 1 && index === 0) return 'start-0 origin-bottom-left rtl:origin-bottom-right';
		if (count > 1 && index === count - 1) return 'end-0 origin-bottom-right rtl:origin-bottom-left';
		return 'left-1/2 -translate-x-1/2 origin-bottom';
	}

	// Enters on the house curve, leaves faster: the exit never holds the eye.
	const nameTag =
		'bg-popover text-popover-foreground pointer-events-none invisible absolute bottom-full mb-2 w-max max-w-48 translate-y-0.5 text-center scale-[0.97] rounded-xl px-2.5 py-1 text-xs font-medium text-balance opacity-0 shadow-md transition-[opacity,scale,translate,visibility] duration-(--duration-instant) ease-in group-hover/face:visible group-hover/face:translate-y-0 group-hover/face:scale-100 group-hover/face:opacity-100 group-hover/face:duration-(--duration-fast) group-hover/face:ease-out group-focus-visible/face:visible group-focus-visible/face:translate-y-0 group-focus-visible/face:scale-100 group-focus-visible/face:opacity-100 group-focus-visible/face:duration-(--duration-fast) group-focus-visible/face:ease-out motion-reduce:translate-y-0 motion-reduce:scale-100';
</script>

<!-- Sized for the fanned stack up front, and every face is placed from the
     center, so fanning grows both ways and nothing around it moves. -->
<div
	{...restProps}
	bind:this={ref}
	role="toolbar"
	aria-label={label}
	data-slot="avatar-stack"
	class={cn('relative shrink-0', className)}
	style:width="{(count - 1) * openStep + size}px"
	style:height="{size}px"
	onpointerenter={(event) => {
		onpointerenterProp?.(event);
		onpointerenter(event);
	}}
	onpointerleave={(event) => {
		onpointerleaveProp?.(event);
		onpointerleave(event);
	}}
	onfocusin={(event) => {
		onfocusinProp?.(event);
		onfocusin(event);
	}}
	onfocusout={(event) => {
		onfocusoutProp?.(event);
		onfocusout(event);
	}}
	onkeydown={(event) => {
		onkeydownProp?.(event);
		if (!event.defaultPrevented) onkeydown(event);
	}}
>
	<!-- Keyed by place, not name: two people can share a name. -->
	{#each shown as person, index (index)}
		<!-- Lifts whichever face is in use above its neighbours and their names. -->
		<div
			data-slot="avatar-stack-item"
			class="absolute top-0 left-1/2 h-full focus-within:z-10 hover:z-10"
			style:width="{size}px"
			style:margin-left="{-size / 2}px"
			style:transform="translateX({(index - mid) * closedStep}px)"
		>
			<button
				bind:this={buttons[index]}
				type="button"
				tabindex={index === active ? 0 : -1}
				aria-label={person.name}
				class={face}
				onfocus={() => (active = index)}
				onclick={() => onSelect?.(person)}
			>
				<Avatar.Root class="size-full shadow-none">
					{#if person.src}
						<Avatar.Image src={person.src} alt="" draggable={false} />
					{/if}
					<Avatar.Fallback
						class={cn('text-foreground font-medium', tints[index % tints.length])}
						style="font-size: {Math.round(size * 0.32)}px"
					>
						{initials(person.name)}
					</Avatar.Fallback>
				</Avatar.Root>
				<span aria-hidden="true" class={cn(nameTag, tagPlacement(index))}>{person.name}</span>
			</button>
		</div>
	{/each}
	{#if hidden.length > 0}
		<div
			data-slot="avatar-stack-item"
			class="absolute top-0 left-1/2 h-full focus-within:z-10 hover:z-10"
			style:width="{size}px"
			style:margin-left="{-size / 2}px"
			style:transform="translateX({(shown.length - mid) * closedStep}px)"
		>
			<button
				bind:this={buttons[shown.length]}
				type="button"
				tabindex={shown.length === active ? 0 : -1}
				aria-label="{hidden.length} more: {listNames(hidden.map((person) => person.name))}"
				class={cn(face, 'bg-secondary text-muted-foreground font-medium')}
				style="font-size: {Math.round(size * 0.32)}px"
				onfocus={() => (active = shown.length)}
				onclick={() => onMore?.(hidden)}
			>
				<span aria-hidden="true">+{hidden.length}</span>
				<span aria-hidden="true" class={cn(nameTag, tagPlacement(shown.length))}>
					{listNames(hidden.map((person) => person.name))}
				</span>
			</button>
		</div>
	{/if}
</div>
