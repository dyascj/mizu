# Changelog

All notable changes to Mizu are documented here. The project follows the compatibility policy in `docs/compatibility.md`.

## [0.6.0] - 2026-10-03

Mizu now works in right-to-left languages, and the Sidebar wears the shell from the docs site. Every component follows reading direction, so an app with `<html dir="rtl">` mirrors without overrides. Alongside that I audited every interactive component, demo, block, and docs page by mouse, touch, and keyboard, and fixed what turned up. The versioned registry, `/r/latest`, and compatibility install aliases now provide 0.6.0. Earlier version directories stay exactly as they were.

As with 0.3.0 through 0.5.0, this release ships with representative manual VoiceOver review still outstanding, an exception to ADR 0003. Automated accessibility, keyboard, and reduced-motion checks pass on every page in both themes.

### Added

- Right-to-left support across the library. Spacing and positions use logical utilities, directional icons mirror, and custom arrow-key and pointer handling swaps in RTL wherever the layout mirrors (sliders built by hand, ratings, carousels, kanban, tree, heatmap, audio scrubbing, slide-to-confirm, story progress, page dots, pagination, and more).
- Menus, popovers, selects, the date picker, and scroll areas read the direction they sit in. bits-ui defaults these to left to right and stamps `dir="ltr"` on portaled content; Mizu's wrappers now pass the surrounding direction unless you set `dir`. Dropdown menu and context menu gain thin Root wrappers to do this.
- Code, hex values, email addresses, OTP slots, number tickers, and key caps keep their own reading order inside RTL text.
- The component preview has an LTR/RTL toggle. Overlays portal into the preview frame in RTL and in fullscreen, so they inherit its direction and stay visible.
- `Sidebar.Input` accepts trailing children, such as a `Kbd` hint.

### Changed

- **Sidebar** matches the docs sidebar: the default variant sits on the page background with a panel edge, items are muted with a quiet `bg-secondary` highlight for the current page, `MenuSub` draws a guide line with a tick beside the active item, `GroupLabel` reads as a section header and works as a collapsible trigger, and badges are muted counts. Floating and inset variants keep `bg-sidebar`.
- **Sidebar** rail tooltips open away from the rail and the mobile sheet opens from the reading-start edge in RTL.
- `Marquee` `direction="left"` now means toward the start of the line, so it reverses in RTL.
- The Sidebar block gains a chat search and marks every nav item active when selected.

### Migration

- **Sidebar.Input** (registry item `sidebar`): it is now a search well (`<label>` with an icon around an `<input type="search">`) instead of the `Input` component. `class` styles the well; pass input attributes as before. If you targeted the input itself with `class`, move those styles to the well or use `ref`.
- **Sidebar.MenuSubButton**: without `href` it renders a `<button type="button">` instead of an `<a>`, so it is keyboard reachable. Add `href` to keep a link. `ref` is now `HTMLAnchorElement | HTMLButtonElement`.
- Reinstall `dropdown-menu` and `context-menu` to pick up their new Root files.

### Deprecated

- No APIs deprecated.

### Removed

- No components removed.

### Fixed

- Sheet never slid in or out: it transitioned `transform` while Tailwind v4 moves it with `translate`. Its backdrop now fades too.
- Calendar, range calendar, and date picker arrow keys moved the wrong way in RTL, because bits-ui moves days by key name.
- Audio player kept its playhead animation running after unmount.
- Dialog and Collapsible ignored reduced motion; Theme toggle kept animating its icon under reduced motion.
- Scroll area and Combobox trigger had no visible focus ring.
- Tool call claimed `aria-expanded` with nothing to expand and showed status only by icon; Plan steps showed state only visually.
- Code block fired `onValueChange` when the current tab was clicked; Command dialog let typed text run under its close button.
- Live indicator, number ticker, copy button, and email input reversed digits or letters in RTL.
- Dead or broken demo controls in kbd, file dropzone, tooltip, motion, and presence, plus a toggle group that could be cleared to nothing in the Personalize block and mislabeled pressed states in the Product landing and Voice mode blocks.
- Docs: the command palette selected two "Motion" results at once, copy buttons announced unreliably, the table of contents jumped back to the top after page updates and leaked a frame callback, Back to top ignored reduced motion, error pages had no skip-link target, and the blocks filter dropped keyboard focus.

### Security

- No security changes.

## [0.5.1] - 2026-10-03

I'm cutting this patch to clear eight new dependency advisories and to roll in the Dependabot updates that were stuck behind them. Component source and public APIs are the same as 0.5.0, so there's nothing to reinstall. The versioned registry, `/r/latest`, and compatibility install aliases now point at 0.5.1, and earlier version directories stay exactly as they were.

### Added

- Nothing new in this one.

### Changed

