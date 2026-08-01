# Sky River Machine

> A browser extension for turning an unlimited river of open tabs into an organized, memory-safe workspace.

Sky River Machine is an intelligent tab companion for people who live inside their browser.

It is for the researcher with four search trails open, the developer balancing three repositories, the designer collecting references, the student moving between lectures and assignments, and the incurable tab collector who says, “I’ll need this later,” with complete sincerity.

The browser sees a pile of pages.

Sky River Machine tries to see the work.

It understands that a GitHub repository, a documentation page, a tutorial, a design reference, and a project discussion may all belong to one living task—even when they come from different websites. It also understands that two tabs from the same website may belong to entirely different worlds.

The result is not just fewer tabs. It is a calmer workspace, clearer projects, safer memory management, and a much better chance of finding the one page you were sure you would remember—without forcing the user to close useful work or watch the browser consume every byte of RAM.

---

## The problem: a browser serves pages, not purposes

Tabs are excellent little doors. The trouble begins when we open forty of them and ask our future selves to remember what lies behind every door.

Modern browsing is full of invisible context:

- Why was this page opened?
- Which project does it belong to?
- Is it still useful, or merely familiar?
- Was it opened for research, reference, action, or distraction?
- Is another tab already answering the same question?
- Can it be unloaded from memory safely?
- If it disappears, will it be easy to find again?

Traditional tab grouping helps, but simple rules are not enough. Grouping by domain cannot tell the difference between a GitHub repository for Sky River Machine and a GitHub issue for OrbitLab. A timer cannot tell the difference between an abandoned article and a payment form that is waiting for the user’s next step.

The browser knows where a tab is.

Sky River Machine is designed to understand why it is there.

## The central idea

Sky River Machine uses lightweight, privacy-conscious AI to understand browsing context and manage tabs according to their:

- Purpose
- Relationship to other tabs
- Importance
- Recent activity
- Project or workspace
- Likely future usefulness

The important idea is not:

> “AI sorts tabs.”

It is:

> AI understands the user’s browsing context and helps manage tabs according to the work they represent.

That distinction is the whole dish. A good kitchen does not throw every ingredient into one bowl just because they arrived from the same shop. It knows what belongs together, what needs attention now, what can wait, and what should be kept safely for later.

## The real promise: more tabs without more chaos

Sky River Machine is not merely a sorting layer placed on top of a browser that still keeps every page alive.

Its deeper promise is that the number of tabs should not translate directly into the amount of memory the browser consumes. A user may keep hundreds or thousands of tabs across years of work, but only the small set that deserves immediate attention should remain fully active in memory.

Everything else must remain understandable, searchable, recoverable, and cheap to keep.

That means Sky River Machine treats a tab as more than a live webpage. It treats it as a durable record with different levels of presence:

- A live page for work happening now
- A preserved but unloaded page for work that still matters
- A recoverable archive record for work that no longer needs to occupy the browser

The user should not have to choose between keeping a page and keeping the computer usable.

### High-tab-count behavior is a core requirement

The extension must remain useful when the tab count becomes large. It should not attempt to load, summarize, embed, render, or retain every tab at the same time.

It should instead:

- Keep only a bounded hot set of pages fully active
- Store lightweight metadata separately from page contents
- Process tabs in batches instead of creating one unbounded job per tab
- Analyze dormant and extinct tabs lazily when needed
- Use browser-native sleeping or discarding where available
- Paginate and virtualize large workspace lists
- Apply memory budgets and backpressure before the system becomes unhealthy
- Checkpoint workspace state continuously so a crash cannot erase the user’s organization
- Recover cleanly after browser or extension failure
- Degrade gracefully in speed or detail before degrading in safety

The product may have to wait before analyzing a very large collection. It must not respond by consuming all available RAM, freezing the browser, or crashing while trying to be helpful.

### Memory and crash-safety contract

These are product requirements, not implementation decorations:

