# Sky River Machine UI/UX design direction

> A calm instrument for navigating a river of unfinished work.

## 1. Purpose and authority

This document defines how Sky River Machine should look, feel, move, speak, and present the product behavior described elsewhere. It is the source of truth for interface hierarchy, visual language, interaction patterns, responsive behavior, accessibility, and user-facing states.

It does not invent product capabilities, weaken safety rules, expand browser permissions, choose what browsing data is collected, or claim that a documented screen is implemented. Those contracts remain in:

- [README.md](../README.md) for the product promise and intended scope.
- [ARCHITECTURE.md](ARCHITECTURE.md) for runtime behavior and browser capabilities.
- [DATA_MODEL.md](DATA_MODEL.md) for durable records, operations, and recovery.
- [AI_PIPELINE.md](AI_PIPELINE.md) for local inference and confidence behavior.
- [PRIVACY_SECURITY.md](PRIVACY_SECURITY.md) for data and permission boundaries.
- [TESTING_PERFORMANCE.md](TESTING_PERFORMANCE.md) for measured quality and release gates.

Everything in this document is a design target until implementation and representative browser testing prove otherwise.

## 2. The north star: calm wonder

Sky River Machine should feel unusually beautiful for a browser utility, but never unusually difficult.

The creative idea is **calm wonder**: the sensation of looking across a quiet night landscape and suddenly understanding where everything belongs. The interface borrows from a river seen from above, thin cloud, soft northern light, polished navigation instruments, and paper maps without drawing literal scenery around the user's tabs.

The result should be:

- Calm before clever.
- Legible before atmospheric.
- Familiar before novel.
- Useful before decorative.
- Reassuring before impressive.
- Distinctive without becoming theatrical.

An Awwwards-level experience is the ambition, not a claim. It should earn that ambition through immaculate hierarchy, pacing, typography, transitions, responsiveness, and emotional restraint—not through visual noise, scroll tricks, or interactions the user must decode.

### The emotional arc

Every visit should follow the same quiet rhythm:

1. **Arrive:** immediately understand whether anything needs attention.
2. **Orient:** see current workspaces and protected work without scanning a dashboard full of metrics.
3. **Decide:** receive one clear recommendation or choose one clear task.
4. **Act safely:** preview the effect before anything consequential changes.
5. **Leave lighter:** see a simple confirmation and a nearby undo.

The extension is successful when the user closes it with less mental weight than when they opened it.

## 3. Experience principles

### 3.1 One obvious next step

Every screen has one primary action. Secondary actions remain available, but they do not compete for attention through equal color, size, or placement.

Examples:

- Home: `Review suggestions` when suggestions exist; otherwise `Organize tabs`.
- Review: `Apply organization` after the user resolves required choices.
- Search result: `Open` or `Restore`, based on the record state.
- Recovery: `Restore previous state`.

If a screen appears to need three primary buttons, the hierarchy is unresolved.

### 3.2 Recognition over memory

The interface should never make people remember what an icon, status, gesture, or previous model decision meant.

- Pair unfamiliar icons with text.
- Keep lifecycle names visible.
- Explain recommendations beside the recommendation.
- Show the old and proposed state together.
- Keep undo close to the result.
- Use the same words for the same action everywhere.

### 3.3 Progressive disclosure

The product has many capabilities; the interface should not display them all at once.

Use three layers:

1. **Glance:** plain status, one action, meaningful counts.
2. **Review:** tabs, groups, reasons, protections, and editable choices.
3. **Details:** model metadata, browser capability details, diagnostics, and advanced controls.

The first layer should satisfy most visits. Technical detail is available, never dominant.

### 3.4 The AI whispers

AI is not a character, mascot, chat pane, or floating magic button. It appears as calm assistance inside the user's task.

- Say `Suggested` instead of `AI has decided`.
- Say `Why this?` instead of exposing a model chain of thought.
- Use uncertainty language when the evidence is mixed.
- Never use sparkles to imply correctness.
- Never animate AI work as if a perfect answer is inevitable.

### 3.5 Safety should feel visible, not alarming

The interface should make protection and recovery obvious without bathing ordinary work in warning colors.

- Protected tabs receive a quiet shield marker and plain text.
- Consequential actions receive a precise preview.
- Red is reserved for deletion, irreversible loss, or a true blocking error.
- Dormant and Extinct are not styled as failure states.

### 3.6 Beauty must earn its place

Every atmospheric element needs a job:

- A gradient establishes depth and calm.
- A flowing line connects related steps or indicates progress.
- Translucency separates layers without heavy borders.
- Motion confirms continuity between before and after.

If an effect slows comprehension, lowers contrast, obscures focus, or makes a low-powered device struggle, remove it.