- I moved the dev tooling to Vite 8.3.1, `@sveltejs/vite-plugin-svelte` 7.3.1, typescript-eslint 8.71.0, Prettier 3.9.9, and `@types/node` 26.6.3, and the CodeQL actions to 4.38.2. None of this reaches installed components.

### Deprecated

- No APIs deprecated.

### Removed

- No components removed.

### Fixed

- No component fixes this time.

### Security

- devalue goes to 5.9.4 (through SvelteKit) for GHSA-j22f-vq7h-c4qm, GHSA-mcm9-63f2-9j32, GHSA-x5rw-q4pp-hg5g, GHSA-hx4r-w6wj-j8fg, GHSA-4q55-j62x-fr9h, and GHSA-wf3x-273g-mvxv.
- fast-uri goes to 3.1.8 (through ajv) for GHSA-hrr3-gc8f-f4qj.
- I bumped my brace-expansion override to 5.0.12 for GHSA-q2hr-2g5m-vwhr.
- These packages run the docs site and tooling, not the components you copy in. The dependency audit is clean again.

## [0.5.0] - 2026-09-26

Mizu's biggest release: 78 new components and interaction upgrades to 45 existing ones. Buttons answer with motion, fields and menus move the way native controls do, and a new Data category charts usage, latency, and uptime. Everything follows the 0.4 motion tokens, respects reduced motion, and passes the automated accessibility checks in both themes. The versioned registry, `/r/latest`, and compatibility install aliases now provide 0.5.0. Earlier version directories remain unchanged.

CJ directed this release with representative manual VoiceOver review still outstanding, an exception to ADR 0003 for this release, as with 0.3.0 and 0.4.0. Automated accessibility, keyboard, and reduced-motion checks passed on every page in both themes, and an independent review of the full change raised 89 findings, all resolved before release; neither replaces that review.

### Added

- **Actions (13):** UploadButton, DownloadButton, AsyncButton, SendButton, SlideToConfirm, ShareButton, LikeButton, StarButton, BookmarkButton, FollowButton, Reactions, NotificationBell, and ThemeToggle.
- **Forms (11):** NumberInput, PasswordInput, FloatingLabel, EmailInput, ExpandingSearch, InlineEdit, FileDropzone, ColorSwatches, ColorPicker, WheelPicker, and ShortcutRecorder.
- **Surfaces (9):** SwipeDeck, ExpandingCard, Sortable, Kanban, DragSelect, CompareSlider, CodeBlock, ImageHotspots, and AvatarStack.
- **Data (8), a new category:** Sparkline, BarChart, DonutChart, Heatmap, Stat, Leaderboard, UptimeBar, and RelativeTime. Every chart carries a text or table alternative.
- **AI (5):** Conversation, FeedbackPrompt, CallControls, AudioPlayer, and Greeting.
- **Motion (16):** TextScramble, Typewriter, WaveText, Spoiler, Highlight, CodeMorph, IconMorph, Confetti, TiltCard, SpotlightCard, FlipCard, Lens, StickyStack, Carousel3D, LogoOrbit, and DotGrid.
- **Navigation (5):** Link, PageDots, BackToTop, ReadingProgress, and ScrollSpine.
- **Overlays (4):** ConfirmPopover, SelectionToolbar, LinkPreview, and ShortcutSheet.
- **Feedback (4):** Banner, Checklist, SaveStatus, and LiveIndicator.
- **App (3):** DynamicIsland, PullToRefresh, and StoryProgress.
- **Motion item:** `SpringValue`, a velocity-preserving spring that works in SSR and jsdom tests, `springOptions`, and the `edgeIndicator` attachment shared by Tabs and SegmentedControl.
- **New parts and props on existing components:** `HoldButtonTrash` and `confirmedLabel`; CopyButton `mode="text"`; NumberTicker `odometer`; Tabs.List `variant="underline"` and `overflow="scroll"`; TabBar `labels="active"` and item `fill`; `Pagination.Pages`; `Breadcrumb.Trail`; Kbd `match`; `CheckboxGroup` with Shift-click ranges; `RadioGroup.Card`; Slider `elastic`, `showValue`, `format`, and `thumbLabels`; InputOTP `onVerify` and `status`; Spinner `variant` (`dots`, `bar`, `pixel`) and `done`; `SkeletonSwap`; Stepper `complete`; CircularGauge `variant="ticks"`, `threshold`, and `peak`; Meter `segments`; `Calendar.Slide`; `Command.Match` and `Command.Dialog` `shortcut`; `ContextMenu.Trigger`; menu Item `variant="destructive"`; `Tooltip.Group` and `HoverCard.Group`; toast `undo`, `promise`, and `loading`; Dialog nested step-back; Drawer rubber band and nested dimming; the DataTable body, row, sort button, and bulk bar parts; Timeline `animated`; Carousel `effect="focus"`; Avatar `status` and `frameClass`; VoiceOrb `variant="mist"`, `analyser`, `paused`, and `openMicrophone()`; TextReveal `trigger="scroll"`; TextRotate `effect="morph"`; Marquee `lens`; Dock `running` and `onLaunch`.

