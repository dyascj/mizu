<script lang="ts">
	import {
		SelectionToolbar,
		SelectionToolbarButton,
		SelectionToolbarSeparator,
		type SelectionToolbarState
	} from '$lib/components/ui/selection-toolbar';
	import { blurIn, duration } from '$lib/components/ui/motion';
	import Bold from '@lucide/svelte/icons/bold';
	import Check from '@lucide/svelte/icons/check';
	import Copy from '@lucide/svelte/icons/copy';
	import Italic from '@lucide/svelte/icons/italic';
	import Lightbulb from '@lucide/svelte/icons/lightbulb';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import WandSparkles from '@lucide/svelte/icons/wand-sparkles';

	let editor = $state<HTMLDivElement | null>(null);
	let copied = $state(false);
	let copyTimer: ReturnType<typeof setTimeout> | undefined;
	let request = $state<{ n: number; action: string; quote: string } | null>(null);

	$effect(() => () => clearTimeout(copyTimer));

	/** Nearest element with this tag that still sits inside the draft. */
	function closestIn(node: Node, tag: string) {
		const element = node.nodeType === 1 ? (node as Element) : node.parentElement;
		const found = element?.closest(tag);
		return found && editor?.contains(found) && found !== editor ? found : null;
	}

	function isOn(range: Range | null, tag: string) {
		if (!range) return false;
		const start = closestIn(range.startContainer, tag);
		return !!start && start === closestIn(range.endContainer, tag);
	}

	function unwrap(element: Element) {
		const parent = element.parentNode;
		if (!parent) return;
		while (element.firstChild) parent.insertBefore(element.firstChild, element);
		parent.removeChild(element);
	}

	/** Wraps the selection in `tag`, or unwraps it when it is already inside one. */
	function toggle(tag: 'strong' | 'em', name: string, toolbar: SelectionToolbarState) {
		const range = toolbar.range;
		if (!editor || !range) return;
		const next = document.createRange();
		const start = closestIn(range.startContainer, tag);
		if (start && start === closestIn(range.endContainer, tag)) {
			const first = start.firstChild;
			const last = start.lastChild;
			unwrap(start);
			if (!first || !last) return;
			next.setStartBefore(first);
			next.setEndAfter(last);
			toolbar.announce(`${name} off`);
		} else {
			const contents = range.extractContents();
			// Merges partial marks of the same kind, so formatting never nests in itself.
			contents.querySelectorAll(tag).forEach(unwrap);
			const element = document.createElement(tag);
			element.append(contents);
			range.insertNode(element);
			next.selectNodeContents(element);
			toolbar.announce(`${name} on`);
		}
		editor.querySelectorAll('strong, em').forEach((element) => {
			if (!element.textContent) element.remove();
		});
		toolbar.select(next);
	}

	async function copy(toolbar: SelectionToolbarState) {
		// Confirms on press; waiting for the write makes the click feel ignored.
		copied = true;
		toolbar.announce('Copied');
		clearTimeout(copyTimer);
		copyTimer = setTimeout(() => (copied = false), duration.ambient);
		try {
			await navigator.clipboard.writeText(toolbar.text);
		} catch {
			copied = false;
			toolbar.announce("Couldn't copy");
		}
	}

	function ask(action: string, toolbar: SelectionToolbarState) {
		const quote = toolbar.text.trim().replace(/\s+/g, ' ');
		request = {
			n: (request?.n ?? 0) + 1,
			action,
			quote: quote.length > 48 ? `${quote.slice(0, 46).trimEnd()}...` : quote
		};
		toolbar.dismiss();
	}
</script>

<div class="flex w-full max-w-md flex-col gap-3">
	<div class="bg-card rounded-2xl p-5 shadow-sm">
		<p class="text-muted-foreground mb-2 text-xs font-medium">Draft reply to Maya</p>
		<SelectionToolbar label="Draft actions">
			{#snippet actions(toolbar)}
				<SelectionToolbarButton onclick={() => ask('Ask about', toolbar)}>
					<Sparkles />
					Ask
				</SelectionToolbarButton>
				<SelectionToolbarButton label="Explain" onclick={() => ask('Explain', toolbar)}>
					<Lightbulb />
					<span class="max-sm:hidden">Explain</span>
				</SelectionToolbarButton>
				<SelectionToolbarButton label="Rewrite" onclick={() => ask('Rewrite', toolbar)}>
					<WandSparkles />
					<span class="max-sm:hidden">Rewrite</span>
				</SelectionToolbarButton>
				<SelectionToolbarSeparator />
				<SelectionToolbarButton
					label="Bold"
					pressed={isOn(toolbar.range, 'strong')}
					onclick={() => toggle('strong', 'Bold', toolbar)}
				>
					<Bold />
				</SelectionToolbarButton>
				<SelectionToolbarButton
					label="Italic"
					pressed={isOn(toolbar.range, 'em')}
					onclick={() => toggle('em', 'Italic', toolbar)}
				>
					<Italic />
				</SelectionToolbarButton>
				<SelectionToolbarSeparator />
				<SelectionToolbarButton label="Copy" onclick={() => copy(toolbar)}>
					<span class="grid">
						<Copy
							class="col-start-1 row-start-1 transition-[scale,opacity,filter] duration-(--duration-spring-snappy) ease-(--ease-spring-snappy) motion-reduce:scale-100 motion-reduce:blur-none {copied
								? 'scale-25 opacity-0 blur-[4px]'
								: ''}"
						/>
						<Check
							class="col-start-1 row-start-1 transition-[scale,opacity,filter] duration-(--duration-spring-snappy) ease-(--ease-spring-snappy) motion-reduce:scale-100 motion-reduce:blur-none {copied
								? ''
								: 'scale-25 opacity-0 blur-[4px]'}"
						/>
					</span>
				</SelectionToolbarButton>
			{/snippet}
			<div
				bind:this={editor}
				role="textbox"
				aria-multiline="true"
				aria-label="Draft reply"
				tabindex="0"
				contenteditable="true"
				spellcheck="false"
				class="focus-visible:ring-ring caret-foreground selection:bg-primary/15 [&_em]:text-foreground [&_strong]:text-foreground text-muted-foreground -m-2 rounded-xl p-2 text-sm leading-relaxed text-pretty outline-none focus-visible:ring-2 [&_p+p]:mt-3 [&_strong]:font-semibold"
			>
				<p>
					Thanks for flagging the latency spike. The retrieval step was re-embedding every document
					on each request, so we now cache embeddings and only refresh the ones that changed.
				</p>
				<p>
					Select any phrase to ask the assistant about it, or to rewrite it before this goes out.
				</p>
			</div>
		</SelectionToolbar>
	</div>
	<!-- Reserved, so the card above never moves when a request appears. -->
	<p class="text-muted-foreground h-5 truncate text-center text-sm" aria-live="polite">
		{#if request}
			{#key request.n}
				<span class="block truncate" in:blurIn={{ duration: duration.base, blur: 4, y: 2 }}>
					{request.action} <span class="text-foreground">"{request.quote}"</span>
				</span>
			{/key}
		{/if}
	</p>
</div>
