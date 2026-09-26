<script lang="ts">
	import { LinkPreview } from '$lib/components/ui/link-preview';
	import Sparkles from '@lucide/svelte/icons/sparkles';

	const rows = [
		[20, 40, 30],
		[32, 56, 0],
		[32, 28, 44],
		[44, 64, 0],
		[32, 36, 0],
		[20, 16, 0]
	];
</script>

{#snippet repoThumb()}
	<svg viewBox="0 0 232 112" class="size-full" aria-hidden="true">
		<rect x="14" y="14" width="204" height="84" rx="10" class="fill-card" />
		<circle cx="28" cy="27" r="2.5" class="fill-muted-foreground/40" />
		<circle cx="36" cy="27" r="2.5" class="fill-muted-foreground/40" />
		<circle cx="44" cy="27" r="2.5" class="fill-muted-foreground/40" />
		{#each rows as [indent, a, b], i (i)}
			<rect x={indent + 4} y={40 + i * 9} width={a} height="4" rx="2" class="fill-foreground/70" />
			{#if b}
				<rect
					x={indent + a + 9}
					y={40 + i * 9}
					width={b}
					height="4"
					rx="2"
					class="fill-muted-foreground/40"
				/>
			{/if}
		{/each}
	</svg>
{/snippet}

{#snippet articleThumb()}
	<svg viewBox="0 0 232 112" class="size-full" aria-hidden="true">
		<rect x="22" y="24" width="92" height="9" rx="2" class="fill-foreground/80" />
		<rect x="22" y="40" width="64" height="9" rx="2" class="fill-foreground/80" />
		<rect x="22" y="64" width="104" height="4" rx="2" class="fill-muted-foreground/40" />
		<rect x="22" y="74" width="96" height="4" rx="2" class="fill-muted-foreground/40" />
		<rect x="22" y="84" width="72" height="4" rx="2" class="fill-muted-foreground/40" />
		<circle cx="176" cy="56" r="30" class="fill-card" />
		<path
			d="M152 66c10-2 16-14 26-14s14 10 22 10"
			fill="none"
			stroke-width="2"
			stroke-linecap="round"
			class="stroke-foreground"
		/>
		<circle cx="178" cy="52" r="3" class="fill-foreground" />
	</svg>
{/snippet}

<div class="bg-card flex w-full max-w-md flex-col gap-3 rounded-2xl p-5 shadow-sm">
	<p class="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
		<Sparkles class="size-3.5" />
		Answer · 2 sources
	</p>
	<p class="text-sm leading-7 text-pretty">
		Yes. Turn on the vector extension and build an HNSW index, which gives up a little recall for
		much faster search than IVFFlat on most workloads, as the
		<LinkPreview
			href="https://github.com/pgvector/pgvector"
			target="_blank"
			rel="noreferrer"
			title="pgvector/pgvector"
			source="github.com"
			description="Open-source vector similarity search for Postgres, with exact and approximate nearest neighbor search."
			image={repoThumb}>pgvector README</LinkPreview
		>
		explains. Match the index to your embedding size, since
		<LinkPreview
			href="https://supabase.com/docs/guides/ai/vector-indexes/hnsw-indexes"
			target="_blank"
			rel="noreferrer"
			title="HNSW indexes"
			source="supabase.com"
			description="How HNSW builds a layered graph for fast approximate search, and when to choose it."
			image={articleThumb}>one index serves one dimension</LinkPreview
		>.
	</p>
</div>