### Changed

- **Interactions:** Switch leans, springs, and squashes. Checkbox draws its check. SegmentedControl stretches like an inchworm and recolors labels as its edge crosses them. Tabs, Sidebar, Tree, RadioGroup cards, Command, and Combobox glide their selection. Select opens with the current choice on the trigger. Dropdown and context menus grow from their trigger or pointer. The navigation menu reshapes one panel between items. Accordion unfolds like a flap. Calendars slide months in the direction of travel, and RangeCalendar paints the range on hover. Dock magnifies and bounces. Pagination and NumberTicker roll their digits. Rating previews and pops. TagsInput forms chips around typed words. The magnetic attachment stretches like soft rubber.
- **Toaster migration:** toasts now stack and fan out on hover. Pass `expand` for the previous always-open list. `visibleToasts` (default 3) hides older toasts.
- **Select migration:** Content defaults to item-aligned positioning. `sideOffset`, `avoidCollisions`, and the other floating options apply only with `position="popper"` or when `side` or `align` is set.
- **Magnetic migration:** the attachment reacts from 96 pixels away and listens on the window. Defaults move from strength 0.3 and limit 8 to 0.5 and 16, and it writes inline `translate` and `transform` while moving. New `field`, `stretch`, and `content` options.
- **Markup migrations:** reinstall these items together with the 0.5 Motion item.
  - Tabs: reinstall all four parts together. Content and Trigger read context from Root and List.
  - Switch: the track contains a fill span and the thumb is absolutely positioned, so classes that translate the thumb no longer apply. Root background overrides still work.
  - Checkbox: the check and dash are one inline SVG, and the root no longer clips.
  - Sidebar: the Provider's tooltip delay is 400ms, and SidebarMenu draws its highlight with `::before`.
  - NavigationMenu: `delayDuration` defaults to 80, and Content's `class` applies to the inner measured box.
  - Dock items sit in a `span.mizu-dock-slot`. SegmentedControl labels sit in a `display: contents` span with an inert highlighted copy beside them.
  - CopyButton icons are inline SVG inside a span, so use `[&_svg]` rather than `[&>svg]` selectors.
  - Spinner, VoiceOrb, and Avatar with `status` gain a wrapper element. Timeline items are a single-row grid, so a `flex` or `block` class on an item disables its entrance.
  - Calendar days draw the selection with an inner `[data-day-fill]` span; `data-[selected]:bg-*` overrides keep working. RangeCalendar and DatePicker now depend on the Calendar item.
  - Popover.Content drops its open-state opacity and scale classes so starting styles can fade in.
- Skeleton shimmers by default; `animation="pulse"` restores the previous look. Stepper replaces the active ring with a gliding halo. InputOTP replaces per-slot rings with one gliding ring. Command.Dialog sits near the top of the screen. Marquee's `pauseOnHover` eases to a stop and no longer reacts to touch. CircularGauge sweeps in when first seen while server HTML shows the final value. Timeline animates items added after the first render.
- StarButton celebrates only after its own press. RangeCalendar's Escape clears a half-picked range before it closes a popover. Rating reports the committed score in `aria-valuenow`. VoiceOrb's `volume` defaults to unset, which the cloud treats as silence.
- The site's command palette uses `Command.Dialog` `shortcut`, and the client bundle budget grows to 4.8 MB for the larger catalog. The largest single chunk stays under 100 KB.

### Deprecated

- No APIs deprecated.

### Removed

- No components removed.

### Fixed

- Command never showed its highlighted item, because bits-ui sets an empty `data-selected` attribute. InputOTP's active slot ring had the same problem.
- The dropdown menu's height cap and the navigation menu's hidden panel on item switch.
- Dialog.Root's `open` is bindable, and the dialog scrim fades in.
- StreamingText no longer renders a leading space from template whitespace.
- The generated component API reference no longer garbles props when a JSDoc comment contains an apostrophe, and test fixtures stay out of it.

### Security

- The dependency audit reports no known vulnerabilities.

## [0.4.0] - 2026-09-25

Mizu grows from a chat component library into a design system for AI products, the apps people install, and the websites that launch them. This stable release promotes the 0.4.0-rc.2 components with review fixes, and adds a new brand, site, and documentation. The versioned registry, `/r/latest`, and compatibility install aliases now provide 0.4.0. Earlier version directories remain unchanged.

