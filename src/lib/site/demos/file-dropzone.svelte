<script lang="ts">
	import { FileDropzone } from '$lib/components/ui/file-dropzone';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import { SvelteMap } from 'svelte/reactivity';

	// A demo: files are only read for their name and size, and the upload is a
	// timer. Nothing leaves the browser.
	const brief = new File([new Uint8Array(248_000)], 'Q3 launch brief.pdf', {
		type: 'application/pdf'
	});
	let files = $state<File[]>([brief]);
	let message = $state('');
	const progress = new SvelteMap<File, number>([[brief, 1]]);
	const timers = new SvelteMap<File, ReturnType<typeof setTimeout>>();

	// Progress arrives in uneven surges, the way a real upload hangs on a slow
	// packet now and then.
	function upload(file: File) {
		const ticks = Math.min(16, Math.max(5, file.size / 400_000));
		let done = 0;
		progress.set(file, 0);
		const step = () => {
			const stall = Math.random() < 1 / 6;
			done = Math.min(
				1,
				done + (stall ? 0 : ((0.6 + Math.random() * 0.8) / ticks) * (1.2 - done * 0.5))
			);
			progress.set(file, done);
			if (done < 1) timers.set(file, setTimeout(step, 280));
			else timers.delete(file);
		};
		timers.set(file, setTimeout(step, 150));
	}

	function forget(file: File) {
		clearTimeout(timers.get(file));
		timers.delete(file);
		progress.delete(file);
	}

	$effect(() => () => timers.forEach((timer) => clearTimeout(timer)));
</script>

<div class="bg-card flex w-full max-w-md flex-col gap-4 rounded-2xl p-4 shadow-sm">
	<div class="min-w-0">
		<p class="font-semibold tracking-tight">Ask about your files</p>
		<p class="text-muted-foreground text-sm">
			The assistant reads what you attach before it answers.
		</p>
	</div>
	<FileDropzone
		bind:files
		accept=".pdf,.csv,.md,.txt,image/*"
		hint="PDF, CSV, text, or images"
		progress={(file) => progress.get(file)}
		onFilesAdded={(added) => added.forEach(upload)}
		onFileRemove={forget}
		zoneClass="min-h-36"
	/>
	<form
		class="flex items-center gap-2"
		onsubmit={(event) => {
			event.preventDefault();
			message = '';
		}}
	>
		<Input aria-label="Message" placeholder="Ask about these files" bind:value={message} />
		<Button type="submit" size="icon" aria-label="Send" class="shrink-0">
			<ArrowUp class="size-4" />
		</Button>
	</form>
</div>
