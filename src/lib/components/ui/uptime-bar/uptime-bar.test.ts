import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import UptimeBar from './uptime-bar.svelte';

// jsdom has no Web Animations API; Svelte transitions finish on the next microtask.
const nativeAnimate = Element.prototype.animate;
function fakeAnimate() {
	return {
		cancel() {},
		set onfinish(done: () => void) {
			queueMicrotask(done);
		}
	} as unknown as Animation;
}

beforeEach(() => {
	Element.prototype.animate = fakeAnimate;
});

afterEach(() => {
	Element.prototype.animate = nativeAnimate;
	vi.unstubAllGlobals();
});

const services = [
	{
		name: 'Chat API',
		incidents: [
			{ daysAgo: 2, level: 'outage' as const, title: 'Model failover', minutes: 72 },
			{ daysAgo: 1, level: 'degraded' as const, title: 'Slow first tokens', minutes: 30 }
		]
	},
	{ name: 'Embeddings', incidents: [] }
];

function setup(props: Record<string, unknown> = {}) {
	const result = render(UptimeBar, { services, days: 10, ...props });
	const live = result.container.querySelector('[aria-live="polite"]') as HTMLElement;
	const [chat, embeddings] = screen.getAllByRole('group');
	return { ...result, live, chat, embeddings };
}

describe('UptimeBar', () => {
	test('summarizes status and uptime for each service', () => {
		const { chat, embeddings } = setup();
		expect(screen.getByText('All systems operational')).toBeInTheDocument();
		// 72 minutes down plus a third of 30 degraded, over 10 days.
		expect(chat).toHaveAccessibleName(
			'Chat API: 99.43% uptime over 10 days. Arrow keys step through days.'
		);
		expect(embeddings).toHaveAccessibleName(/100.00% uptime/);
		expect(chat.children).toHaveLength(10);
	});

	test('reports degradation happening today', () => {
		setup({
			services: [
				{
					name: 'Chat API',
					incidents: [{ daysAgo: 0, level: 'degraded', title: 'Slow', minutes: 5 }]
				}
			]
		});
		expect(screen.getByText('Some systems degraded')).toBeInTheDocument();
	});

	test('focus starts on today and the arrows step back through history', async () => {
		const { chat, live } = setup();
		await fireEvent.focus(chat);
		expect(live).toHaveTextContent('Chat API, Today: no downtime');

		await fireEvent.keyDown(chat, { key: 'ArrowLeft' });
		expect(live).toHaveTextContent('Chat API, Yesterday: Slow first tokens, 30m');
		await fireEvent.keyDown(chat, { key: 'ArrowLeft' });
		expect(live).toHaveTextContent('Chat API, 2 days ago: Model failover, 1h 12m');

		await fireEvent.keyDown(chat, { key: 'Home' });
		expect(live).toHaveTextContent('Chat API, 9 days ago: no downtime');
		await fireEvent.keyDown(chat, { key: 'ArrowLeft' });
		expect(live).toHaveTextContent('9 days ago');
		await fireEvent.keyDown(chat, { key: 'End' });
		expect(live).toHaveTextContent('Today');

		await fireEvent.keyDown(chat, { key: 'Escape' });
		expect(live).toHaveTextContent('');
	});

	test('the caption becomes the story of the day under the pointer', async () => {
		const { chat, container, live } = setup();
		chat.getBoundingClientRect = () => DOMRect.fromRect({ x: 0, y: 0, width: 100, height: 28 });
		// The 8th of 10 bars is two days ago.
		await fireEvent.pointerMove(chat, { clientX: 75 });
		expect(container).toHaveTextContent('Model failover, 1h 12m');
		expect(chat.children[7]).not.toHaveClass('opacity-35');
		expect(chat.children[6]).toHaveClass('opacity-35');

		// Sweeping the pointer is visual only; it never queues announcements.
		expect(live).toHaveTextContent('');

		await fireEvent.pointerLeave(chat);
		await Promise.resolve();
		expect(screen.getAllByText(/% uptime/).length).toBeGreaterThan(0);
	});

	test('colors days by severity', () => {
		const { chat } = setup();
		expect(chat.children[7]).toHaveClass('bg-destructive');
		expect(chat.children[8]).toHaveClass('bg-warning');
		expect(chat.children[9]).toHaveClass('bg-success/40');
	});

	test('in RTL the row mirrors, and the arrows and pointer follow it', async () => {
		const target = document.body.appendChild(document.createElement('div'));
		target.style.direction = 'rtl';
		const { container } = render(UptimeBar, { props: { services, days: 10 }, target });
		const live = container.querySelector('[aria-live="polite"]') as HTMLElement;
		const [chat] = screen.getAllByRole('group');

		await fireEvent.focus(chat);
		await fireEvent.keyDown(chat, { key: 'ArrowRight' });
		expect(live).toHaveTextContent('Chat API, Yesterday: Slow first tokens, 30m');
		await fireEvent.keyDown(chat, { key: 'ArrowLeft' });
		expect(live).toHaveTextContent('Chat API, Today: no downtime');

		// Two days ago is the 8th bar from the right.
		chat.getBoundingClientRect = () => DOMRect.fromRect({ x: 0, y: 0, width: 100, height: 28 });
		await fireEvent.pointerMove(chat, { clientX: 25 });
		expect(chat.children[7]).not.toHaveClass('opacity-35');
		expect(chat.children[6]).toHaveClass('opacity-35');
		target.remove();
	});
});
