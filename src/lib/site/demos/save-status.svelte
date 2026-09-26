<script lang="ts">
	import { SaveStatus, type SaveState } from '$lib/components/ui/save-status';

	let title = $state('Support triage');
	let body = $state(
		'You sort incoming tickets. Tag each with a product area and an urgency, and draft a first reply in the customer’s language.'
	);
	let status = $state<SaveState>('saved');
	let savedAt = $state<number | null>(null);

	let pause: ReturnType<typeof setTimeout> | undefined;
	let request: ReturnType<typeof setTimeout> | undefined;

	// Every edit resets the clock; the save starts once typing pauses, and a
	// new keystroke mid-save goes back to waiting.
	function edited() {
		clearTimeout(pause);
		clearTimeout(request);
		status = 'unsaved';
		pause = setTimeout(() => {
			status = 'saving';
			// Stands in for the request, which never takes the same time twice.
			request = setTimeout(
				() => {
					savedAt = Date.now();
					status = 'saved';
				},
				650 + Math.random() * 350
			);
		}, 800);
	}

	$effect(() => () => {
		clearTimeout(pause);
		clearTimeout(request);
	});
</script>

<div class="bg-card @container w-full max-w-md rounded-2xl p-5 shadow-sm sm:p-6">
	<!-- Side by side when there's room; on a narrow card the status sits above
	     the title so the title keeps its full width. -->
	<div
		class="flex flex-col-reverse items-start gap-1.5 @min-[22rem]:flex-row @min-[22rem]:items-center @min-[22rem]:justify-between @min-[22rem]:gap-4"
	>
		<input
			aria-label="Prompt name"
			bind:value={title}
			oninput={edited}
			placeholder="Untitled prompt"
			class="placeholder:text-muted-foreground focus-visible:ring-ring -mx-2 w-[calc(100%+1rem)] min-w-0 flex-1 rounded-xl bg-transparent px-2 py-0.5 text-lg font-semibold tracking-tight outline-none focus-visible:ring-2"
		/>
		<SaveStatus state={status} {savedAt} />
	</div>
	<p class="text-muted-foreground mt-1 text-xs">System prompt · used by 3 agents</p>
	<textarea
		aria-label="System prompt"
		bind:value={body}
		oninput={edited}
		rows="5"
		placeholder="Describe how the assistant should behave"
		class="placeholder:text-muted-foreground focus-visible:ring-ring -mx-2 mt-2 block w-[calc(100%+1rem)] resize-none rounded-xl bg-transparent px-2 py-1 text-base leading-relaxed outline-none focus-visible:ring-2 sm:text-sm"
	></textarea>
</div>
