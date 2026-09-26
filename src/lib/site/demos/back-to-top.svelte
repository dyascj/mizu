<script lang="ts">
	import { BackToTop } from '$lib/components/ui/back-to-top';

	let scroller = $state<HTMLElement | null>(null);

	const answer = [
		'Short version: move the support bot to retrieval first, then retire the fine-tuned model once the new one matches it on your top fifty tickets.',
		'Your current bot answers from what it memorized during fine-tuning. That worked while the help center changed once a quarter, but you now ship docs every week, and the model is always a release behind.',
		'Retrieval flips that. Each question searches the live help center, pulls the three or four most relevant passages, and the model answers from those. A doc edit is live the moment it is published.',
		'Start by chunking the help center into passages of about three hundred words, split on headings so a chunk never straddles two topics. Keep the article title and URL with every chunk; the bot will cite them.',
		'Embed the chunks once, then re-embed only the articles that change. With your volume that is a few minutes a week, not a nightly rebuild.',
		'For the evaluation set, export last month’s fifty most common tickets with the replies your team actually sent. Run both bots on them side by side and have two agents grade blind.',
		'Expect retrieval to win on anything that changed recently and to lose slightly on tone at first. A short style guide in the system prompt closes most of that gap.',
		'Keep the old model running behind a flag for two weeks. If the new bot’s escalation rate climbs more than a few points, you can switch back in a click while you tune.',
		'Once it holds steady, delete the fine-tuning pipeline. That is one less thing to retrain every quarter, and the bot stops being a release behind.'
	];
</script>

<div class="bg-card relative h-[26rem] w-full max-w-sm overflow-hidden rounded-2xl shadow-md">
	<!-- svelte-ignore a11y_no_noninteractive_tabindex (a scrolling region needs focus to scroll by keyboard) -->
	<div
		bind:this={scroller}
		tabindex="0"
		role="region"
		aria-label="Assistant answer"
		class="focus-visible:ring-ring h-full [scrollbar-width:none] overflow-y-auto overscroll-contain px-6 pt-6 pb-20 outline-none focus-visible:ring-2 focus-visible:ring-inset [&::-webkit-scrollbar]:hidden"
	>
		<p class="text-muted-foreground text-xs">Assistant · 3 min read</p>
		<h3 class="mt-1.5 text-lg leading-tight font-semibold tracking-tight text-balance">
			Moving the support bot to retrieval
		</h3>
		<div class="text-foreground/80 mt-4 flex flex-col gap-3.5 text-sm leading-relaxed text-pretty">
			{#each answer as paragraph (paragraph)}
				<p>{paragraph}</p>
			{/each}
		</div>
	</div>
	<!-- Text slips under the button instead of colliding with it. -->
	<div
		class="from-card pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t to-transparent"
	></div>
	<div class="absolute right-4 bottom-4">
		<BackToTop target={scroller} />
	</div>
</div>
