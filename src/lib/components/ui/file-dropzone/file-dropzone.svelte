<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import FileText from '@lucide/svelte/icons/file-text';
	import ImageIcon from '@lucide/svelte/icons/image';
	import X from '@lucide/svelte/icons/x';
	import { tick, untrack } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { TransitionConfig } from 'svelte/transition';
	import { blurIn, duration, easeIn, prefersReducedMotion } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** The attached files, in the order they arrived. */
		files?: File[];
		/** Called with the files each drop or pick adds. */
		onFilesAdded?: (files: File[]) => void;
		/** Called with files a drop brought that `accept` rules out. */
		onFilesRejected?: (files: File[]) => void;
		/** Called when a file's chip is removed. */
		onFileRemove?: (file: File) => void;
		/**
		 * Types to take, as for a file input: MIME types such as `image/*` or
		 * `application/pdf`, and extensions such as `.csv`. Drops are filtered
		 * the same way.
		 */
		accept?: string;
		/** Takes several files. Without it each new file replaces the last. */
		multiple?: boolean;
		/**
		 * How far each file's upload has got, from 0 to 1, if you upload them.
		 * A chip shows a ring while its file is below 1 and a check once it
		 * reaches 1. Return undefined for files with nothing to show.
		 */
		progress?: (file: File) => number | undefined;
		/** The zone's invitation. */
		label?: string;
		/** Replaces the invitation while a file is right over the zone. */
		releaseLabel?: string;
		/** A quieter second line, such as limits or where files go. */
		hint?: string;
		/** Blocks dropping and picking. */
		disabled?: boolean;
		/** The root element. */
		ref?: HTMLDivElement | null;
		/** Classes for the root. */
		class?: string;
		/** Classes for the zone, such as its height. */
		zoneClass?: string;
	};

	let {
		files = $bindable([]),
		onFilesAdded,
		onFilesRejected,
		onFileRemove,
		accept,
		multiple = true,
		progress,
		label = 'Drop files here or click to browse',
		releaseLabel = 'Release to add',
		hint,
		disabled = false,
		ref = $bindable(null),
		class: className,
		zoneClass,
		...restProps
	}: Props = $props();

	const uid = $props.id();

	/** Somewhere on the page: a hint. Right over the zone: an invitation. */
	let dragging = $state(false);
	let over = $state(false);
	let announcement = $state('');
	let zone = $state<HTMLButtonElement | null>(null);
	let input = $state<HTMLInputElement | null>(null);
	const removeButtons = new WeakMap<File, HTMLButtonElement>();

	// dragenter and dragleave fire for every child crossed, so a flag would
	// flicker. Counting them only reaches zero on a real exit.
	let zoneDepth = 0;

	const ids = new WeakMap<File, number>();
	let nextId = 0;
	const idOf = (file: File) => {
		if (!ids.has(file)) ids.set(file, nextId++);
		return ids.get(file)!;
	};

	const hasFiles = (event: DragEvent) => !!event.dataTransfer?.types.includes('Files');
	/**
	 * Whether something else on the page takes this drag: a drop target that
	 * already handled it (this zone, another dropzone, a third party), or a
	 * native file input, which takes drops without script. The page-wide guard
	 * leaves those alone.
	 */
	const claimed = (event: DragEvent) =>
		event.defaultPrevented ||
		(event.target instanceof Element && !!event.target.closest('input[type="file"]'));

	$effect(() => {
		if (disabled) return;
		let depth = 0;
		const reset = () => {
			depth = 0;
			zoneDepth = 0;
			dragging = false;
			over = false;
		};
		const enter = (event: DragEvent) => {
			if (!hasFiles(event)) return;
			depth += 1;
			if (depth === 1) dragging = true;
		};
		const leave = (event: DragEvent) => {
			if (!hasFiles(event)) return;
			depth = Math.max(0, depth - 1);
			if (depth === 0) reset();
		};
		const dragover = (event: DragEvent) => {
			if (!hasFiles(event) || claimed(event)) return;
			// A file dropped a few pixels off target would otherwise be opened
			// by the browser, navigating away from the page.
			event.preventDefault();
			if (event.dataTransfer) event.dataTransfer.dropEffect = 'none';
		};
		const drop = (event: DragEvent) => {
			if (!hasFiles(event)) return;
			// The drag is over wherever it landed, so the edge always settles.
			reset();
			if (!claimed(event)) event.preventDefault();
		};
		window.addEventListener('dragenter', enter);
		window.addEventListener('dragleave', leave);
		window.addEventListener('dragover', dragover);
		window.addEventListener('drop', drop);
		return () => {
			window.removeEventListener('dragenter', enter);
			window.removeEventListener('dragleave', leave);
			window.removeEventListener('dragover', dragover);
			window.removeEventListener('drop', drop);
			reset();
		};
	});

	function accepts(file: File) {
		if (!accept) return true;
		const name = file.name.toLowerCase();
		const type = file.type.toLowerCase();
		return accept
			.split(',')
			.map((rule) => rule.trim().toLowerCase())
			.filter(Boolean)
			.some((rule) =>
				rule.startsWith('.')
					? name.endsWith(rule)
					: rule.endsWith('/*')
						? type.startsWith(rule.slice(0, -1))
						: type === rule
			);
	}

	function add(list: FileList | File[] | null | undefined) {
		const incoming = Array.from(list ?? []);
		const taken = incoming.filter(accepts);
		const rejected = incoming.filter((file) => !accepts(file));
		const added = multiple ? taken : taken.slice(-1);
		if (rejected.length) onFilesRejected?.(rejected);
		if (added.length) {
			const replaced = multiple ? [] : files.filter((file) => !added.includes(file));
			files = multiple ? [...files, ...added] : added;
			for (const file of replaced) {
				removeButtons.delete(file);
				onFileRemove?.(file);
			}
			onFilesAdded?.(added);
		}
		const parts = [];
		if (added.length)
			parts.push(added.length === 1 ? `Added ${added[0].name}` : `Added ${added.length} files`);
		if (rejected.length) {
			parts.push(
				rejected.length === 1
					? `${rejected[0].name} is not a supported type`
					: `${rejected.length} files are not a supported type`
			);
		}
		if (parts.length) announcement = parts.join('. ');
	}

	async function remove(file: File) {
		const index = files.indexOf(file);
		const neighbour = files[index + 1] ?? files[index - 1];
		files = files.filter((f) => f !== file);
		removeButtons.delete(file);
		announcement = `Removed ${file.name}`;
		onFileRemove?.(file);
		await tick();
		// Focus would otherwise fall to the page with the removed button.
		(neighbour ? removeButtons.get(neighbour) : zone)?.focus();
	}

	function formatSize(bytes: number) {
		if (bytes < 1024) return `${bytes} B`;
		const units = ['KB', 'MB', 'GB'];
		let value = bytes / 1024;
		let unit = 0;
		while (value >= 1024 && unit < units.length - 1) {
			value /= 1024;
			unit++;
		}
		return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
	}

	const canAnimate = (node: Element) => typeof (node as HTMLElement).animate === 'function';
	/** A chip resolves out of a soft blur as it arrives. */
	function arrive(node: Element): TransitionConfig {
		return canAnimate(node) ? blurIn(node, { duration: duration.base, blur: 4, y: 6 }) : {};
	}
	/**
	 * And leaves faster than it came, with a slight shrink. It lifts out of the
	 * row where it stands, so the chips after it can close the gap at once.
	 */
	function leave(node: Element): TransitionConfig {
		const chip = node as HTMLElement;
		const { offsetLeft, offsetTop, offsetWidth } = chip;
		chip.dataset.leaving = '';
		chip.style.position = 'absolute';
		chip.style.left = `${offsetLeft}px`;
		chip.style.top = `${offsetTop}px`;
		chip.style.width = `${offsetWidth}px`;
		if (!canAnimate(node)) return {};
		const reduce = prefersReducedMotion();
		return {
			duration: duration.fast,
			easing: easeIn,
			css: (t) => `opacity: ${t}${reduce ? '' : `; scale: ${0.96 + 0.04 * t}`}`
		};
	}

	// When chips come and go, the rest glide to their new places on a spring
	// rather than jumping.
	let list = $state<HTMLUListElement | null>(null);
	let before = new Map<Element, DOMRect>();
	const chips = () =>
		[...(list?.children ?? [])].filter((chip) => !chip.hasAttribute('data-leaving'));

	$effect.pre(() => {
		void files.length;
		untrack(() => {
			before = new Map(chips().map((chip) => [chip, chip.getBoundingClientRect()]));
		});
	});

	$effect(() => {
		void files.length;
		untrack(() => {
			if (prefersReducedMotion()) return;
			for (const chip of chips() as HTMLElement[]) {
				const from = before.get(chip);
				if (!from) continue;
				const to = chip.getBoundingClientRect();
				if (from.left === to.left && from.top === to.top) continue;
				chip.style.transition = 'none';
				chip.style.translate = `${from.left - to.left}px ${from.top - to.top}px`;
				void chip.offsetWidth;
				chip.style.transition = '';
				chip.style.translate = '';
			}
		});
	});

	const phase = $derived(over ? 'over' : dragging ? 'dragging' : 'idle');
	/** The edge's length in path units: a whole number, so the dashes meet where the path starts. */
	const EDGE = 120;

	const RING = 7;
	const CIRCUMFERENCE = 2 * Math.PI * RING;