CJ directed this release with representative manual VoiceOver review still outstanding, an exception to ADR 0003 for this release, as with 0.3.0. Automated accessibility, keyboard, and reduced-motion checks passed on every page in both themes; they do not replace that review.

### Added

- **Motion system.** Six duration tokens, a stagger step, house easing curves, and three springs sampled into CSS `linear()` curves with paired settling durations. Shared `animate-fade-in`, `animate-rise-in`, `animate-blur-in`, `animate-scale-in`, `animate-shimmer`, `animate-breathe`, and `animate-float` animations, plus `stagger` and `text-shimmer` utilities. ADR 0006 records the decision.
- **Motion item.** TypeScript copies of every token, `rise`, `blurIn`, and `pop` transitions, a `reveal` scroll attachment, and `pointerPosition` and `magnetic` attachments.
- **Presence**, an expressive companion for idle, listening, thinking, speaking, happy, and sleeping states, in five tones.
- **Motion components:** TextReveal, TextRotate, NumberTicker, and Marquee.
- **App components:** TabBar, InstallPrompt, and NetworkStatus, plus `pt-safe`, `pb-safe`, `pl-safe`, `pr-safe`, `px-safe`, and `py-safe` utilities.
- **Interaction components:** SegmentedControl, HoldButton, and CopyButton.
- **Blocks:** Mobile assistant and Product landing, in new Mobile and Websites categories.
- **Brand:** the vessel mark, a custom wordmark, an adaptive favicon, app icons, a web manifest, and a `/brand` page with downloads.
- **Docs:** a motion guide, an Apps and PWAs guide, and app and motion guidance in the generated consumer AGENTS.md.

### Changed

- Tailwind's `ease-out`, `ease-in`, and `ease-in-out` resolve to the Mizu curves, and components use duration tokens instead of literal values. Switch, Radio Group, Dock, and Nudge move on springs; Rating uses the bouncy spring.
- Tabs slide a raised indicator between triggers. Thinking and Reasoning share the theme's shimmer utility. ToggleGroup accepts ARIA and other root attributes.
- The site is redesigned around live components: a companion hero, a playground operated by scripted cursors, a showcase of conversation, mobile, and website blocks, and a motion band.
- **Theme migration:** reinstall `app.css` before installing 0.4 components. Components reference the `--duration-*` tokens and `ease-spring*` curves; without them their transitions complete instantly. Edge-to-edge apps also need `viewport-fit=cover` for the safe-area utilities to receive device insets.
- **Tabs migration:** reinstall `tabs-list.svelte` and `tabs-trigger.svelte` together. The list now owns the active fill.

### Deprecated

- No APIs deprecated.

### Removed

- The gradient orb mark and its PNG favicon. No components removed.

### Fixed

- The landing playground no longer writes over or sends a reader's draft, touches the clipboard, or completes a scripted hold after the reader takes over, and it rests after three rounds.
- InstallPrompt catches the install event even when the card mounts later in the visit.
- HoldButton confirms a click from assistive technology and keeps its accessible name while confirmed.
- TextRotate shows the same final word to every reader under reduced motion.
- TabBar and NetworkStatus apply device safe areas only when pinned to the screen edge.
- Reduced motion cancels animation start delays, `scale-in` keeps opacity off the spring, and `pointerPosition` stays inactive for touch.
- The header search no longer covers the navigation between 1024 and 1280 pixels, and the homepage fits a 375 pixel viewport.
- The Apps and PWAs guide's service worker serves prerendered pages offline.
- Sidebar width changes ease between states instead of moving linearly.
- A reduced-motion Marquee is focusable, so keyboard users can scroll it.

### Security

- The dependency audit reports no known vulnerabilities.

## [0.4.0-rc.2] - 2026-09-25

This candidate adds Presence, eleven components for motion, apps, and interaction, and two blocks. It includes everything in 0.4.0-rc.1. The stable registry remains on 0.3.1. Representative VoiceOver review is required before a stable 0.4.0 release.

### Added

- Presence: an expressive companion for idle, listening, thinking, speaking, happy, and sleeping states, with five tones, voice level, pointer-following eyes, and a press squish.
- Motion components: TextReveal, TextRotate, NumberTicker, and Marquee.
- App components: TabBar, InstallPrompt, and NetworkStatus, plus `pt-safe`, `pb-safe`, `px-safe`, `py-safe`, `pl-safe`, and `pr-safe` utilities for edge-to-edge layouts.
- Interaction components: SegmentedControl, HoldButton, and CopyButton.
- Mobile assistant and product landing blocks, in new Mobile and Websites block categories.
- An App catalog category. The component scaffolder reads its categories from the catalog.

### Changed

- Tabs slide a raised indicator between triggers on the snappy spring. The public API and keyboard behavior are unchanged.
- **Tabs migration:** reinstall `tabs-list.svelte` and `tabs-trigger.svelte` together. The list now owns the active fill.
- The document viewport uses `viewport-fit=cover` so safe-area utilities receive device insets.

