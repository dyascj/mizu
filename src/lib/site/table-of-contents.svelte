<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { afterNavigate } from '$app/navigation';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import { cn } from '$lib/utils.js';

	type Item = { id: string; text: string; level: number };

	let items = $state<Item[]>([]);
	let activeId = $state('');
	let observer: IntersectionObserver | null = null;

	function slugify(text: string) {
		return text
			.toLowerCase()
			.trim()
			.replace(/[^\w\s-]/g, '')
			.replace(/\s+/g, '-');
	}

	function build() {
		const root = document.getElementById('doc-content');
		if (!root) {
			items = [];
			return;
		}
		const headings = (Array.from(root.querySelectorAll('h2, h3')) as HTMLElement[]).filter(
			(h) => !h.closest('[data-no-toc]')
		);
		const next: Item[] = [];
		const ids = new SvelteSet<string>();
		for (const h of headings) {
			const base = h.id || slugify(h.textContent ?? '') || 'section';
			let id = base;
			let suffix = 2;
			while (ids.has(id)) id = `${base}-${suffix++}`;
			ids.add(id);
			h.id = id;
			next.push({ id: h.id, text: h.textContent ?? '', level: h.tagName === 'H3' ? 3 : 2 });
		}
		items = next;

		observer?.disconnect();
		observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) activeId = (entry.target as HTMLElement).id;
				}
			},
			{ rootMargin: '-88px 0px -70% 0px', threshold: 0 }
		);
		for (const h of headings) observer.observe(h);
		if (headings.length) activeId = headings[0].id;
	}

	onMount(() => {
		build();
		let frame = 0;
		const mutation = new MutationObserver((records) => {
			if (
				records.every((record) =>
					(record.target instanceof Element ? record.target : record.target.parentElement)?.closest(
						'[data-no-toc]'
					)
				)
			)
				return;
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(build);
		});
		const root = document.getElementById('doc-content');
		if (root) mutation.observe(root, { childList: true, subtree: true });
		return () => {
			observer?.disconnect();
			mutation.disconnect();
			cancelAnimationFrame(frame);
		};
	});

	afterNavigate(() => requestAnimationFrame(build));
</script>

{#if items.length >= 2}
	<nav aria-label="On this page" class="sticky top-28 text-[0.8125rem]">
		<p class="text-foreground mb-3 font-medium">On this page</p>
		<ul class="border-border flex flex-col border-l">
			{#each items as item (item.id)}
				<li>
					<a
						href={`#${item.id}`}
						aria-current={activeId === item.id ? 'location' : undefined}
						class={cn(
							'-ml-px block border-l py-1 pl-3.5 leading-5 [overflow-wrap:anywhere] transition-colors',
							item.level === 3 && 'pl-6',
							activeId === item.id
								? 'border-foreground text-foreground'
								: 'text-muted-foreground hover:text-foreground border-transparent'
						)}
					>
						{item.text}
					</a>
				</li>
			{/each}
		</ul>
		<div class="border-border mt-6 border-t pt-4">
			<button
				type="button"
				onclick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
				class="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
			>
				Back to top <ArrowUp class="size-3.5" aria-hidden="true" />
			</button>
		</div>
	</nav>
{/if}
