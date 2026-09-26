<script lang="ts">
	import { CodeBlock } from '$lib/components/ui/code-block';

	const files = [
		{
			name: 'agent.ts',
			code: `
import { Assistant } from "@acme/ai";

const assistant = new Assistant({ model: "atlas-3" });

// Streams tokens as they arrive, so the reply starts at once.
export async function summarize(thread: string) {
  const stream = await assistant.respond({
    input: \`Summarize this thread in three bullets:\\n\${thread}\`,
    maxTokens: 400,
    stream: true
  });
  for await (const token of stream) process.stdout.write(token);
}
`
		},
		{
			name: 'run.py',
			code: `
from acme import Assistant

assistant = Assistant(model="atlas-3")

# Tools the agent may call while it works.
run = assistant.run(
    "Book a table for four near the office on Friday",
    tools=["calendar", "places", "reservations"],
    max_steps=8,
)

for step in run.steps:
    print(step.tool, step.status)
`
		},
		{
			name: 'response.json',
			code: `
{
  "id": "run_8f2c41",
  "model": "atlas-3",
  "status": "completed",
  "usage": { "input_tokens": 1842, "output_tokens": 212 },
  "steps": 3,
  "cached": false
}
`
		}
	];
</script>

<CodeBlock {files} label="Quickstart files" class="max-w-xl" />