1. **Tab count must not equal loaded-page count.** A large collection can exist as lightweight records while only a bounded working set remains live.
2. **Memory usage must be budgeted.** The extension must maintain bounded caches, bounded queues, and bounded model workloads instead of allowing every tab to accumulate state indefinitely.
3. **Analysis must be incremental.** New or recently changed tabs receive priority; dormant and extinct collections are analyzed in controlled batches or only when needed.
4. **The interface must scale.** Large lists use pagination, virtualization, filtering, and search instead of rendering every tab at once.
5. **One bad page must not poison the whole run.** A failed summary, malformed page, unavailable model, or browser API error must be isolated to that tab or operation.
6. **State must be checkpointed before mutation.** If the browser, extension, or model fails while applying changes, the user’s workspace and recovery information must remain intact.
7. **The system must degrade gracefully.** Under memory pressure it may reduce analysis detail, defer work, or move safe pages toward Dormant or Extinct; it must not freeze, silently discard user work, or crash.
8. **Recovery must be normal behavior.** After a restart or crash, Sky River Machine must reconstruct its workspace records and offer restoration without requiring the user to remember every lost tab.

The machine’s job is not to make a huge tab collection look tidy for a moment. Its job is to keep that collection usable over time without turning it into a browser-sized hostage situation.

## What Sky River Machine understands

When analyzing a tab, the extension may consider lightweight signals such as:

- The tab title
- The URL and domain
- Page metadata
- A short summary of the visible page
- Nearby tabs
- Tabs that are frequently opened together
- How recently the user interacted with the tab
- User corrections to previous suggestions
- Protections and preferences set by the user

This context helps the system distinguish between a page that is merely open and a page that belongs to a meaningful activity.

For example, these tabs may look unrelated to a conventional browser:

- A GitHub repository
- Chrome extension documentation
- A local-model tutorial
- The Stardance project page
- A design reference

Sky River Machine could recognize that they form one workspace:

### Sky River Machine Development

At the same time, another GitHub repository may belong to:

### OrbitLab

The websites overlap. The work does not.

## Suggested workspaces, reviewed by a human

When the user asks Sky River Machine to analyze their tabs, it proposes an organization based on actual context rather than generic categories like “Work,” “Social,” and “Entertainment.”

A suggestion might look like:

- Sky River Machine Development
- OrbitLab Research
- Stardance Submission
- Schoolwork
- General Reading
    - Dormant Reading

The user reviews the arrangement before anything changes. They can:

- Rename a workspace
- Move a tab
- Merge workspaces
- Split a workspace
- Reject a suggestion
- Leave a tab exactly where it is
- Apply the organization only when it feels right

The extension proposes. The user decides.

There is no dramatic chef’s knife swinging through the kitchen while the owner is away. No surprise tab massacre. No mysterious rearrangement that leaves the user wondering what happened to the page they needed five minutes ago.

## The tab lifecycle: Active, Dormant, Extinct

Sky River Machine gives every tab a clear lifecycle label. These labels describe how much presence a tab deserves in the live browser, how much memory it should be allowed to consume, and how easily it can return when the user needs it.

The three primary states are:

```text
Active  →  Dormant  →  Extinct
  ↑           ↑          │
  └───────────┴──────────┘
       recoverable at any time
```

The labels are not judgments about whether a tab is valuable. They describe whether it should currently be alive inside the browser’s expensive working memory.

### Active

An **Active** tab is part of the user’s immediate work.

It may be:

- The current tab
- Recently interacted with
- Playing audio
- Showing a live dashboard
- Being edited
- Waiting for a form submission
- Marked important by the user
- Needed by the current workspace

Active tabs receive the highest responsiveness priority. They remain loaded when safe, but even Active status is not permission to create an unbounded memory footprint. The extension should protect active work while still respecting the browser’s available resources.

### Dormant

A **Dormant** tab still belongs to the user’s work, but it does not need to remain fully alive right now.

It remains visible or represented in its workspace, while its expensive page state can be unloaded, suspended, or reduced to a recoverable record. Its title, URL, workspace, protections, summary, and relevant search information remain available without requiring the full webpage to occupy RAM.

Dormant tabs include pages that were previously called parked, idle, or sleeping. Those words describe reasons or actions; **Dormant** is the product state.

A dormant tab can become Active immediately when the user selects or restores it.

### Extinct

An **Extinct** tab no longer occupies the active browser tab bar or page memory, but it has not been forgotten.

Its recoverable record remains in the appropriate workspace, including enough information to find and restore it:

- URL
- Title
- Workspace
- Last known context
- User protections
- Search metadata
- Relevant summary
- Restoration history