## 4. The signature visual idea: Riverline

The product's signature is a single, restrained **Riverline**: a soft curved current that can appear in the Home header, connect review steps, or mark analysis progress.

The Riverline is never a chart and never a navigation puzzle. It is an ambient connective gesture—a reminder that tabs move through states without being lost.

Rules:

- Use one Riverline per surface, not one per card.
- Keep it behind or beside content, never through text.
- Render it with CSS or a small bundled asset; no runtime network asset.
- Mark it decorative for assistive technology.
- Stop its movement when the interface is idle.
- Replace motion with a static contour under `prefers-reduced-motion`.
- Remove it entirely in forced-colors mode or when it harms performance.

The interface should still feel complete if the Riverline is absent. It is a signature, not a dependency.

## 5. Visual character

### 5.1 Overall composition

The composition combines editorial breathing room with the precision of an instrument panel:

- Large, quiet fields of background color.
- A small number of well-proportioned surfaces.
- Strong alignment and generous internal spacing.
- Fine borders instead of stacked drop shadows.
- Rounded geometry that feels natural, not toy-like.
- Occasional asymmetry in headers or empty states, never in critical controls.

The UI should not look like a generic SaaS analytics dashboard. Avoid KPI grids, rainbow charts, oversized numerical cards, or an always-visible control center.

### 5.2 Light theme: Daybreak

Daybreak feels like pale sky reflected on water. It is soft, not washed out.

| Token | Value | Role |
| --- | --- | --- |
| `--canvas` | `#F3F7F7` | Main background |
| `--canvas-deep` | `#E7F0F1` | Quiet depth and selected regions |
| `--surface` | `#FFFFFF` | Primary cards, sheets, dialogs |
| `--surface-raised` | `#F9FCFC` | Hover and raised layers |
| `--ink` | `#10272F` | Primary text |
| `--ink-muted` | `#53676E` | Secondary text |
| `--border` | `#D4E0E2` | Dividers and outlines |
| `--river` | `#176B7F` | Primary action and focus |
| `--river-strong` | `#0D5264` | Pressed states and high-emphasis text |
| `--sky` | `#78BCCA` | Ambient accent only |
| `--dawn` | `#E8A66A` | Warm highlight and attention |
| `--danger` | `#B4232C` | Destructive action and critical error |

### 5.3 Dark theme: Night Current

Night Current is deep blue-black rather than flat black. Surfaces should remain distinct at low brightness.

| Token | Value | Role |
| --- | --- | --- |
| `--canvas` | `#07161B` | Main background |
| `--canvas-deep` | `#0B2027` | Quiet depth and selected regions |
| `--surface` | `#10272E` | Primary cards, sheets, dialogs |
| `--surface-raised` | `#17343C` | Hover and raised layers |
| `--ink` | `#EDF7F7` | Primary text |
| `--ink-muted` | `#ADC0C4` | Secondary text |
| `--border` | `#2C474E` | Dividers and outlines |
| `--river` | `#70CBD6` | Primary action and focus |
| `--river-strong` | `#A1E6EC` | High-emphasis accent text |
| `--sky` | `#3D8292` | Ambient accent only |
| `--dawn` | `#F2B778` | Warm highlight and attention |
| `--danger` | `#FF8C94` | Destructive action and critical error |

These are target tokens, not proof of contrast compliance. Every foreground/background pairing must be measured in implementation, including hover, disabled, selected, forced-color, and high-contrast states.

### 5.4 Ambient gradients

Gradients are environmental, never used behind dense text or as button decoration.

- Daybreak: a subtle blend from pale cyan at the upper edge into neutral canvas.
- Night Current: a localized teal-blue glow behind the top-level heading, fading before the first action.
- Warm dawn appears only around successful restoration, a protected item, or a small moment of completion.
- No animated rainbow gradients, neon glows, aurora wallpaper, or constantly moving backgrounds.

### 5.5 Lifecycle appearance

Lifecycle state must use text, icon, and shape—not color alone.

| State | Shape and icon direction | Color character | Plain-language support |
| --- | --- | --- | --- |
| Active | Filled circle or sun-disc | Clear river teal | `Open and ready` where explanation is needed |
| Dormant | Half-filled circle or resting crescent | Soft violet-blue | `Saved, using less memory` |
| Extinct | Ring or horizon mark | Neutral slate | `Archived and restorable` |

Never depict Extinct with a skull, grave, broken link, trash can, or dead plant. The state describes browser presence, not worth or deletion.

### 5.6 Typography

Typography must feel humane and immediately readable.

