<script lang="ts">
	import * as Accordion from '$lib/components/ui/accordion';
</script>

<!-- Multiple panels open independently, so opening one never shifts the row that
     was just clicked; it can be closed again without moving the pointer. -->
<Accordion.Root type="multiple" class="w-full max-w-md">
	<Accordion.Item value="memory">
		<Accordion.Trigger>Does the assistant remember past chats?</Accordion.Trigger>
		<Accordion.Content>
			Only when memory is on. It keeps short notes about your preferences, and you can review or
			delete each one in settings.
		</Accordion.Content>
	</Accordion.Item>
	<Accordion.Item value="files">
		<Accordion.Trigger>Can it read files I upload?</Accordion.Trigger>
		<Accordion.Content>
			Yes. PDFs, spreadsheets, and images stay attached to the chat they were shared in, and are
			never used to train models.
		</Accordion.Content>
	</Accordion.Item>
	<Accordion.Item value="models">
		<Accordion.Trigger>Which model answers my prompts?</Accordion.Trigger>
		<Accordion.Content>
			The fastest model handles quick replies. Long reasoning, code, and research switch to the
			larger model automatically.
		</Accordion.Content>
	</Accordion.Item>
	<Accordion.Item value="limits">
		<Accordion.Trigger>What happens when I hit my usage limit?</Accordion.Trigger>
		<Accordion.Content>
			Replies continue on the smaller model until your limit resets at midnight in your time zone.
		</Accordion.Content>
	</Accordion.Item>
</Accordion.Root>