Extinct does not mean deleted. It means removed from the live browser environment while remaining recoverable. The user can revive an Extinct tab whenever the work returns.

### State transitions

Sky River Machine may recommend or perform a transition only when safety rules allow it:

- **Active → Dormant** when a tab no longer needs to remain loaded.
- **Dormant → Active** when the user opens, restores, or actively needs the tab.
- **Dormant → Extinct** when the tab should leave the live browser while remaining recoverable.
- **Extinct → Active** when the user restores the tab directly.
- **Extinct → Dormant** when the tab is restored as part of a workspace but does not need to stay loaded.

User protections override lifecycle recommendations. A page marked **Never sleep**, a document with unsaved work, a payment flow, or a user-defined important tab must not be quietly moved into a state that could interrupt it.

The lifecycle is therefore both an attention model and a memory model:

```text
Active   = immediate work and highest responsiveness
Dormant  = preserved work with minimal live resource use
Extinct  = archived work with no live page cost
```

## Context matters more than a timer

A tab that has not been opened for two hours is not automatically unimportant.

It might be:

- A form the user is completing
- A live dashboard
- A document being edited
- A payment page
- A reference needed later
- A tab playing audio
- An important page deliberately kept open

Sky River Machine is intended to consider page type and user behavior before recommending that a tab become Dormant or Extinct. Time is one ingredient, not the entire recipe.

The extension should be especially cautious around pages where automatic intervention could cause confusion, lost work, or an unpleasant surprise.

## The user remains in control

Good assistance knows when to step back.

Users can protect tabs with instructions such as:

- Important
- Never sleep
- Keep until completed
- Archive later
- Always group with a specific project

These protections let the user define personal boundaries. A live dashboard may be critical to one person and disposable to another. A form may look quiet while being extremely important. A page that appears ordinary to an algorithm may be the one thing holding an entire afternoon together.

Sky River Machine should respect those signals.

## The labels stay visible

The lifecycle is not hidden inside an AI explanation or buried in a settings page. Users should be able to see the state of their browser at a glance.

A workspace may show a compact summary such as:

```text
Sky River Machine Development
Active  8     Dormant  31     Extinct  146
```

Every tab should carry a clear state label or indicator:

- **Active** — loaded or immediately available for current work
- **Dormant** — preserved in the workspace with minimal live resource use
- **Extinct** — removed from the live browser but safely recoverable

The user should also be able to filter by these labels, search within them, change a state manually, and understand why the system recommended a transition.

The labels describe resource and attention status, not worth. An Extinct tab is not a useless tab. A Dormant tab is not a forgotten tab. An Active tab is not automatically important forever.

## Duplicate and near-duplicate detection

Tab clutter is not only caused by too many unrelated pages. It also comes from opening the same answer again and again in slightly different clothes.

Sky River Machine can identify possible duplicates and near-duplicates, including:

- Several search results about the same API
- Two versions of the same documentation page
- Multiple articles answering the same question
- Repeated tabs opened accidentally
- Pages covering almost identical information

Instead of closing anything automatically, it can offer a gentle suggestion:

> These four tabs appear to cover the same topic. Keep one, archive the rest, or leave them unchanged.

The user can compare the pages and choose what stays. Sometimes the “duplicate” contains the one paragraph that matters. The extension should make that decision easier, not make it on the user’s behalf without permission.

## Search by memory, not just by title

The more tabs someone keeps, the less useful tiny tab titles become.

Sky River Machine is intended to provide a global search interface that can look through:

- Open tabs
- Dormant tabs
- Extinct workspaces and tab records
- Tab titles
- Page summaries
- URLs and domains
- Workspace names
- Relationships between tabs

The user could search naturally:

> the documentation tab I was using for browser tab sleeping

Or:

> the Manifest V3 permission page

The goal is to find the page by what it meant, not by reconstructing the exact title the website happened to choose.

If the page is Dormant or Extinct, Sky River Machine can locate it and restore it when requested.

## It learns from corrections

AI suggestions become useful when they improve with the person using them.

Suppose Sky River Machine places an OrbitLab GitHub issue in a generic coding workspace. The user moves it into OrbitLab. That correction can become a useful personal signal for future organization.

Over time, the extension may learn associations such as:

- A repository belongs to a specific project
- Certain words consistently refer to a workspace
- A particular documentation site is used for one kind of task
- Certain tabs should never be slept
- Several pages are usually opened together