### Deprecated

- No APIs deprecated.

### Removed

- No components removed.

### Fixed

- No fixes beyond 0.4.0-rc.1.

### Security

- No security changes.

## [0.4.0-rc.1] - 2026-09-25

This candidate introduces the motion system. The stable registry remains on 0.3.1. Representative VoiceOver review is required before a stable 0.4.0 release.

### Added

- Motion tokens in the theme: six durations, a stagger step, house easing curves, and three springs sampled into CSS `linear()` curves with paired settling durations.
- Shared animations `animate-fade-in`, `animate-rise-in`, `animate-blur-in`, `animate-scale-in`, `animate-shimmer`, `animate-breathe`, and `animate-float`, plus the `stagger` and `text-shimmer` utilities.
- The Motion registry item: TypeScript copies of every token, `rise`, `blurIn`, and `pop` transitions, a `reveal` scroll attachment, and `pointerPosition` and `magnetic` pointer attachments.
- A motion guide at `/docs/motion` and ADR 0006.

### Changed

- Tailwind's `ease-out`, `ease-in`, and `ease-in-out` resolve to the Mizu curves. Components use duration tokens instead of literal values.
- Switch, Radio Group, Dock, and Nudge move on springs. Rating stars use the bouncy spring.
- Thinking and Reasoning share the theme's shimmer utility.
- ToggleGroup accepts ARIA and other root attributes, so groups can carry an accessible name.
- **Theme migration:** reinstall `app.css` before installing 0.4 components. Components reference `--duration-*` and `ease-spring*`; without the new theme their transitions complete instantly.

### Deprecated

- No APIs deprecated.

### Removed

- No components removed.

### Fixed

- Sidebar width changes ease between states instead of moving linearly.

### Security

- No security changes.

## [0.3.1] - 2026-09-25

This patch release refreshes the runtime dependencies that installable components declare. Component source and public APIs are unchanged. The versioned registry, `/r/latest`, and compatibility install aliases now provide 0.3.1. Earlier version directories remain unchanged.

### Added

- No additions.

### Changed

- Registry items now declare `bits-ui@^2.19.3`, `@lucide/svelte@^1.48.0`, and `tailwind-merge@^3.7.0`.
- Development tooling moved to Vitest 5, Vite 8.3, Playwright 1.63, ESLint 10.11, and Svelte 5.57.1. These do not affect installed components.

### Deprecated

- No APIs deprecated.

### Removed

- No components removed.

### Fixed

- Upstream fixes from bits-ui 2.19.1 through 2.19.3 reach consumers who install from the 0.3.1 registry.

### Security

- The dependency audit reports no known vulnerabilities.

## [0.3.0] - 2026-09-07

This stable release promotes the audited 0.3.0-rc.2 component source. The versioned registry, `/r/latest`, and compatibility install aliases now provide 0.3.0. Earlier version directories remain unchanged.

CJ authorized this release with representative manual VoiceOver review still outstanding, an exception for this release to ADR 0003. Automated accessibility and keyboard checks passed; they do not replace that manual review.

### Added

- A native Svelte 5 port of Orb UI's cloud renderer, with MIT attribution, audio-level input, reduced-motion support, offscreen suspension, and WebGL failure recovery.
- `ChatInput` props `label`, `onAttach`, and `onVoice`; `StreamingText.paused` resumes the current text without restarting it.
- Contrast checks across containing backgrounds, responsive checks for all 79 components and nine blocks, and tests for open overlays, keyboard behavior, and component edge cases.

### Changed

- Black, white, and neutral gray themes, distinct control fills, and color reserved for AI activity and status. Component, gallery, and block previews use the page background in both themes.
- Revised landing page and documentation with responsive examples, native page scrolling, sentence case, restrained motion, and consistent spacing, typography, and corner radii.
- Updated reviewed runtime and development dependencies and grouped CodeQL actions on a shared revision.
- **Theme migration:** reinstall the theme alongside updated components. Custom themes must define `--control`, `--input`, and matching primary/foreground colors.
- **Button migration:** buttons default to `type="button"`; set `type="submit"` for intentional submitters. Disabled link buttons omit navigation and callbacks. Sizes now set a minimum height so long labels can wrap; override that minimum when requiring a smaller fixed height.
- **ChatInput migration:** attachment and microphone actions render when their respective callbacks are supplied. Existing `leading` and `trailing` snippets still work.
- **Command migration:** `Command.List` creates its viewport internally. Place items and groups directly inside it.
- **Select and Combobox migration:** install matching versions of their root, trigger or input, and content. Label Select triggers through a visible associated label or `aria-label`. `Combobox.Content` creates its viewport internally; place groups and items directly inside it.
- **MessageActions migration:** `onFeedback` receives `'up'`, `'down'`, or `null`. Handle `null` to remove a previously recorded vote.
- **CircularGauge migration:** compact diameters omit center content that cannot fit. The accessible label and value remain available. Use a larger diameter for a visible caption.

