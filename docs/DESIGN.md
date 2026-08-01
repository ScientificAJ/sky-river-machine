# Product and interface design

## 1. Design direction

Sky River Machine should feel calm, practical, and trustworthy. It is a traveling companion for unfinished work, not a filing cabinet that scolds the user.

The central message is always visible: the extension proposes organization and memory management; the user remains in control.

## 2. Information architecture

Primary navigation:

- **Overview:** current browser health, active/dormant/extinct counts, pending suggestions, memory policy status.
- **Workspaces:** projects and their tab records.
- **Review:** organization proposals, duplicate candidates, lifecycle recommendations, and uncertain cases.
- **Search:** remembered-context search across all permitted records.
- **Settings:** privacy, permissions, automation, model, storage, browser capabilities, export, and deletion.

Secondary surfaces:

- Tab detail drawer.
- Workspace detail page.
- Restore confirmation.
- Automation activity log.
- Recovery/partial-failure notice.

## 3. Core flows

### Analyze tabs

1. User chooses the scope: current window, all windows, selected tabs, or existing records.
2. The extension shows what context will be read.
3. Analysis runs with visible progress and a stop action.
4. Results show workspace proposals, evidence, duplicates, and uncertain records.
5. User edits or rejects the proposal.
6. Apply creates a checkpoint and performs the selected changes.

### Find a forgotten page

1. User searches in natural language or with exact terms.
2. Results show title, workspace, state, last seen time, and why it matched.
3. Dormant results activate the existing tab; Extinct results restore a new tab.
4. The user can protect or refile the result immediately.

### Enable automation

Automation is a deliberate settings flow, not a hidden default:

1. User chooses what may be automated: discard, archive/close, organization, or only suggestions.
2. User chooses exclusions and protected categories.
3. User chooses approval level: always ask, ask for batches, or automatic within rules.
4. The UI previews the next actions and records them in an activity log.
5. Every automated action has undo/recovery where browser capabilities allow it.

## 4. Lifecycle language

Use the exact product labels:

- **Active:** immediate work and highest responsiveness.
- **Dormant:** preserved work using minimal live resources.
- **Extinct:** archived and recoverable, with no live page cost.

Do not use “dead,” “useless,” or “deleted” as synonyms for Extinct. State labels describe resource presence, not personal value.

Every recommendation explains its reason in plain language, for example: “Not opened recently, not protected, and safe to discard. This tab stays recoverable.”

## 5. Visual and interaction rules

- State uses text plus icon plus color; never color alone.
- Destructive actions use explicit verbs: `Archive tab`, `Restore tab`, `Delete record`.
- Counts are visible at workspace level.
- Large lists use search, filters, pagination/windowing, and stable keyboard focus.
- Loading and model work show progress without pretending to know an exact completion time.
- Partial failure is visible and actionable.
- Undo is placed near the action result, not hidden in settings.
- Empty states teach the next useful action.

## 6. Accessibility

- Keyboard-accessible navigation, dialogs, menus, filters, and review tables.
- Screen-reader labels for lifecycle state and action impact.
- Minimum contrast and visible focus indicators.
- Reduced-motion support.
- No interaction that depends on drag-and-drop alone.
- Confirmation text that names the number and type of affected tabs.

## 7. Audience modes

The same product serves three audiences:

- **Builder:** diagnostics, capability matrix, operation details, model/runtime metrics.
- **Contributor:** clear contracts, failure states, local development fixtures, and reproducible tests.
- **Reviewer/user:** product promise, screenshots, privacy behavior, measured limits, and understandable flows.

Keep technical diagnostics available without making them the default user experience.
