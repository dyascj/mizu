<script lang="ts">
	import { BackToTop } from '$lib/components/ui/back-to-top';
	import { ReadingProgress } from '$lib/components/ui/reading-progress';

	let scroller = $state<HTMLElement | null>(null);

	const sections = [
		{
			paragraphs: [
				'Across 1,200 trial workspaces, the biggest drop is not at sign up or at billing. It is the stretch between creating a workspace and sending the first prompt, where 38% of new users stop and never come back.',
				'The pattern holds across plan sizes and regions, which points at the product rather than the audience. People arrive willing; something in the first two minutes talks them out of it.'
			]
		},
		{
			heading: 'The empty composer',
			paragraphs: [
				'Session recordings show the same moment again and again. The composer opens empty, the cursor blinks, and the user scrolls the sidebar looking for a hint of what the assistant is for.',
				'Workspaces that open with three suggested prompts send a first message 2.4 times as often. The suggestions barely matter; any concrete starting point beats a blank box.'
			]
		},
		{
			heading: 'Too many choices up front',
			paragraphs: [
				'The model picker sits beside the composer on day one. Interviews suggest new users read it as a test they might fail: pick the wrong model and waste the trial.',
				'Hiding the picker until the third conversation, with a sensible default, lifted first prompts by 11% in the March experiment without hurting later upgrades.'
			]
		},
		{
			heading: 'What to try next',
			paragraphs: [
				'Seed every new workspace with suggestions drawn from the team’s own role, keep the picker out of sight until it earns its place, and measure time to first prompt as the headline onboarding number.',
				'Each change is small. Together they target the one moment where most of the trial is lost.'
			]
		}
	];
</script>

<div class="bg-card relative h-[22.5rem] w-full max-w-md overflow-hidden rounded-2xl shadow-md">
	<!-- svelte-ignore a11y_no_noninteractive_tabindex (a scrolling region needs focus to scroll by keyboard) -->
	<div
		bind:this={scroller}
		tabindex="0"
		role="region"
		aria-label="Research brief"
		class="focus-visible:ring-ring h-full overflow-y-auto overscroll-contain outline-none focus-visible:ring-2 focus-visible:ring-inset"
	>
		<!-- Sticky inside the scroller, so it stays pinned while the brief moves under it. -->
		<ReadingProgress target={scroller} class="bg-card sticky top-0 z-10">
			Research brief
		</ReadingProgress>
		<article class="text-muted-foreground px-6 pt-2 pb-16 text-sm leading-relaxed text-pretty">
			<h2 class="text-foreground text-xl font-semibold tracking-tight text-balance">
				Why trial users stall before their first prompt
			</h2>
			{#each sections as section, i (i)}
				<section>
					{#if section.heading}
						<h3 class="text-foreground mt-6 text-base font-medium">{section.heading}</h3>
					{/if}
					{#each section.paragraphs as paragraph (paragraph)}
						<p class="mt-3">{paragraph}</p>
					{/each}
				</section>
			{/each}
		</article>
	</div>
	<div class="absolute right-4 bottom-4">
		<BackToTop target={scroller} showAfter={0.3} />
	</div>
</div>
