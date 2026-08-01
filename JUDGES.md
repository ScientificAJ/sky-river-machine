# Sky River Machine — Judge Brief

## One-sentence pitch

Sky River Machine turns an overwhelming browser tab pile into a reviewable, searchable, recoverable workspace without taking control away from the user.

## The problem

Browsers organize pages by the order in which they were opened, not by the work those pages represent. A user can have research, coding, schoolwork, shopping, communication, and unfinished tasks open at the same time. Domain-based tab groups and time-based cleanup cannot reliably tell which tabs belong together or which inactive tab is still important.

The result is familiar:

- useful tabs disappear inside a large tab bar;
- related work becomes scattered across unrelated websites;
- duplicate pages remain open because the user cannot safely compare them;
- keeping everything open consumes memory;
- closing or suspending the wrong tab can destroy context;
- users hesitate to clean up because recovery is uncertain.

Sky River Machine addresses the full quality-of-life problem: understanding tab context, making organization reviewable, reducing unnecessary live browser state, and preserving a recovery path.

## The three major quality-of-life improvements

### 1. From a tab pile to task-shaped workspaces

Sky River Machine creates bounded workspace suggestions from tab context instead of relying only on website names or fixed categories. It can use title, URL/domain, stored visible context, neighboring records, activity, and user corrections. Suggestions remain reviewable: the user can rename, reassign, split, merge by assignment, reject, or leave tabs unchanged before applying anything.

Why this matters: a GitHub repository, a documentation page, a tutorial, and a project discussion can belong to one task even when they come from different sites, while two tabs on the same site can belong to different tasks.

Current honesty boundary: the model adapter and structured-output validation exist, but no local model has passed the current qualification gate yet. The shipped fallback is bounded and local; the final semantic-model claim remains pending model qualification.

### 2. Keep useful tabs without keeping every page live

The lifecycle gives tabs a durable presence model:

```text
Active  →  Dormant  →  Extinct
  ↑           ↑          │
  └───────────┴──────────┘
       recoverable at any time
```

Active means immediate work. Dormant means the record still matters but the page may be safely unloaded when allowed. Extinct means the live tab is archived while its recoverable record remains searchable and restorable.

This is not a hidden cleanup daemon. Automation is off by default. Protected states, including the active tab and other safety-sensitive tabs, are refused or handled conservatively. Mutations are checkpointed, partial failures are represented, and restore/undo paths exist.

Why this matters: the user can reduce browser pressure without treating inactivity as proof that a page is unimportant.

### 3. Find, review, and clean up with confidence

The project combines ranked local search, duplicate review, user corrections, protected-tab rules, visible recovery state, and undo. A user can search by exact or partial context, inspect candidate duplicates, choose keep/dismiss/archive-selected outcomes, correct a workspace assignment, and reverse an organization action.

Why this matters: cleanup becomes a controlled decision instead of a risky one-click disappearance.

## What a judge can use today

The current implementation includes:

- Chromium and Firefox extension builds;
- browser-specific adapters rather than scattered browser API calls;
- IndexedDB records for tabs, workspaces, operations, suggestions, and corrections;
- idempotent reconciliation and Active/Dormant/Extinct lifecycle handling;
- protected-tab enforcement and approval-first actions;
- checkpointed archive, discard, restore, and undo paths;
- bounded heuristic suggestions and safe model-unavailable behavior;
- ranked search, duplicate review, and correction records;
- Home, Search, Workspaces, Recovery, and Settings surfaces;
- visible-context controls, deletion, export, and local privacy boundaries;
- 38 focused automated tests across 8 test files;
- passing TypeScript checks, Chromium/Firefox builds, artifact audit, and offline production dependency audit.

## Suggested judge demonstration

Use only fictional synthetic tabs. Do not use the operator's real browsing session.

1. Open a mixed session with fictional research, development, reference, and payment-form tabs.
2. Show that the extension inventories normal-window tabs and keeps its own extension page out of the inventory.
3. Trigger organization and show the reviewable workspace suggestions.
4. Correct one assignment and explain that the correction is recorded for future local fallback suggestions.
5. Open Search and find a tab using context rather than only a full URL.
6. Open duplicate review and choose an explicit keep/dismiss/archive-selected result.
7. Attempt to archive the protected payment-form tab and show the refusal.
8. Let an eligible synthetic tab become Dormant or archive it through the approval-first flow.
9. Search for the Extinct record, restore it, and demonstrate undo/recovery state.
10. Show Settings/privacy controls and explain that page-context extraction is bounded and user-invoked.

## Why the execution is thoughtful

The implementation treats browsing state as valuable user data rather than disposable UI state:

- AI output is untrusted until structurally validated.
- Deterministic safety rules remain separate from semantic interpretation.
- Browser differences are isolated behind adapters and capability checks.
- Local records have stable IDs and revisions instead of trusting temporary browser tab IDs.
- Operations checkpoint recovery information before mutation.
- Partial browser failures are surfaced instead of being reported as atomic success.
- Model timeout and unavailability fall back safely instead of freezing the extension.
- Permissions are limited to the current feature slice; there are no host permissions, remote model calls, analytics, or runtime-fetched code.
- Synthetic fixtures are used for tests and smoke work.

## Effort and delivery evidence

Observed engineering evidence:

- Phases 0–7 of the implementation plan are implemented.
- Phase 8 is substantially implemented but release gates remain open.
- Firefox core smoke found and led to fixes for real adapter, manifest, lifecycle, recovery, and extension-page inventory bugs.
- The project has a reproducible local-model evaluation path rather than an unverified model claim.
- Latest source and this judge brief are pushed to the public repository's `main` branch.

### Required final effort record

> **PLACEHOLDER — complete before submission:** Record the verified total effort spent on the project. Confirm that it is at least three hours. Include the date/session range and a short breakdown such as implementation, testing, debugging, documentation, and demo preparation. Do not replace this placeholder with an estimate presented as fact.

## Current limitations to state plainly

- This is not yet a supported release.
- Chromium browser smoke is blocked in the current managed environment and must be rerun on a normal development machine.
- Full Firefox restart, private-window, permission-denial, sidebar, and low-resource gates remain open.
- No local model is bundled because the tested q4f16 and q8 candidates failed current initialization/structured-output/latency gates.
- Representative large-session performance, storage-pressure, and fault-injection evidence remains to be collected.

These limitations do not erase the usable core. They define what must be proven before making a release or cross-browser support claim.

## Submission checklist

- [ ] Replace the effort placeholder with verified evidence showing at least three hours.
- [ ] Run the synthetic Chromium demo on the other machine.
- [ ] Complete the remaining Firefox release checks.
- [ ] Qualify a compatible local model or clearly submit the fallback-only state.
- [ ] Collect representative performance and fault-recovery evidence.
- [ ] Update release-status documentation with observed results.
- [ ] Run final checks, commit, push, and verify the remote commit.
