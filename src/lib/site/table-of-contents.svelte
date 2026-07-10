<script lang="ts">
	import { onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';
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
		for (const h of headings) {
			if (!h.id) h.id = slugify(h.textContent ?? '');
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
		return () => observer?.disconnect();
	});

	afterNavigate(() => requestAnimationFrame(build));
</script>

{#if items.length >= 2}
	<nav aria-label="On this page" class="sticky top-24 text-[0.8125rem]">
		<p class="mb-3 px-3 font-semibold text-muted-foreground">On This Page</p>
		<ul class="flex flex-col gap-0.5">
			{#each items as item (item.id)}
				<li>
					<a
						href={`#${item.id}`}
						class={cn(
							'block rounded-md px-3 py-1.5 leading-snug transition-colors',
							item.level === 3 && 'pl-6',
							activeId === item.id
								? 'bg-muted font-medium text-foreground'
								: 'text-muted-foreground hover:text-foreground'
						)}
					>
						{item.text}
					</a>
				</li>
			{/each}
		</ul>
	</nav>
{/if}
