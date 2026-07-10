<script lang="ts">
	import * as Accordion from '$lib/components/ui/accordion';
</script>

<Accordion.Root type="single" class="w-full max-w-md">
	<Accordion.Item value="clarity">
		<Accordion.Trigger>What makes the surfaces feel like water?</Accordion.Trigger>
		<Accordion.Content>
			White surfaces, hairline borders, and soft ambient shadows give every panel its clarity.
		</Accordion.Content>
	</Accordion.Item>
	<Accordion.Item value="theming">
		<Accordion.Trigger>Can I tint the palette?</Accordion.Trigger>
		<Accordion.Content>
			Yes. Shift a few tokens and the whole system ripples to match your chosen hue.
		</Accordion.Content>
	</Accordion.Item>
	<Accordion.Item value="motion">
		<Accordion.Trigger>Is the motion adjustable?</Accordion.Trigger>
		<Accordion.Content>
			Every transition eases gently and respects reduced-motion preferences.
		</Accordion.Content>
	</Accordion.Item>
</Accordion.Root>
