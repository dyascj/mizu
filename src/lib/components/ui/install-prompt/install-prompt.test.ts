import { act, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import InstallPrompt from './install-prompt.svelte';

const title = 'Install Mizu Assistant';

function installEvent(outcome: 'accepted' | 'dismissed' = 'accepted') {
	const event = new Event('beforeinstallprompt', { cancelable: true });
	return Object.assign(event, {
		prompt: vi.fn().mockResolvedValue(undefined),
		userChoice: Promise.resolve({ outcome, platform: 'web' })
	});
}

function stubDisplayMode(standalone: boolean) {
	vi.stubGlobal('matchMedia', (query: string) => ({
		matches: standalone && query.includes('standalone'),
		media: query,
		addEventListener() {},
		removeEventListener() {}
	}));
}

async function offerInstall(outcome: 'accepted' | 'dismissed' = 'accepted') {
	const event = installEvent(outcome);
	await act(() => window.dispatchEvent(event));
	return event;
}

// jsdom has no Web Animations; finish every Svelte transition on the next tick.
function stubAnimations() {
	Element.prototype.animate = function () {
		const animation = { onfinish: null as null | (() => void), cancel() {}, currentTime: 0 };
		setTimeout(() => animation.onfinish?.());
		return animation as unknown as Animation;
	};
}

beforeEach(() => {
	stubAnimations();
	stubDisplayMode(false);
	localStorage.clear();
	// The captured install event is shared across cards; start each test without one.
	window.dispatchEvent(new Event('appinstalled'));
});

afterEach(() => {
	delete (Element.prototype as Partial<Element>).animate;
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe('InstallPrompt', () => {
	test('stays hidden until the browser offers installation', async () => {
		render(InstallPrompt, { title });
		expect(screen.queryByRole('region')).toBeNull();

		const event = await offerInstall();
		expect(event.defaultPrevented).toBe(true);
		const card = screen.getByRole('region', { name: title });
		expect(card).toHaveAccessibleDescription('Open it from your home screen, like any other app.');
	});

	test('shows the browser dialog and reports the outcome', async () => {
		const onInstall = vi.fn();
		render(InstallPrompt, { title, onInstall });
		const event = await offerInstall('dismissed');

		await fireEvent.click(screen.getByRole('button', { name: 'Install' }));
		expect(event.prompt).toHaveBeenCalledOnce();
		await waitFor(() => expect(onInstall).toHaveBeenCalledWith('dismissed'));
		await waitFor(() => expect(screen.queryByRole('region')).toBeNull());
	});

	test('renders nothing when the app already runs standalone', async () => {
		stubDisplayMode(true);
		render(InstallPrompt, { title });
		await offerInstall();
		expect(screen.queryByRole('region')).toBeNull();
	});

	test('explains Add to Home Screen on iOS instead of offering a button', async () => {
		vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(
			'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile Safari/604.1'
		);
		render(InstallPrompt, { title });
		const card = await screen.findByRole('region', { name: title });
		expect(card).toHaveTextContent('Tap Share, then Add to Home Screen.');
		expect(screen.queryByRole('button', { name: 'Install' })).toBeNull();
		expect(screen.getByRole('button', { name: 'Not now' })).toBeInTheDocument();
	});

	test('remembers a dismissal under the storage key', async () => {
		const onDismiss = vi.fn();
		const first = render(InstallPrompt, { title, storageKey: 'install', onDismiss });
		await offerInstall();
		await fireEvent.click(screen.getByRole('button', { name: 'Not now' }));
		expect(onDismiss).toHaveBeenCalledOnce();
		expect(localStorage.getItem('install')).not.toBeNull();
		first.unmount();

		render(InstallPrompt, { title, storageKey: 'install' });
		await offerInstall();
		expect(screen.queryByRole('region')).toBeNull();
	});

	test('still works when storage is unavailable', async () => {
		vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
			throw new DOMException('Blocked', 'SecurityError');
		});
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new DOMException('Blocked', 'SecurityError');
		});
		const onDismiss = vi.fn();
		render(InstallPrompt, { title, storageKey: 'install', onDismiss });
		await offerInstall();

		await fireEvent.click(screen.getByRole('button', { name: 'Not now' }));
		expect(onDismiss).toHaveBeenCalledOnce();
		await waitFor(() => expect(screen.queryByRole('region')).toBeNull());
	});

	test('hides once the app is installed from anywhere', async () => {
		render(InstallPrompt, { title });
		await offerInstall();
		await act(() => window.dispatchEvent(new Event('appinstalled')));
		await waitFor(() => expect(screen.queryByRole('region')).toBeNull());
	});

	test('can be forced visible for previews', async () => {
		render(InstallPrompt, { title, forceVisible: true });
		expect(await screen.findByRole('region', { name: title })).toBeInTheDocument();
		await fireEvent.click(screen.getByRole('button', { name: 'Install' }));
		await waitFor(() => expect(screen.queryByRole('region')).toBeNull());
	});

	test('offers an install event that fired before the card mounted', async () => {
		await offerInstall();
		render(InstallPrompt, { title });
		expect(await screen.findByRole('button', { name: 'Install' })).toBeInTheDocument();
	});
});