This learning is personal. Two people can look at identical tabs and organize them differently because their projects, habits, and definitions of “important” are different.

Sky River Machine should adapt to the individual user instead of forcing every browser into the same few categories.

## Privacy is part of the recipe

Browsing context can be deeply sensitive. Tab titles and page summaries may reveal projects, health information, finances, private conversations, work documents, or unfinished thoughts.

Sending every piece of that context to a remote API would create a serious privacy concern.

Sky River Machine is designed around the possibility of local AI processing. A compact model, such as Gemma or a similar small local model, could perform focused tasks on the user’s own device.

The model does not need to write a novel. It needs to handle a narrow set of useful judgments:

- Determine which tabs are related
- Suggest concise workspace names
- Estimate whether a tab should be Active, Dormant, or Extinct
- Detect similar or duplicate content
- Interpret natural-language tab searches
- Learn from user corrections

These tasks are smaller than general chatbot conversations. That makes a compact local model a natural direction for the project and keeps privacy closer to the user’s hands.

The final implementation should make its data behavior clear: what is read, what is stored, what is processed locally, and what—if anything—ever leaves the device.

## A typical session

The browser opens with forty scattered tabs. The same experience must continue to work when that becomes four hundred or four thousand.

There is a repository, a lecture recording, two documentation pages, a search trail, a design reference, a payment form, an old article, a dashboard, and three tabs that everyone involved has forgotten to close.

The user opens Sky River Machine and chooses **Analyze Tabs**.

The extension studies the available context and suggests:

- Sky River Machine Development
- OrbitLab Research
- Stardance Submission
- Schoolwork
- General Reading
    - Dormant Reading

The user reviews the proposal. One tab is moved to the correct project. The payment form is marked **Important**. The dashboard is protected from sleeping. A repeated documentation tab is identified for review.

The user applies the organization.

The browser becomes easier to read. Pages needed now remain Active. Safe pages become Dormant so they stop consuming unnecessary memory. Pages that no longer need a live browser seat become Extinct while remaining recoverable. The important work remains protected.

Later, the user searches for:

> Manifest V3 permission page

Sky River Machine finds the Dormant or Extinct tab, restores it, and returns the user to the trail of thought they were following.

When the browser closes or the user changes projects, the workspace arrangement can be saved for later restoration.

That is the quiet magic of the product: fewer tiny acts of maintenance between a person and the thing they are trying to make.

## Why the name: Sky River Machine

The name is intentionally a little strange.

The browser is a sky full of moving lights: ideas, references, tasks, conversations, tools, and unfinished journeys. Tabs form a river through that sky, carrying the user from one piece of work to the next.

The machine is the small, patient instrument underneath it all—observing patterns, carrying context, and helping the river keep its shape.

It is not meant to feel like a strict office filing system. It should feel more like a capable traveling companion: attentive, practical, occasionally clever, and wise enough not to touch the important things without asking.

## Built for frictionless browsing

Sky River Machine connects naturally to the idea of frictionless work: remove the small repeated annoyances that quietly consume attention throughout the day.

It aims to reduce the need to:

- Manually sort tabs
- Remember why a tab was opened
- Hunt through a crowded tab strip
- Decide which tabs are safe to close
- Reopen an entire project workspace by hand
- Recover important tabs after a browser crash
- Keep every forgotten page loaded in memory
- Restart an entire project after the browser has discarded or recovered tabs
- Repeat the same organization decisions every day

Each individual annoyance is small. Together, they create a browser that feels like a drawer full of tangled cables.

Sky River Machine is an attempt to untangle the drawer without throwing away the cables.

## Intended browser support

The project is intended to work across Chromium-based browsers and Firefox.

The shared product experience can remain consistent while browser-specific adapters handle differences in:

- Tab grouping
- Tab discarding and sleeping
- Side panels
- Workspace restoration
- Extension APIs

The extension should feel like one product, even where browsers require different technical paths underneath.

## Design principles

### Understand purpose, not just location

Domain-based grouping is a useful signal, but it is not a complete understanding of a task.

### Suggest before changing

Organization should be previewable, explainable, and reversible.

### Protect important work

Forms, dashboards, active documents, audio, payments, and user-marked tabs deserve special care.