- **Interface face:** Atkinson Hyperlegible Next, bundled locally as a small subset when licensing and package review are complete.
- **Fallback:** `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.
- **Editorial accent:** a restrained serif may appear only in the wordmark or a rare empty-state sentence after a locally bundled candidate is approved. It must never appear in controls, tables, tab titles, warnings, or settings.
- No font is fetched at runtime.

Type scale:

| Role | Size / line height | Weight | Use |
| --- | --- | --- | --- |
| Display | `32 / 38` | 600 | Full-page welcome or recovery only |
| Page title | `24 / 30` | 600 | One per view |
| Section title | `18 / 24` | 600 | Major groups |
| Body | `15 / 22` | 400 | Default copy and rows |
| Label | `13 / 18` | 600 | Controls and compact metadata |
| Caption | `12 / 17` | 500 | Supporting metadata only |

Do not place essential information below 12 CSS pixels. Respect browser zoom and user font preferences without clipping or horizontal scrolling at 200% zoom.

### 5.7 Spacing and density

Use a 4-pixel base rhythm with these preferred steps:

`4, 8, 12, 16, 20, 24, 32, 40, 48, 64`

- Default control height: 40 pixels.
- Minimum pointer target: 44 by 44 pixels, even when the visible icon is smaller.
- Compact tab row: at least 48 pixels tall.
- Standard card padding: 16 or 20 pixels.
- Major section separation: 32 pixels in the side panel, 48 pixels on the full page.
- Dense mode may reduce whitespace, not target size, text size, or focus visibility.

### 5.8 Shape, border, and elevation

- Small controls: 8-pixel radius.
- Cards and search fields: 12-pixel radius.
- Sheets and large dialogs: 16-pixel radius.
- Pills are reserved for states, filters, and tiny metadata—not every button.
- Default border: 1 pixel.
- Use at most three elevation levels.
- Prefer a border plus background change to a large shadow.
- Never stack cards inside cards more than one level deep.

### 5.9 Iconography and imagery

- Use one consistent, rounded-outline icon set with a 1.75 to 2 pixel stroke.
- Pair icons with text until the action is universally recognizable.
- Use familiar icons for Search, Settings, Close, Back, More, and Undo.
- Use custom lifecycle symbols only with visible labels.
- Do not use emoji as product icons.
- Avoid stock photography and character mascots. The user's work is the subject.
- Any illustration should be abstract, sparse, locally bundled, and removable without losing meaning.

## 6. Information architecture without overload

The primary interface should expose three destinations:

1. **Home** — what needs attention now, current workspace, recent activity, and the next useful action.
2. **Workspaces** — the user's organized tab records and lifecycle states.
3. **Search** — direct retrieval across permitted Active, Dormant, and Extinct records.

Review is a task, not a permanent destination. It opens from a suggestion on Home and returns the user when resolved. Settings live behind a conventional gear button. Recovery, privacy, browser capabilities, and diagnostics are contextual routes or Settings sections, not additional top-level navigation.

### Navigation behavior

- In a side panel, use a compact bottom navigation bar with labeled icons for Home, Workspaces, and Search.
- On a wide extension page, use a slim left rail with the same three labels. Keep Settings at the bottom.
- Preserve the user's location when the panel closes and reopens, unless a blocking recovery issue requires attention.
- Never use hidden edge gestures, hover-only navigation, or unlabeled mystery icons.

## 7. Surface strategy

### 7.1 Side panel or sidebar

This is the everyday surface. It should support quick review, search, workspace switching, protection, and lightweight organization without covering the page the user is working on.

Design for a useful range of approximately 320 to 520 CSS pixels, while adapting to the actual browser surface. Do not assume the browser exposes an identical width or sidebar API.

### 7.2 Full extension page

Use the full-page surface for long review sessions, large archives, settings, privacy inspection, recovery, and workflows that would become cramped in a side panel.

The full-page version is the same product at a larger scale, not a separate dashboard. It expands context and comparison space rather than adding more simultaneous features.

### 7.3 Browser-action entry

If a browser-action popup is implemented, keep it an entry and status surface only: current workspace, one useful status sentence, and one primary action that opens the main supported surface. Do not compress the full product into a tiny popup.

## 8. The Home experience

Home should answer three questions in order:

1. Is my work safe?
2. Is there anything worth reviewing?
3. What can I do next?

### 8.1 Quiet status header

The opening area contains:

- A time-aware but non-chatty greeting when appropriate.
- One sentence describing the current state, such as `Your work is organized. 3 suggestions are waiting.`
- A restrained Riverline in the background.
- One primary action.

Do not open with total lifetime counts, a pie chart, model branding, memory claims, or a promotional slogan.

### 8.2 Current workspace

Show one current or recently active workspace prominently:

- Workspace name.
- A short plain-language description when available.
- Active, Dormant, and Extinct counts with text labels.
- Up to three recent or protected tabs.
- `Open workspace` as the secondary action.

If there is no clear current workspace, say so neutrally and offer `Choose a workspace`.

### 8.3 Attention queue

The attention queue contains only items that benefit from a decision now:

- Organization suggestions.
- Low-confidence placements.
- Duplicate candidates.
- Permission requests initiated by a feature the user chose.
- Partial failure or recovery work.

Order by consequence and freshness, not by what creates the most engagement. Cap the visible list and provide `See all` rather than building an infinite inbox.

### 8.4 Calm state

When nothing needs attention, use the space. A calm state can say:

> Everything important has a place. Keep browsing.

Provide one modest action such as `Search your tabs`. Do not manufacture tips, streaks, badges, or chores to fill an empty screen.

## 9. Workspaces

### 9.1 Workspace cards

Each workspace card should feel like a small place, not a metric tile.

Show:

- Name and optional one-line description.
- Total record count.
- Active, Dormant, and Extinct distribution in text.
- Up to three recognizable favicons or initials with safe fallbacks.
- Last meaningful activity in human language.
- Protection marker if the workspace contains protected work.

Avoid cover art, generated imagery, decorative category colors, and dense mini-graphs. A narrow accessible accent line is enough to distinguish workspaces.

### 9.2 Workspace detail

The default view should begin with what is usable now:

- Search within workspace.
- State filter.
- Sort with a sensible current default.
- Tab list.
- One quiet action menu for workspace-level operations.

Advanced model details, operation history, and storage metadata belong behind `Details`.

### 9.3 Tab rows

A tab row contains, in reading order:

1. Selection control when in selection mode.
2. Favicon or safe generic page icon.
3. Title, wrapping to two lines when needed.
4. Domain or sanitized location.
5. Lifecycle label.
6. Protection marker when present.
7. One context action appropriate to the state: `Open`, `Wake`, or `Restore`.
8. More menu for secondary actions.

Selection mode is entered explicitly. Checkboxes should not permanently occupy every row when the user is simply browsing.

### 9.4 Large collections

- Keep filters and search available without making them sticky over too much content.
- Virtualize or paginate long lists while preserving focus and screen-reader position.
- Announce when more results load.
- Never display `1–50 of 10,000` as a challenge or achievement.
- Preserve selection safely across windowed rendering.

## 10. Analyze and organize flow

### 10.1 Entry

The primary action uses the plain label `Organize tabs`. Supporting copy can explain that the extension will make suggestions and will not move anything yet.

### 10.2 Scope

Present the smallest useful choice set for the capabilities currently available. Use clear radio options and show the number of tabs affected. Put permission implications immediately below the relevant choice.

Avoid turning scope selection into a configuration form. Advanced scope belongs behind `More options`.

### 10.3 Reading context

Before analysis begins, state:

- What information will be read.
- Whether any page context is included.
- That processing is local.
- What will be retained under the current setting.
- That no tabs will move until the user approves the proposal.

This explanation should fit in a small disclosure panel, with a link to full privacy details.

### 10.4 Analysis in progress

Use an indeterminate but informative flow:

- `Looking for related work…`
- `Naming possible workspaces…`
- `Checking uncertain tabs…`

Show completed stages only when the implementation can report them truthfully. Provide `Stop analysis`. Do not show a fake percentage or countdown.

Animation should be soft and bounded: the Riverline may travel once through the stage markers, then settle. The user can leave the surface while work safely continues only if runtime behavior genuinely supports it.

### 10.5 Proposal review

Start with a plain summary:

`5 workspaces suggested for 38 tabs. 3 tabs need your choice.`

Show proposed workspaces as editable groups. Each group includes:

- Editable name.
- Tab count.
- A short reason.
- Tabs that can be expanded on demand.
- Visible uncertainty where relevant.
- Move, split, merge, and leave-unchanged controls.

Do not display a confidence percentage as a badge beside every tab. Use three user-centered levels:

- **Clear match** — no interruption required.
- **Possible match** — show an alternative when opened.
- **Needs your choice** — block only the affected decision, not the whole review.

### 10.6 Before applying

The final action bar remains visible and states exactly what will happen, for example:

`Create 4 workspaces and move 31 tabs. 7 tabs stay where they are.`

If a planned action includes Dormant or Extinct transitions, separate those consequences clearly from visual grouping. Never let `Apply organization` silently imply tab closure.

### 10.7 Applied state

Confirm the actual result, including partial results:

- `31 tabs organized.`
- `2 tabs stayed in place because they changed during review.`
- `Undo` remains adjacent and available for the supported recovery window.

Use a brief, warm completion transition; do not launch confetti.

## 11. Search and restoration

Search should feel like remembering, not querying a database.

### 11.1 Search field

- Use a full-width field with the visible label `Search your tabs`.
- Example hint: `Try “the browser permissions page”`.
- Support exact text and natural language through the same field.
- Keep recent queries local and make clearing them obvious if retained.
- `Escape` clears a suggestion layer first, then the query.

### 11.2 Results

Each result shows:

- Title.
- Workspace.
- Lifecycle state in text.
- Sanitized location.
- Last seen time when useful.
- One short explanation such as `Matched your summary and workspace name`.
- A state-appropriate action: `Open`, `Wake`, or `Restore`.

Do not visually demote Extinct results so strongly that users assume they are unavailable.

### 11.3 Restoration

Restoration should feel immediate and safe:

- A normal restoration can happen from the result row.
- A restoration with known limitations explains them before the action.
- After restoration, confirm where the tab opened.
- If restoration fails, preserve the record and offer retry or copy-link actions when safe.

## 12. Protection and lifecycle controls

### 12.1 Protection

Protection is a first-class reassurance feature, not a hidden advanced setting.

Use a shield icon plus a plain label such as:

- `Important`
- `Never sleep`
- `Keep until completed`

The protection menu explains the effect in one sentence. It never implies that the product can detect every unsaved form, active download, payment, or private state.

### 12.2 Lifecycle changes

Use verbs that describe the result:

- Active to Dormant: `Let tab rest`.
- Dormant to Active: `Wake tab`.
- Dormant to Extinct: `Archive tab`.
- Extinct to Active: `Restore tab`.
- Permanent record removal: `Delete record`.

The exact verb must be consistent across buttons, menus, dialogs, notifications, and documentation. Never use `Clean`, `Kill`, or `Remove clutter` for a lifecycle transition.

### 12.3 Confirmation level

- Opening, waking, and restoring usually do not need a dialog.
- Dormant transitions can use inline preview when recovery is clear.
- Archiving/closing requires a consequence preview and confirmed recovery information.
- Permanent deletion requires explicit confirmation that distinguishes it from Extinct.
- Batch actions always state the count and protected exclusions.

## 13. Settings without a control-panel headache

Settings should use plain categories and short summaries:

1. **Organization** — suggestion and correction preferences.
2. **Tab care** — protections, lifecycle preferences, and authorized automation.
3. **Privacy** — context levels, retention, stored data, export, and deletion.
4. **Local intelligence** — current local model mode and availability.
5. **Browser support** — current capabilities and limitations.
6. **Appearance and accessibility** — theme, contrast, motion, density, and text preferences.
7. **Advanced** — diagnostics and technical details.

Rules:

- Use one setting per row.
- State the current effect beneath the label.
- Avoid double negatives.
- Changes with privacy, permission, automation, or deletion impact receive an inline explanation before they are saved.
- Do not hide core safety controls inside Advanced.
- Search settings only if testing shows the list warrants it.

## 14. Automation presentation

Automation is opt-in and must feel like a written agreement, not an exciting shortcut.

The UI must separate:

- What may happen.
- Which tabs are excluded.
- When approval is required.
- How the action is recorded.
- How it can be undone or recovered.

Use a sentence preview such as:

`Sky River Machine may let unprotected tabs rest after your rules match. It will ask before archiving a tab.`

Never collapse several permissions into one `Smart mode` switch. Never preselect a broader automation level. Never use dark patterns to encourage it.

## 15. AI explanations and uncertainty

### 15.1 Explanation pattern

Explain suggestions in two layers:

- Summary: `These tabs appear to belong to your extension project.`
- `Why this?`: `They were used together recently and include the same project name across documentation, code, and design pages.`

Do not expose hidden reasoning, raw prompts, unbounded page text, or model jargon in the default explanation.

### 15.2 Confidence

Confidence should change the interaction, not decorate it.

- High confidence reduces interruption but never bypasses safety.
- Medium confidence keeps alternatives accessible.
- Low confidence asks the user and uses neutral group names.
- No confidence or malformed output falls back safely without pretending an AI result exists.

### 15.3 Corrections

When the user corrects a suggestion, acknowledge the immediate effect:

`Moved to OrbitLab Research.`

If the correction will influence future ranking under current behavior, say so plainly and provide a way to inspect or remove the learned preference. Do not say `I'll remember` unless the data contract guarantees it.