### Deprecated

- No APIs deprecated. The legacy blue ramp remains available for existing custom themes.

### Removed

- Decorative uppercase labels, blue focus washes, the masked landing-page component wall, and the custom page scroll container. No components removed.

### Fixed

- Low-contrast text, selected calendar hover states, dark switch thumbs, and composers blending into cards.
- Missing accessible names and list relationships, collapsed tree descendants exposed to assistive technology, and malformed sidebar list markup.
- Narrow-screen overflow in menus, flyouts, dialogs, documentation tables, and composed examples.
- IME submission, invalid rating values, carousel keys inside editable fields, focused toast dismissal, rejected tag drafts, repeated citations, and cleared feedback votes.
- Clipboard failure feedback, timer and observer cleanup, theme storage failures, and nondeterministic sidebar skeletons. Blocks now provide working local interactions.
- Historical registry validation, isolated consumer installation of candidates, and preservation of stable aliases during prereleases.

### Security

- Updated `fast-uri` to 3.1.7 to resolve four high-severity advisories. The dependency audit reports no known vulnerabilities.
- Escaped HTML-significant input in JSON-LD. Sources only links HTTP, HTTPS, and relative web URLs; other schemes render as plain citations.

## [0.3.0-rc.2] - 2026-09-07

This candidate includes the neutral theme, native Svelte cloud orb, revised landing page and docs, and the component spacing, radius, and interaction audit. It includes the fixes recorded under 0.3.0-rc.1. The stable registry remains on 0.2.1. Representative VoiceOver review is required before a stable 0.3.0 release.

### Added

- Browser checks for open menus, date pickers, selection lists, tooltips, dialogs, and drawers, including viewport bounds and Escape dismissal.
- Regression coverage for repeated citations, unsafe citation URLs, retained invalid tags, compact gauges, and clearing a feedback vote.

### Changed

- Phone input text uses 16 pixels. Small metadata uses 12 pixels. Card titles allow wrapped lines, and dialog footers stack their actions on narrow screens.
- Checkboxes and keycaps use smaller corner radii. OTP cells, segmented controls, calendars, and range endpoints have consistent shapes.
- Button sizes set a minimum height and allow long action labels to wrap. For a deliberate smaller fixed height, override the minimum height too, or use the appropriate size variant.
- Selected controls use a stronger neutral fill. Component, gallery, and block previews use the page background in both themes.
- **MessageActions migration:** `onFeedback` now receives `'up'`, `'down'`, or `null`. Handle `null` to remove a previously recorded vote. The earlier callback omitted vote removal.
- **Select and Combobox migration:** keep their `Root`, input or trigger, and content from the same Mizu version. The roots now share list relationships. Give Select triggers a visible associated label or an `aria-label`. `Combobox.Content` provides its own viewport; place groups and items directly inside it.
- **CircularGauge migration:** diameters without enough interior space omit visual center content. The value and label remain available through the meter's accessibility attributes. Use a larger diameter for a visible caption.
- Demo copy describes projects, files, reviews, and settings. Navigation examples link to working documentation routes.

### Deprecated

- No additional APIs deprecated.

### Removed

- No components removed.

### Fixed

- Context menus and navigation flyouts running outside narrow viewports.
- Missing IDs and control relationships in open Select and Combobox lists.
- Collapsed tree descendants remaining exposed to assistive technology.
- Rejected or duplicate tags clearing the user's draft, and repeated labels causing keyed-render errors.
- Selected calendar dates losing text contrast on hover and range endpoints receiving inconsistent corners.
- Oversized menu content and long citation labels escaping their containers.

### Security

- Sources only creates links for HTTP, HTTPS, and relative web URLs. Other URL schemes render as plain citations.

## [0.3.0-rc.1] - 2026-09-07

This candidate is ready for integration testing. The stable and compatibility registry aliases remain on 0.2.1. Representative VoiceOver review is still required before 0.3.0 becomes stable.

### Added

- A Svelte 5 port of Orb UI's cloud renderer, with MIT attribution, audio-level input, reduced-motion handling, offscreen suspension, and a fallback when WebGL is unavailable or its context is lost.
- `ChatInput` exposes `label`, `onAttach`, and `onVoice`. `StreamingText` exposes `paused` and resumes the current text without restarting it.
- A control-fill token, live surface examples in the theming docs, and browser coverage for all 79 components in light and dark on desktop and mobile.
- Tests for semantic contrast, tablet reflow, every block category, disabled links, IME composition, focused toast timers, and WebGL fallback behavior.