</script>

<div
	{...restProps}
	bind:this={ref}
	data-slot="file-dropzone"
	class={cn('flex w-full flex-col gap-3', className)}
>
	<button
		bind:this={zone}
		type="button"
		{disabled}
		aria-describedby={hint ? `${uid}-hint` : undefined}
		data-state={phase}
		onclick={() => input?.click()}
		ondragenter={(event) => {
			if (!hasFiles(event) || disabled) return;
			zoneDepth += 1;
			if (zoneDepth === 1) over = true;
		}}
		ondragleave={(event) => {
			if (!hasFiles(event)) return;
			zoneDepth = Math.max(0, zoneDepth - 1);
			if (zoneDepth === 0) over = false;
		}}
		ondragover={(event) => {
			if (!hasFiles(event) || disabled) return;
			event.preventDefault();
			if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
		}}
		ondrop={(event) => {
			event.preventDefault();
			if (!disabled) add(event.dataTransfer?.files);
		}}
		class={cn(
			'group/zone relative flex min-h-44 w-full touch-manipulation flex-col items-center justify-center gap-3 rounded-2xl px-6 py-8 text-center outline-none select-none',
			'transition-[background-color,scale] duration-(--duration-fast) ease-out active:scale-[0.99] motion-reduce:transition-[background-color]',
			'focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2',
			'disabled:pointer-events-none disabled:opacity-50',
			over ? 'bg-primary-subtle' : dragging ? 'bg-secondary/60' : 'hover:bg-secondary/40',
			zoneClass
		)}
	>
		<!-- The dashed edge is drawn so its dashes can move. At rest and under a
		     pointer they hold still; a file anywhere on the page sets them
		     marching, and a file right over the zone closes every gap into one
		     solid line, sealing around the drop. -->
		<svg
			aria-hidden="true"
			class={cn(
				'pointer-events-none absolute inset-0 size-full overflow-visible transition-[color] duration-(--duration-fast) ease-out',
				over
					? 'text-primary'
					: dragging
						? 'text-muted-foreground'
						: 'text-muted-foreground/50 group-hover/zone:text-muted-foreground/80'
			)}
		>
			<rect
				x="1"
				y="1"
				rx="23"
				style="width: calc(100% - 2px); height: calc(100% - 2px)"
				pathLength={EDGE}
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				data-state={phase}
				class="dropzone-edge"
			/>
		</svg>
		<!-- Lifts toward the pointer when a file is right over it, reaching up to take it. -->
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
			class={cn(
				'text-foreground size-8 transition-[translate] duration-(--duration-spring) ease-(--ease-spring) motion-reduce:transition-none',
				over && '-translate-y-1.5 motion-reduce:translate-y-0'
			)}
		>
			<path d="M12 15V4.5M7.75 8.5 12 4.25l4.25 4.25" />
			<path d="M4.75 14.5v3.25a2 2 0 0 0 2 2h10.5a2 2 0 0 0 2-2V14.5" />
		</svg>
		<span class="flex flex-col gap-1">
			<!-- Both labels share one cell and crossfade, so the zone never reflows. -->
			<span class="text-foreground grid text-base font-medium">
				<span
					class={cn(
						'col-start-1 row-start-1 transition-[opacity,filter] duration-(--duration-fast) ease-out',
						over && 'opacity-0 blur-[4px]'
					)}
				>
					{label}
				</span>
				<span
					aria-hidden="true"
					class={cn(
						'col-start-1 row-start-1 transition-[opacity,filter] duration-(--duration-fast) ease-out',
						!over && 'opacity-0 blur-[4px]'
					)}
				>
					{releaseLabel}
				</span>
			</span>
			{#if hint}
				<span id="{uid}-hint" class="text-muted-foreground text-sm">{hint}</span>
			{/if}
		</span>
	</button>
	<input
		bind:this={input}
		type="file"
		{accept}
		{multiple}
		{disabled}
		hidden
		onchange={(event) => {
			add(event.currentTarget.files);
			// Cleared so picking the same file again still fires a change.
			event.currentTarget.value = '';
		}}
	/>

	{#if files.length}
		<ul bind:this={list} aria-label="Attached files" class="relative flex flex-wrap gap-2">
			{#each files as file (idOf(file))}
				{@const amount = progress?.(file)}
				<li
					class="bg-secondary flex h-9 max-w-full min-w-0 items-center gap-2 rounded-full pr-1 pl-3 text-sm transition-[translate] duration-(--duration-spring) ease-(--ease-spring)"
					in:arrive
					out:leave
				>
					<span
						class="text-muted-foreground grid size-4 shrink-0 place-items-center [&>*]:col-start-1 [&>*]:row-start-1"
					>
						{#if amount !== undefined && amount < 1}
							<svg
								viewBox="0 0 16 16"
								class="size-4 -rotate-90"
								role="progressbar"
								aria-label="Uploading {file.name}"
								aria-valuemin={0}
								aria-valuemax={100}
								aria-valuenow={Math.round(amount * 100)}
							>
								<circle
									cx="8"
									cy="8"
									r={RING}
									fill="none"
									stroke="currentColor"
									stroke-opacity="0.25"
									stroke-width="2"
								/>
								<circle
									cx="8"
									cy="8"
									r={RING}
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-dasharray={CIRCUMFERENCE}
									stroke-dashoffset={CIRCUMFERENCE * (1 - amount)}
									class="text-foreground transition-[stroke-dashoffset] duration-(--duration-slow) ease-out motion-reduce:transition-none"
								/>
							</svg>
						{:else if amount === 1}
							<span class="chip-check grid">
								<Check aria-hidden="true" class="text-foreground size-4" />
							</span>
						{:else if file.type.startsWith('image/')}
							<ImageIcon aria-hidden="true" class="size-4" />
						{:else}
							<FileText aria-hidden="true" class="size-4" />
						{/if}
					</span>
					<span class="text-foreground min-w-0 truncate font-medium">{file.name}</span>
					<span class="text-muted-foreground shrink-0 text-xs tabular-nums">
						{formatSize(file.size)}
					</span>
					<button
						type="button"
						aria-label="Remove {file.name}"
						class="text-muted-foreground hover:bg-control hover:text-foreground focus-visible:ring-ring grid size-7 shrink-0 touch-manipulation place-items-center rounded-full transition-[background-color,color,scale] duration-(--duration-fast) ease-out outline-none focus-visible:ring-2 active:scale-[0.96]"
						{@attach (node) => {
							removeButtons.set(file, node);
							return () => {
								if (removeButtons.get(file) === node) removeButtons.delete(file);
							};
						}}
						onclick={() => remove(file)}
					>
						<X class="size-3.5" />
					</button>
				</li>
			{/each}
		</ul>
	{/if}
	<span class="sr-only" aria-live="polite">{announcement}</span>
</div>

<style>
	/* Each loop moves the dashes exactly one period, so it repeats without a
	   hitch. Closing the gaps is a transition, so a file that leaves mid-seal
	   reverses from wherever it got to. */
	.dropzone-edge {
		stroke-dasharray: 0.5 0.5;
		transition: stroke-dasharray var(--duration-base) var(--ease-out);
	}
	/* Idle UI holds still, so only a file on the page sets the dashes marching. */
	.dropzone-edge[data-state='dragging'] {
		animation: dropzone-march var(--duration-deliberate) linear infinite;
	}
	/* A file right over the zone seals the edge. */
	.dropzone-edge[data-state='over'] {
		stroke-dasharray: 1 0;
	}

	@keyframes dropzone-march {
		to {
			stroke-dashoffset: -1;
		}
	}

	/* The check that replaces a finished upload's ring springs in without
	   overshooting, so its opacity never passes full. */
	.chip-check {
		animation: chip-check var(--duration-spring-snappy) var(--ease-spring-snappy) both;
	}
	@keyframes chip-check {
		from {
			scale: 0.25;
			opacity: 0;
			filter: blur(4px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.dropzone-edge,
		.chip-check {
			animation: none !important;
		}
	}
</style>