## 16. Privacy and permission UX

Privacy should be present at the moment of relevance, not relegated to a policy page.

### 16.1 Context ladder

Present context access as a simple ladder:

- **Tab details** — title, URL, domain, and browser signals.
- **Visible page context** — bounded headings, description, and selected visible text after permission.
- **Stored summary** — a local summary retained for search and recovery.

For each level, state what is read, why it helps, whether it is stored, and how to delete it. Never label broader access as `Recommended` merely to increase acceptance.

### 16.2 Permission request

Every browser permission prompt must be preceded by a product explanation:

- What feature the user just chose.
- What access the browser will request.
- What happens if the user says no.
- Whether the choice can be changed later.

Permission denial returns the user to a usable reduced-capability state. Do not trap them in a repeated request loop.

### 16.3 Local-only reassurance

Use `Processed on this device` when that statement is true for the exact flow. Do not imply encryption at rest, complete anonymity, or zero risk simply because processing is local.

## 17. Recovery, errors, and imperfect reality

### 17.1 Recovery first

When recovery work exists, show it above normal suggestions. The tone is steady:

`Your last organization stopped before it finished. Your tabs are still recorded.`

Offer the safest next action first and expose details second.

### 17.2 Partial failure

Never reduce partial failure to a generic red toast. Show:

