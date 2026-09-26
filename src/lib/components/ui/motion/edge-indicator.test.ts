import { afterEach, describe, expect, test, vi } from 'vitest';

import { edgeIndicator } from './edge-indicator.js';
import { springPresets } from './easing.js';
import { SpringValue } from './spring-value.js';

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	document.body.replaceChildren();
});

/** A row of three 50px items, 4px apart, with jsdom given their boxes. */
function row() {
	const container = document.createElement('div');
	const indicator = document.createElement('span');
	container.append(indicator);
	const items = [0, 1, 2].map((i) => {
		const item = document.createElement('button');
		item.dataset.item = '';
		item.dataset.state = i === 0 ? 'on' : 'off';
		Object.defineProperties(item, {
			offsetLeft: { value: i * 54 },
			offsetTop: { value: 0 },
			offsetWidth: { value: 50 },
			offsetHeight: { value: 32 },
			offsetParent: { value: container }
		});
		container.append(item);
		return item;
	});
	document.body.append(container);
	return { container, indicator, items };
}

const select = async (items: HTMLElement[], index: number) => {
	items.forEach((item, i) => (item.dataset.state = i === index ? 'on' : 'off'));
	await Promise.resolve();
};

describe('edgeIndicator', () => {
	test('places the edges on the active item at once, then glides between items', async () => {
		const { container, indicator, items } = row();
		const control = edgeIndicator({ item: '[data-item]', active: '[data-state="on"]' });
		const set = vi.spyOn(SpringValue.prototype, 'set');
		const cleanup = control.attach(indicator);

		expect(container).toHaveAttribute('data-indicator');
		expect(container.style.getPropertyValue('--edge-left')).toBe('0px');
		expect(container.style.getPropertyValue('--edge-right')).toBe('50px');
		expect(items[2].style.getPropertyValue('--edge-x')).toBe('108px');
		expect(set).not.toHaveBeenCalled();

		// A pointer move to the right: the right edge leads on the snappy spring.
		control.cause = 'pointer';
		await select(items, 2);
		expect(set).toHaveBeenCalledWith(108, { preset: springPresets.smooth });
		expect(set).toHaveBeenCalledWith(158, { preset: springPresets.snappy });

		// Keys move both edges together.
		set.mockClear();
		control.cause = 'key';
		await select(items, 1);
		expect(set).toHaveBeenCalledWith(54, { preset: springPresets.snappy });
		expect(set).toHaveBeenCalledWith(104, { preset: springPresets.snappy });

		if (typeof cleanup === 'function') cleanup();
		expect(container).not.toHaveAttribute('data-indicator');
	});

	test('hides the indicator when nothing is active', async () => {
		const { container, indicator, items } = row();
		const control = edgeIndicator({ item: '[data-item]', active: '[data-state="on"]' });
		control.attach(indicator);
		await select(items, -1);
		expect(indicator.hidden).toBe(true);
		expect(container).not.toHaveAttribute('data-indicator');
	});

	test('watches only the container and the items for resizes', () => {
		const observed: Element[] = [];
		vi.stubGlobal(
			'ResizeObserver',
			class {
				observe(target: Element) {
					observed.push(target);
				}
				disconnect() {}
			}
		);
		const { container, indicator, items } = row();
		// A hover pill resizes as the pointer crosses items; that must not snap a glide.
		const pill = document.createElement('span');
		container.prepend(pill);
		edgeIndicator({ item: '[data-item]', active: '[data-state="on"]' }).attach(indicator);
		expect(observed).toEqual([container, ...items]);
	});
});