### Changed

- The default theme uses black, white, and neutral grays. AI activity and status retain color. Fields use a distinct fill on page, card, muted, and popover backgrounds. Focus, error states, and small empty controls retain semantic boundaries.
- The landing page has five composed examples, responsive layouts, and restrained entrance motion. Documentation uses native page scrolling, clearer typography, wrapping API tables, and async section navigation. UI labels use sentence case.
- Updated the reviewed dependency ranges for Svelte, TypeScript ESLint, Node types, globals, Lucide, internationalized dates, and TanStack Table. CodeQL actions now share one revision and one Dependabot group.
- **Migration for copied source:** reinstall the theme alongside updated components to receive `--control` and the revised primary/foreground pairs. Custom themes should define `--control`, `--input`, and their primary foreground together.
- **Button migration:** buttons now default to `type="button"`. Add `type="submit"` to intentional form submitters. Disabled link buttons have no navigable URL or callback.
- **ChatInput migration:** attachment and microphone buttons render when their callbacks are supplied. Existing `leading` and `trailing` snippets still work.
- **Command migration:** `Command.List` now creates the Bits UI viewport internally. Put items and groups directly inside the list.
- Block previews provide local feedback. Authentication examples validate inputs but do not send credentials or create accounts.

### Deprecated

- No APIs deprecated. The legacy blue ramp remains available for existing custom themes.

### Removed

- Decorative uppercase labels, blue focus washes, the masked landing-page component wall, and the custom page scroll container.

### Fixed

- Low-contrast primary and status text, the dark-mode switch thumb, and composers that blended into their surrounding cards.
- Slider, progress, select, and OTP accessible names; command list relationships; sidebar list semantics; keyboard access to scrollable tables and conversations.
- Mobile pagination, dock, stepper, OTP, and block layouts; oversized dialog scrolling; long API names and documentation pagination.
- IME Enter handling, rating size and invalid-value normalization, carousel keys inside editable fields, and keyboard focus pausing toast dismissal.
- Theme storage failures, clipboard failure feedback and timer cleanup, deterministic sidebar skeletons, and premultiplied alpha at the orb edge.
- Historical registry inventories now validate against their own manifests. Candidate builds preserve the stable aliases and verify the candidate's isolated consumer install.

### Security

- Updated the transitive `fast-uri` dependency to 3.1.7 to resolve four high-severity advisories. The dependency audit reports no known vulnerabilities.
- JSON-LD serialization escapes HTML-significant input before insertion into script elements.

## [0.2.1] - 2026-08-28

### Added

- No new components. v0.2.1 clears the dependency queue that accumulated after v0.2.0.

### Changed

- Updated bits-ui to 2.19.0 and Lucide to 1.34.0, and moved the same ranges into generated registry items.
- Updated the development stack to SvelteKit 2.70.3, Svelte 5.56.10, Vite 8.2.2, Vitest 4.1.11, ESLint 10.9.1, typescript-eslint 8.68.0, and @types/node 26.3.0.

### Deprecated

- Nothing is deprecated in this release.

### Removed

- Nothing is removed in this release.

### Fixed

- The message-actions teardown test flushes the zero-delay timer that Svelte 5.56.10 schedules on the first delegated event, so it only asserts on the component's own copy reset timer. Component behavior is unchanged.

### Security

- No security fixes. `pnpm audit` remains clear at the high level.

## [0.2.0] - 2026-08-15

### Added

- No new components. v0.2.0 modernizes the data table and clears the dependency and security queue.

### Changed

- **Breaking: the `data-table` registry item now targets TanStack Table v9.** The vendored `createSvelteTable` wrapper, `flex-render.svelte`, and `render-helpers.ts` are removed. The item re-exports `FlexRender`, `renderComponent`, `renderSnippet`, and `createTable` (aliased as `createSvelteTable`) from the official `@tanstack/svelte-table` adapter, which itself re-exports all of `@tanstack/table-core`. Migration for consumers reinstalling the copied source:
  - Replace `@tanstack/table-core` with `@tanstack/svelte-table` in `package.json`.
  - Register features and row models through options instead of `get*RowModel` options. Old: `createSvelteTable({ data, columns, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel() })`. New: `const features = tableFeatures({ rowSortingFeature, sortedRowModel: createSortedRowModel(), sortFns }); createSvelteTable({ features, columns, get data() { return data } })`.
  - Type column definitions against the feature set: `ColumnDef<typeof features, Row>[]`.
  - Table state lives in rune-aware atoms; external `$state` plus `onSortingChange` wiring is no longer required. Read slices with `table.atoms.<slice>.get()` when needed.
  - `row.getVisibleCells()` requires registering `columnVisibilityFeature`; use `row.getAllCells()` otherwise.
  - `FlexRender` accepts `{cell}` or `{header}` directly, and still accepts the previous `content`/`context` pair. The old `attach` prop is removed.