- What succeeded.
- What did not.
- What remains safe.
- What the user can retry.
- What can be undone.

Example:

`8 tabs were organized. 2 stayed in place because their windows closed. Nothing was deleted.`

### 17.3 Model unavailable

Use calm, useful copy:

`Local intelligence is unavailable right now. Search and manual organization still work.`

Provide retry or setup when relevant. Do not block the rest of the extension behind a model error screen.

### 17.4 Unsupported browser capability

Name the limitation and the fallback:

`This browser cannot put a tab to sleep on request. Sky River Machine can still organize and restore it.`

Do not display browser-brand blame or imply that an unavailable feature succeeded.

### 17.5 Offline state

Because the product is designed for local operation, offline should not look like a general failure. Only features that genuinely depend on unavailable local assets or browser state should show an issue.

## 18. Empty, loading, and edge states

Every major screen must define:

- First use.
- No data.
- No results.
- Loading.
- Canceled work.
- Permission denied.
- Local model unavailable.
- Invalid model output.
- Partial success.
- Browser capability unavailable.
- Storage pressure.
- Recovery after restart.
- Very large collection.

Empty states should teach one next action in one or two sentences. They must not use empty illustrations as a substitute for instruction.

## 19. Motion and touch

Motion should make state continuity visible. It should never become a reward system.

