<script lang="ts">
	import { ChatBubble } from '$lib/components/ui/chat-bubble';
	import { Spoiler } from '$lib/components/ui/spoiler';
</script>

<div class="flex w-full max-w-md flex-col gap-4">
	<ChatBubble role="user" animate={false}>
		I stopped halfway through The Lantern Keeper. How does it end?
	</ChatBubble>
	<p class="px-1 leading-7 text-pretty">
		In the last act you learn the narrator is <Spoiler>the missing sister</Spoiler>, writing from
		the island the whole time. The final chapter reveals the lighthouse keeper <Spoiler
			>was never real</Spoiler
		>, which quietly recolors everything before it. Tap a hidden line when you are ready.
	</p>
</div>