### Treat memory as a bounded resource

The user’s tab count must not become a direct bill against their RAM. Sky River Machine must preserve the meaning and recoverability of large tab collections while keeping only an appropriate working set live.

### Learn from the user

Corrections are not failures to hide. They are information that makes the next suggestion better.

### Keep privacy close

Local processing is a core direction, not a decorative feature.

### Make recovery easy

Dormancy, extinction, searching, and restoring should feel safe enough that users do not need to keep everything loaded “just in case.”

## Project status

The repository now contains a local-only development implementation covering metadata inventory, IndexedDB records, reconciliation, workspaces, token/context-ranked search, protection, checkpointed lifecycle paths, bounded heuristic suggestions, correction-informed naming, duplicate review, model-unavailable fallback contracts, optional bounded visible context, export/delete controls, and accessibility-oriented UI states.

Firefox smoke is recorded for the packaged development build, and the pinned q8 local-model candidate has been re-evaluated without passing its structured-output gate. Chromium smoke, representative performance/fault evidence, private-window/restart release gates, browser support claims, and a qualifying local model remain pending, so this is still a development build rather than a supported release.

The first useful version is the complete product described in this README. It is expected to understand tab context, organize tabs into meaningful workspaces, label every tab **Active**, **Dormant**, or **Extinct**, manage that lifecycle, protect important pages, detect duplicates, search by meaning, learn from corrections, process sensitive context locally where possible, and restore work when the user needs it.

It must also remain stable as the collection grows. Hundreds or thousands of tabs should not force every page to remain loaded, consume all available RAM, freeze the interface, or make a crash the price of keeping old work. Memory safety, bounded processing, checkpointed state, and recovery are part of the product—not later optimization work.

This repository is the starting point for building that product. The implementation, model integration, browser adapters, data storage, and interface are being built against the full experience rather than a stripped-down demo that postpones the central promises.

The README describes the intended destination and the standard the implementation must meet. As the product takes shape, it should be updated with the real setup commands, supported browsers, privacy behavior, model requirements, screenshots, and measured limitations.

## First useful release scope

The first useful release should provide the whole loop of intelligent browsing assistance:

1. Read available tab context safely.
2. Understand which tabs belong to the same activity or project.
3. Suggest meaningful workspaces and concise names.
4. Let the user review, correct, rename, merge, split, reject, and apply suggestions.
5. Track tabs as **Active**, **Dormant**, or **Extinct**.
6. Use page context, behavior, protections, and memory pressure—not only elapsed time—when recommending lifecycle changes.
7. Protect important tabs with instructions such as **Never sleep** and **Keep until completed**.
8. Detect exact, repeated, and near-duplicate pages without closing anything automatically.
9. Search Active, Dormant, and Extinct tabs using natural language and remembered context.
10. Learn from the user’s corrections and personal project associations.
11. Save workspaces and restore them after a project switch, browser close, or recovery event.
12. Use a compact local model for focused classification, grouping, search, and similarity tasks wherever the device can support it.
13. Maintain bounded memory use through lazy analysis, batching, virtualization, unloading, and backpressure.
14. Preserve state through checkpoints and recover cleanly from browser, extension, model, and storage failures.
15. Provide a shared experience across Chromium-based browsers and Firefox through browser-specific adapters.

These are not optional ideas reserved for a distant version. Together, they form the first version that deserves to be called Sky River Machine: a complete companion for understanding, organizing, protecting, finding, and managing the user’s browser work.

Future releases can improve model quality, speed, explanations, integrations, and polish. They should deepen the experience—not finally add the experience promised here.

## The promise

Sky River Machine will not ask users to become better at managing tabs.

It will try to make tab management require less of them.

It will help turn scattered pages into coherent workspaces, Active pages into focused work, Dormant pages into low-cost preserved context, Extinct pages into recoverable history, and browser memory into something the user can spend on the work in front of them.

The browser may contain a river of tabs. The machine must never let that river become a flood of RAM consumption, an unresponsive interface, or a crash that takes the user’s work with it.

Because the best browser assistant is not the one that makes the most decisions.

It is the one that understands the situation, keeps the important things safe, and knows when to offer a hand.

---

*Keep the useful pages warm. Let the forgotten ones rest. And never, ever lose the recipe for the work you came to do.*