### 19.1 Timing

- Press feedback: 80–120 milliseconds.
- Hover and focus transition: 120–160 milliseconds.
- Card or sheet transition: 180–240 milliseconds.
- Large view transition: 240–320 milliseconds.
- Ambient Riverline movement: one short bounded pass, then stillness.

Prefer ease-out for entering content and ease-in for content leaving. Avoid spring overshoot on dialogs, warnings, destructive controls, and tab rows.

### 19.2 Meaningful transitions

- A moved tab row travels toward its new workspace only when both locations are visible; otherwise use a fade and explicit confirmation.
- A Dormant transition gently reduces surface emphasis without dimming text below readable contrast.
- Restoring a tab reverses that emphasis and places focus on the result or confirmation.
- Undo restores layout without replaying a long animation.

### 19.3 Reduced motion

Under `prefers-reduced-motion`:

- Remove parallax, path travel, continuous shimmer, and scale transitions.
- Use instant state changes or short opacity fades.
- Keep progress understandable through text and native indicators.
- Preserve focus movement and announcements.

### 19.4 Touch and pointer behavior

- No hover-only action.
- No swipe-only archive or delete.
- Drag-and-drop always has Move controls and keyboard alternatives.
- Do not place destructive actions beside high-frequency open/restore actions.
- Use forgiving hit areas with visible pressed states.

## 20. Accessibility is the design, not a checklist

The target is WCAG 2.2 AA for the extension UI, with selected AAA contrast where it improves readability without flattening hierarchy.

### 20.1 Keyboard

- Every action works without a pointer.
- Focus order follows the visual and reading order.
- Focus is never trapped outside a modal and never lost after list updates.
- `Escape` closes transient layers without discarding unsaved user choices.
- Arrow-key patterns are used only for widgets whose semantics call for them.
- Shortcuts are discoverable, remappable where appropriate, and never the only path.

### 20.2 Focus

- Use a 2-pixel high-contrast focus ring with at least 2 pixels of separation where practical.
- Never remove the browser outline without an equal or stronger replacement.
- Show focus on mouse click only when helpful; always show it for keyboard navigation.
- Return focus to the invoking control after a dialog or menu closes.

### 20.3 Screen readers

- Use native elements before ARIA.
- Give every screen one clear heading hierarchy.
- Announce analysis completion, selection totals, partial failures, and restoration results through polite live regions.
- Do not repeatedly announce decorative updates.
- Lifecycle labels include their plain meaning when ambiguity is likely.
- Virtualized rows retain understandable position and set context.

### 20.4 Vision and contrast

