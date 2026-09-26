<script lang="ts">
	import { Link } from '$lib/components/ui/link';

	const sections = ['Chats', 'Agents', 'Prompts', 'Usage'];
</script>

<div class="flex w-full max-w-sm flex-col gap-8">
	<nav aria-label="Workspace" class="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
		{#each sections as section (section)}
			<Link
				href="#{section.toLowerCase()}"
				aria-current={section === 'Agents' ? 'page' : undefined}
				class="py-0.5"
			>
				{section}
			</Link>
		{/each}
	</nav>
	<p class="text-muted-foreground text-sm leading-relaxed">
		The research agent read
		<Link underline="always" href="#planning-doc">the planning doc</Link>, compared it with
		<Link underline="always" href="#last-quarter">last quarter</Link>, and drafted
		<Link underline="always" href="#summary">a short summary</Link> for the team.
	</p>
</div>
