<script lang="ts">
	import { CopyButton } from '$lib/components/ui/copy-button';

	const key = 'sk-mizu-live-7f3a9c21e84b4d06b5f2a1c9e3d87b60';
	const snippet = `curl https://api.example.com/v1/responses \\
  -H "Authorization: Bearer $API_KEY" \\
  -d '{"input": "Hello"}'`;
</script>

<div class="flex w-full max-w-md flex-col gap-5">
	<div class="flex flex-col gap-2">
		<p class="text-sm font-medium">Secret key</p>
		<div class="bg-secondary flex items-center gap-2 rounded-full py-1 pr-1 pl-4">
			<code class="min-w-0 flex-1 truncate font-mono text-sm">{key}</code>
			<CopyButton value={key} label="Copy secret key" size="sm" />
		</div>
		<p class="text-muted-foreground text-sm">
			Store this somewhere safe. You won't be able to see it again.
		</p>
	</div>
	<div class="bg-secondary rounded-2xl">
		<div class="flex items-center justify-between py-1.5 pr-1.5 pl-4">
			<span class="text-muted-foreground text-xs font-medium">cURL</span>
			<CopyButton value={snippet} label="Copy request" size="sm" />
		</div>
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<pre
			role="region"
			aria-label="Request example"
			tabindex="0"
			class="focus-visible:ring-ring overflow-x-auto rounded-b-2xl px-4 pb-4 font-mono text-xs leading-relaxed outline-none focus-visible:ring-2"><code
				>{snippet}</code
			></pre>
	</div>
</div>