- Never encode state, confidence, warning, or selection by color alone.
- Verify normal and large text contrast in both themes.
- Support forced colors and operating-system high-contrast modes.
- Keep text readable over every ambient effect.
- Favicons are supplementary and may not be the only identifier.
- At 200% zoom, core flows remain usable without two-dimensional scrolling.

### 20.5 Cognition and language

- Prefer short sentences and everyday verbs.
- One concept per paragraph.
- Keep instructions beside the relevant control.
- Avoid time pressure, auto-dismissed critical messages, and memory tests.
- Preserve predictable placement for navigation and primary actions.
- Offer examples for unfamiliar concepts.
- Do not force users to understand AI, memory models, browser APIs, or lifecycle internals before completing a task.

### 20.6 Motor and vestibular needs

- Maintain 44-by-44-pixel targets.
- Provide non-drag alternatives.
- Do not require precise path movement.
- Avoid motion tied directly to pointer position.
- Do not auto-scroll while the user is reading or reviewing choices.

## 21. The grandma test

Every important flow should be tested with someone who is comfortable browsing but does not know tab-management or AI terminology.

They should be able to answer, without coaching:

- What will this button do?
- Will any tab disappear?
- Can I get it back?
- Why is the extension suggesting this?
- What information is being read?
- Did the action finish?
- Where would I undo it?

Design review fails if the answer requires model terminology, browser internals, hidden gestures, remembering an icon legend, or reading a long settings page.

Plain alternatives should appear when product language is introduced:

- Active: `Open and ready`.
- Dormant: `Saved, using less memory`.
- Extinct: `Archived and restorable`.
- Local model: `Runs on this device`.

The interface should never sound childish or patronizing. Simplicity is respect.

## 22. Content design and voice

The voice is a capable traveling companion: warm, direct, observant, and never overeager.

### 22.1 Voice rules

- Lead with what happened or what needs attention.
- Use the user's language before technical language.
- Name consequences precisely.
- Admit uncertainty.
- Use humor sparingly and never during data loss, permissions, recovery, privacy, or errors.
- Avoid exclamation marks in routine confirmations.
- Avoid guilt, productivity moralizing, and anthropomorphic AI claims.

### 22.2 Preferred vocabulary

Use:

- `Organize tabs`
- `Suggested workspace`
- `Needs your choice`
- `Processed on this device`
- `Protected`
- `Let tab rest`
- `Archive tab`
- `Restore tab`
- `Delete record`
- `Undo`

Avoid:

- `Optimize now`
- `AI magic`
- `Clean up junk`
- `Kill tabs`
- `Boost RAM`
- `Perfect match`
- `We know what you need`
- `Don't worry`
- `Smart everything`

### 22.3 Microcopy examples

Good:

`These 6 tabs may belong to the same project. Review them before anything moves.`

Bad:

`Our powerful AI found the perfect workspace for your chaotic browser!`

Good:

`This tab is protected and will stay open.`

Bad:

`Automation skipped this item due to policy constraints.`

Good:

`The browser could not restore this tab. Its saved record is still here.`

Bad:

`Operation failed.`

## 23. Responsive and cross-browser behavior

### 23.1 Compact side panel

- One column.
- Bottom navigation.
- Full-width primary action.
- Filters open in a sheet.
- Proposal tabs collapse under their workspace summary.
- Comparison layouts become before/after sections, not squeezed columns.

### 23.2 Wide side panel

- One main column with a narrow contextual detail pane when space allows.
- Navigation remains compact.
- Tab details can stay visible beside a list.

### 23.3 Full extension page

- Slim left navigation rail.
- Centered content with a readable maximum width.
- Two-column review only when both columns remain legible.
- Large archives use the extra width for context, not more dashboard widgets.

### 23.4 Capability adaptation

The UI is capability-driven:

- Show a side panel when the tested browser adapter supports it.
- Use the full extension page fallback when it does not.
- Show native discard language only when native discard is available and verified.
- Keep durable workspace and restore experiences consistent across browsers.
- Explain degraded behavior at the point of use.

Do not scatter browser logos across the everyday experience. Browser-specific explanation belongs in capability details or a relevant blocked state.

## 24. Performance as a feeling

The interface must feel light even while bounded local analysis continues.

- Render the useful shell before archive analysis finishes.
- Prefer skeleton blocks shaped like the final content over generic spinners.
- Do not animate more than a few visible elements simultaneously.
- Pause nonessential animation when the surface is hidden.
- Avoid backdrop blur on large scrolling regions or low-performance profiles.
- Window or paginate large tab lists.
- Keep scroll position stable when results update.
- Make cancellation immediate in the UI and truthful in the runtime.

Never claim faster browsing, memory saved, battery improvement, or crash prevention without representative measurements. If measured resource information is shown, include the measurement scope and freshness.

