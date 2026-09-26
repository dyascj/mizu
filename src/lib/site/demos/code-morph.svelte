<script lang="ts">
	import { CodeMorph } from '$lib/components/ui/code-morph';

	const steps = [
		{
			label: 'Wait',
			title: 'Ask the model and wait for the whole reply',
			code: `
async function answer(prompt) {
  const reply = await model.generate(prompt);

  render(reply.text);
}`
		},
		{
			label: 'Stream',
			title: 'Stream the reply as it is written',
			code: `
async function answer(prompt) {
  const stream = model.stream(prompt);

  for await (const chunk of stream) {
    render(chunk.text);
  }
}`
		},
		{
			label: 'Stop',
			title: 'Let the reader stop a long answer',
			code: `
async function answer(prompt, signal) {
  const stream = model.stream(prompt, { signal });

  for await (const chunk of stream) {
    if (signal.aborted) break;
    render(chunk.text);
  }
}`
		}
	];
</script>

<CodeMorph {steps} label="Streaming tutorial" />
