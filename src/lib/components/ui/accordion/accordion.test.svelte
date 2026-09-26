<script lang="ts">
	import * as Accordion from './index.js';

	let { defaultOpen = [] }: { defaultOpen?: string[] } = $props();
</script>

<Accordion.Root type="multiple" value={defaultOpen}>
	<Accordion.Item value="memory">
		<Accordion.Trigger>Does the assistant remember past chats?</Accordion.Trigger>
		<Accordion.Content>Only when memory is on.</Accordion.Content>
	</Accordion.Item>
	<Accordion.Item value="files">
		<Accordion.Trigger>Can it read my files?</Accordion.Trigger>
		<Accordion.Content>Only the files you attach.</Accordion.Content>
	</Accordion.Item>
</Accordion.Root>