## 25. Component behavior

### Buttons

- Primary: filled River color, one per decision area.
- Secondary: neutral surface with border.
- Tertiary: text or icon-text action.
- Destructive: danger treatment only when the current action is destructive.
- Disabled controls must explain why when the reason is not obvious.

### Fields

- Use persistent labels; placeholder text is an example, not the label.
- Validation appears after meaningful interaction, not while the user is still typing.
- Preserve typed queries and edited workspace names across recoverable errors.

### Menus

- Keep high-frequency safe actions first.
- Separate destructive actions with a divider.
- Use sentence case.
- Never put the only explanation of an action inside a tooltip.

### Dialogs and sheets

- Use dialogs for decisions that interrupt the current task or carry real consequence.
- Use sheets for compact filters, details, and contextual editing.
- Name the affected tabs or count.
- Keep the primary action in a predictable lower-right or full-width mobile position.
- Never use a modal for routine success.

### Toasts and banners

- Toasts: brief, noncritical confirmation with nearby undo.
- Inline notices: local issue attached to its affected item.
- Banners: page-level degraded state or recovery need.
- Dialogs: user decision required before proceeding.
- Critical messages do not auto-dismiss.

### Tooltips

- Supplement labels; never replace them for essential controls.
- Open on hover and keyboard focus.
- Stay readable long enough and dismiss with `Escape`.

## 26. Design anti-patterns

Do not build:

- A dashboard wall of statistics.
- A chatbot as the primary navigation model.
- A floating AI orb.
- A card for every sentence.
- A rainbow for workspace categories.
- An interface full of unlabeled icons.
- Infinite nested sidebars.
- Persistent onboarding tours.
- Surprise automatic tab movement.
- Swipe-only or drag-only actions.
- Fake progress percentages.
- Model confidence presented as certainty.
- Red styling for Dormant or Extinct.
- Glass effects that lower contrast.
- Tiny low-contrast metadata as the only explanation.
- Achievement badges, streaks, cleanup scores, or shame-based clutter metrics.
- Confetti after organization.
- Cute language during permission, privacy, recovery, or data-loss situations.
- Browser-specific controls shown when the capability is unavailable.

## 27. Design review scenarios

Every serious UI pass should be reviewed with synthetic data in at least these scenarios:

1. First run with 12 mixed tabs and no saved workspaces.
2. Returning user with one active workspace and no pending suggestions.
3. Five suggested workspaces with three ambiguous tabs.
4. A protected payment form and audible media tab inside a batch.
5. Search returning Active, Dormant, and Extinct records together.
6. Duplicate candidates where the user keeps every tab.
7. Permission denied for visible page context.
8. Local model unavailable with manual organization still usable.
9. Partial organization failure after some browser mutations succeed.
10. Crash recovery after an interrupted operation.
11. A workspace with 1,000 records.
12. Multilingual and very long page titles.
13. Empty, missing, or identical titles.
14. Keyboard-only review and restoration.
15. Screen reader review of state, selection, and result announcements.
16. 200% zoom, reduced motion, forced colors, and high contrast.
17. Narrow and wide side-panel widths.
18. A browser without side-panel, grouping, or native-discard capability.

Use only clearly fictional tab data and safe example URLs.

## 28. Definition of done for a UI surface

A surface is not design-complete until:

- Its purpose and one primary action are obvious.
- Default, loading, empty, error, denied, unavailable, partial, and recovery states exist where relevant.
- Consequential actions preview their exact effect.
- Protection and recovery are visible.
- AI suggestions expose understandable evidence and uncertainty.
- The surface works without model availability where the product contract requires it.
- Keyboard, screen reader, zoom, contrast, reduced-motion, and non-drag paths are verified.
- Compact side-panel and full-page layouts are checked.
- Large collections do not destroy focus, scroll stability, or performance.
- Browser capability differences are represented honestly.
- Privacy explanations appear at the moment access is requested.
- Copy uses consistent lifecycle and action language.
- Decorative effects can be removed without losing meaning.
- No capability is presented as implemented before code and representative testing prove it.

## 29. Final creative standard

Sky River Machine should be memorable after one glance and understandable after one second.

Its signature is not a loud brand stunt. It is the feeling that a large, chaotic browsing session has become spacious without becoming abstract; that sophisticated local intelligence is present without demanding attention; and that every tab remains under the user's control.

The final interface should feel like this:

- A river, because work moves and reconnects.
- A sky, because the collection can be vast without feeling cramped.
- A machine, because actions are precise, inspectable, and dependable.

Beautiful enough to feel considered. Quiet enough to disappear into the work. Clear enough that anyone—from a power user with thousands of tabs to a grandparent who simply wants to find a page again—can use it without fear.
