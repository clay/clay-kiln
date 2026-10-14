# Real-time collaboration

Kiln lets several people edit the same page at the same time. It turns on by itself when the site's amphora (9+) has [collaboration enabled](https://github.com/clay/amphora/blob/master/docs/advanced/collaboration.md); otherwise none of this runs and kiln behaves exactly as before.

## What editors see

* **Who's here.** Avatars of everyone else on the page sit in the toolbar, next to the site's buttons. A green dot means live; gray means "reconnecting" (your edits still save). Someone with several tabs open shows once. Click the avatars for a list of who's doing what ("Editing Headline", "Typing in Paragraph", "Idle", "Away"), a **Show** button that scrolls to them, and recent changes ("Ada published the page").
* **Where they are.** Whatever someone has open gets an outline in their color with a name tag ("Ada is editing", a dashed outline while they type). If it's off screen, a pill at the top or bottom edge points to them; click it to scroll there.
* **Their changes, live.** Within a couple of seconds of someone saving, the component re-renders for everyone, highlighted briefly ("Updated by Ada"). Components they add or remove, reordering, publishing, unpublishing and scheduling all show up too ("Grace published this page").
* **Nothing moves under you.** A change to something you have open (or to the list around an inline field you're typing in) waits until you close it, then merges with your edit.
* **Soft locks.** Opening a component or field someone else has open asks first: "Ada is editing this — Edit anyway / Cancel". Editing *different* fields of the same component needs no prompt; those changes merge.
* **No lost work.** If you both change the same field, your save wins (you're the one saving) and a snackbar offers "Use Ada's" to switch to theirs. If someone deletes a component you were just editing, you're offered **Restore**.
* **Undo stays yours.** Undo and redo only step through your own changes; they never revert someone else's.

## How it works

On load, kiln reads `locals.collaboration` (added by amphora in edit mode) and starts a small polling loop (`POST /_collab/sync`: every 2s with others, 4s alone, 20s in a background tab, 30s when idle) that sends this tab's presence and receives everyone else's presence plus the page's change feed.

Saves carry the revision of the data they were built from (`X-Clay-Rev`). If someone else saved in between, amphora answers 412 with the current data; kiln merges field by field (component lists by `_ref`, so adds/removes/moves from both people survive), retries, and then shows the merged result. Form saves only include the fields you actually changed.

All of this lives in `lib/collab/`. Hooks into the rest of kiln, all no-ops when collaboration is off:

| Where | What |
| --- | --- |
| `edit.js` | starts collaboration after the page is decorated |
| `component-data/actions.js`, `page-data/actions.js` | saves go through `collab/save.js` (revision + merge) |
| `forms/actions.js` | closing a form saves only the fields you changed |
| `decorators/actions.js` | soft-lock prompt before opening a form |
| `undo/actions.js` | `rebaseHistory` keeps other people's changes out of undo |
| `core-data/api.js` | every request names its tab (`X-Clay-Collab-Session`) |
| `toolbar/edit-toolbar.vue` | presence bar and page layer |

## For plugin authors

* `state.collab` is `null` unless collaboration is on. When on: `{ session, connected, failures, others, activity, pending, flashes }`.
* New mutations you can subscribe to: `COLLAB_START`, `COLLAB_SYNCED`, `COLLAB_SYNC_FAILED`, `COLLAB_ACTIVITY`, `COLLAB_PENDING`, `COLLAB_PENDING_DONE`, `COLLAB_FLASH`, `COLLAB_FLASH_DONE`, `COLLAB_LAYOUT_DATA`, `COLLAB_STOP`.
* Remote changes are applied with the same mutations as local ones (`UPDATE_COMPONENT`, `RENDER_COMPONENT` with `snapshot: false`, `UPDATE_PAGE`, `UPDATE_PAGE_STATE`), so plugins that react to those keep working.
* Save through kiln (`store.dispatch('saveComponent', ...)`, `savePage`) to get revision checks and merging. Plugins that `PUT` to the API directly still work, but their writes are unconditional (last one wins), as before.
* Clicks inside elements with the `kiln-collab` class don't close the current form.
