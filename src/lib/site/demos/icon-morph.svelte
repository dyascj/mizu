<script lang="ts">
	import { IconMorphButton, type MorphShapeName } from '$lib/components/ui/icon-morph';

	const controls: { shape: MorphShapeName; captions: [string, string] }[] = [
		{ shape: 'playPause', captions: ['Listen', 'Pause'] },
		{ shape: 'menuClose', captions: ['Chats', 'Close'] },
		{ shape: 'plusMinus', captions: ['Reasoning', 'Hide'] },
		{ shape: 'sendSent', captions: ['Send', 'Sent'] }
	];
</script>

<div class="grid w-full max-w-sm grid-cols-4 gap-2">
	{#each controls as control (control.shape)}
		<IconMorphButton
			shape={control.shape}
			label={control.captions[0]}
			captions={control.captions}
		/>
	{/each}
</div>