- Updated Lucide to 1.28.0, tailwind-variants to 3.3.1, and @internationalized/date to 3.12.3, and moved the same ranges into generated registry items.
- Updated the development stack to SvelteKit 2.70.2, Svelte 5.56.9, Vite 8.2.1, Playwright 1.62, and jsdom 30.

### Deprecated

- Nothing is deprecated in this release.

### Removed

- The vendored data-table adapter files (`data-table.svelte.ts`, `flex-render.svelte`, `render-helpers.ts`), replaced by the official adapter as described above.

### Fixed

- Registry dependency tests read every dependency range from `package.json` instead of freezing the TanStack range inside a fixture.

### Security

- Cleared all `pnpm audit` findings: brace-expansion, postcss, nanoid, fast-uri, and cookie advisories via updated overrides, and the SvelteKit 2.70.2 content-negotiation ReDoS fix.

## [0.1.4] - 2026-07-24

### Added

- No new components this time. v0.1.4 clears the dependency queue before feature work resumes.

### Changed

- Updated the development stack to SvelteKit 2.70.1, Svelte 5.56.7, Vite 8.1.5, and Tailwind CSS 4.3.3.
- Reformatted components, blocks, demos, and documentation with Prettier 3.9. This is a formatting-only migration; component APIs and behavior are unchanged.
- Updated Lucide to 1.26.0 and moved the same compatible range into generated registry items.

### Deprecated

- Nothing is deprecated in this release.

### Removed

- Nothing is removed in this release.

### Fixed

- Registry dependency tests now follow `package.json` instead of freezing the Lucide version inside a fixture.

### Security

- SvelteKit 2.70.1 keeps CSRF protection enabled when a build uses a non-production `NODE_ENV`.

## [0.1.3] - 2026-07-24

### Added

- Source-controlled GitHub repository policy with audited branch protection, merge, cleanup, vulnerability-reporting, and dependency-security settings.

### Changed

- Pull requests now require the full verification, browser, and CodeQL checks before merge.
- CI fetches release provenance history before validating immutable registry metadata.
- Pinned GitHub Actions use maintained Node 24 runtimes.

### Deprecated

- No additional APIs or registry channels are deprecated in this release.

### Removed

- Squash and rebase merge strategies are disabled in favor of documented merge commits.

### Fixed

- Carousel uses consumer-build-compatible parameter syntax while preserving the same scrolling behavior.
- The repository policy enables vulnerability alerts before Dependabot security updates.

### Security

- `main` is protected from routine direct pushes, force pushes, and deletion.
- Private vulnerability reporting, vulnerability alerts, Dependabot security updates, secret scanning, and push protection are enabled.

## [0.1.2] - 2026-07-24

### Added

- Tag-gated release automation with deployment integrity verification, annotated tags, changelog notes, and offline registry assets.
- Security, support, conduct, ownership, issue, pull-request, roadmap, accessibility, and incident-response policies.
- Browser interaction coverage for keyboard navigation and open component states.

### Changed

- Horizontally scrollable component API tables are named keyboard-focusable regions.

### Deprecated

- No additional APIs or registry channels are deprecated in this release.

### Removed

- No public APIs or registry items are removed in this release.

### Fixed

- Tree keeps its roving tab stop on a visible row when the selected item is inside a collapsed branch.

### Security

- Private vulnerability reporting and supported-version expectations are documented.

## [0.1.1] - 2026-07-24

### Added

- Immutable `/r/v0.1.1` registry paths, an explicit `/r/latest` channel, and SHA-256 release manifests.
- Contract, component, accessibility, browser, registry consumer, route, and bundle-budget verification.
- Typed public route metadata and source-backed component API snapshots.

### Changed

- Documentation commands now recommend the pinned v0.1.1 registry.
- Documentation demos, component source, API data, and blocks load in route-sized chunks.
- Stateful components normalize invalid boundaries and clean up timers and observers.

### Deprecated

- Mutable `/r/<item>.json` install URLs. They remain available as a compatibility alias.

### Removed

- Six retired registry artifacts that were no longer present in the component catalog.

### Fixed

- Drawer and Data Table now declare their external dependency ranges.
- Sidebar now installs its required mobile-query hook.
- Registry builds prune stale files and validate every local and external dependency.
- Keyboard, announcement, reduced-motion, theme-token, and timer behavior across custom components.

### Security

- GitHub Actions are pinned to full commit SHAs.
- High and critical dependency advisories fail CI, with narrow dependency overrides for audited transitive fixes.

## [0.1.0] - 2026-07-10

### Added

- Initial Mizu component registry, blocks, documentation site, and agent guidance.
