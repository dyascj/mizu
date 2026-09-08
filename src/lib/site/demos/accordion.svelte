<script lang="ts">
	import * as Accordion from '$lib/components/ui/accordion';
</script>

<Accordion.Root type="single" class="w-full max-w-md">
	<Accordion.Item value="clarity">
		<Accordion.Trigger>Can I use this in a commercial project?</Accordion.Trigger>
		<Accordion.Content>
			Yes. Mizu is MIT licensed. Keep the license notice with the source you distribute.
		</Accordion.Content>
	</Accordion.Item>
	<Accordion.Item value="theming">
		<Accordion.Trigger>How do I change the theme?</Accordion.Trigger>
		<Accordion.Content>
			Edit the tokens in your Tailwind stylesheet. Primary actions and focus indicators follow your
			primary color.
		</Accordion.Content>
	</Accordion.Item>
	<Accordion.Item value="motion">
		<Accordion.Trigger>Does it support reduced motion?</Accordion.Trigger>
		<Accordion.Content>
			The components respect your device preference. Animated effects pause or resolve to a static
			state.
		</Accordion.Content>
	</Accordion.Item>
</Accordion.Root>
