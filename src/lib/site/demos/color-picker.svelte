<script lang="ts">
	import { ColorPicker } from '$lib/components/ui/color-picker';
	import MessageCircle from '@lucide/svelte/icons/message-circle';

	// Colors a workspace has used before: data, not chrome.
	let value = $state('#5B8DEF');
	let recent = $state(['#5B8DEF', '#E5484D', '#F5A524', '#30A46C', '#8E4EC6']);
</script>

<div class="flex w-full max-w-xs flex-col items-center gap-4">
	<ColorPicker bind:value bind:recent aria-label="Chat widget color" />
	<div class="flex w-full items-center justify-between gap-3 px-1">
		<div class="min-w-0">
			<p class="truncate text-sm font-medium">Chat widget launcher</p>
			<p class="text-muted-foreground font-mono text-xs">{value}</p>
		</div>
		<!-- A preview of the embed; the picker already names the color. -->
		<span
			aria-hidden="true"
			class="grid size-11 shrink-0 place-items-center rounded-full shadow-md"
			style:background-color={value}
			style:color="oklch(from {value} clamp(0.22, (0.65 - l) * 1000, 0.99) 0 0)"
		>
			<MessageCircle class="size-5" />
		</span>
	</div>
</div>
