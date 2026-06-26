import { getContext, hasContext, setContext } from 'svelte';
import { browser } from '$app/environment';

const MOBILE_QUERY = '(max-width: 767px)';

/**
 * Reactive sidebar state. One instance per `<Sidebar.Provider>`; shared with
 * every part through context. Tracks the desktop expanded/collapsed state, the
 * mobile off-canvas drawer, and whether the viewport is currently mobile.
 */
export class SidebarState {
	/** Desktop: panel expanded (`true`) vs. icon rail (`false`). */
	open = $state(true);
	/** Mobile: off-canvas drawer open. */
	openMobile = $state(false);
	/** Viewport is below the mobile breakpoint. */
	isMobile = $state(false);

	#mql: MediaQueryList | null = null;
	#onChange = (e: MediaQueryListEvent | MediaQueryList) => {
		this.isMobile = e.matches;
	};

	constructor(defaultOpen = true) {
		this.open = defaultOpen;

		if (browser) {
			this.#mql = window.matchMedia(MOBILE_QUERY);
			this.isMobile = this.#mql.matches;
			this.#mql.addEventListener('change', this.#onChange);

			$effect(() => () => this.#mql?.removeEventListener('change', this.#onChange));

			$effect(() => {
				const onKeydown = (e: KeyboardEvent) => {
					if (e.key === 'b' && (e.metaKey || e.ctrlKey)) {
						e.preventDefault();
						this.toggle();
					}
				};
				window.addEventListener('keydown', onKeydown);
				return () => window.removeEventListener('keydown', onKeydown);
			});
		}
	}

	/** The state attribute mirrored onto the rendered sidebar. */
	get state(): 'expanded' | 'collapsed' {
		return this.open ? 'expanded' : 'collapsed';
	}

	setOpen(value: boolean) {
		if (this.isMobile) this.openMobile = value;
		else this.open = value;
	}

	setOpenMobile(value: boolean) {
		this.openMobile = value;
	}

	/** Toggle the drawer on mobile, the rail on desktop. */
	toggle() {
		if (this.isMobile) this.openMobile = !this.openMobile;
		else this.open = !this.open;
	}
}

const SIDEBAR_KEY = Symbol('mizu-sidebar');

export function setSidebar(state: SidebarState): SidebarState {
	setContext(SIDEBAR_KEY, state);
	return state;
}

export function getSidebar(): SidebarState {
	if (!hasContext(SIDEBAR_KEY)) {
		throw new Error('A sidebar part must be used within a <Sidebar.Provider> component.');
	}
	return getContext(SIDEBAR_KEY);
}
