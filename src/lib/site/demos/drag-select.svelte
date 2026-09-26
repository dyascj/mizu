<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { DragSelect } from '$lib/components/ui/drag-select';
	import FileArchive from '@lucide/svelte/icons/file-archive';
	import FileCode from '@lucide/svelte/icons/file-code';
	import FileSpreadsheet from '@lucide/svelte/icons/file-spreadsheet';
	import FileText from '@lucide/svelte/icons/file-text';
	import Folder from '@lucide/svelte/icons/folder';
	import Image from '@lucide/svelte/icons/image';
	import Mic from '@lucide/svelte/icons/mic';
	import Video from '@lucide/svelte/icons/video';

	const icons = {
		folder: Folder,
		doc: FileText,
		sheet: FileSpreadsheet,
		code: FileCode,
		image: Image,
		audio: Mic,
		video: Video,
		archive: FileArchive
	};

	type File = { id: string; name: string; meta: string; kind: keyof typeof icons };

	const files: File[] = [
		{ id: '1', name: 'Transcripts', meta: '22 items', kind: 'folder' },
		{ id: '2', name: 'Roadmap.md', meta: '8 KB', kind: 'doc' },
		{ id: '3', name: 'Pricing.csv', meta: '36 KB', kind: 'sheet' },
		{ id: '4', name: 'Brief.pdf', meta: '240 KB', kind: 'doc' },
		{ id: '5', name: 'eval.py', meta: '4 KB', kind: 'code' },
		{ id: '6', name: 'Onboarding.mp4', meta: '84 MB', kind: 'video' },
		{ id: '7', name: 'Standup.m4a', meta: '9.6 MB', kind: 'audio' },
		{ id: '8', name: 'Diagram.png', meta: '860 KB', kind: 'image' },
		{ id: '9', name: 'Survey.csv', meta: '120 KB', kind: 'sheet' },
		{ id: '10', name: 'Prompts', meta: '14 items', kind: 'folder' },
		{ id: '11', name: 'Export.zip', meta: '1.2 GB', kind: 'archive' },
		{ id: '12', name: 'Notes.txt', meta: '2 KB', kind: 'doc' }
	];

	let selected = $state<string[]>([]);
	let added = $state(0);
</script>

<div class="flex w-full max-w-lg flex-col gap-3">
	<DragSelect items={files} bind:selected label="Knowledge sources">
		{#snippet children(file)}
			{@const Icon = icons[file.kind]}
			<span class="grid size-12 place-items-center">
				<Icon class="size-7" strokeWidth={1.5} />
			</span>
			<span class="max-w-full truncate px-1 text-sm">{file.name}</span>
			<span class="text-muted-foreground text-xs tabular-nums">{file.meta}</span>
		{/snippet}
		{#snippet actions(ids)}
			<Button
				size="sm"
				disabled={ids.length === 0}
				onclick={() => {
					added = ids.length;
					selected = [];
				}}
			>
				Add to assistant
			</Button>
		{/snippet}
	</DragSelect>
	<p class="text-muted-foreground text-sm" aria-live="polite">
		{added
			? `Research assistant can now read ${added} more sources.`
			: 'Drag across files to pick sources.'}
	</p>
</div>
