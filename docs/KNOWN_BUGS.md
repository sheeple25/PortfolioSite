# Known Bugs / Things to Look Out For

Unresolved question marks — things that looked wrong, aren't fully explained, or are worth double-checking later. Not a place for confirmed, fixed bugs; move an entry out (or delete it) once it's actually understood.

---

## Pixel sidebar: width stuck at 0px in Claude's browser-automation tab (unconfirmed, not reproduced by user)

**Where**: `components/pixel/PixelSidebar.tsx` / `PixelSidebar.module.css`, first built 2026-08-25.

**What happened**: While testing the sidebar via Claude's Chrome automation tool, opening the sidebar (`chatOpen` → `true`) left its `width` computed at `0px` instead of animating to `--sidebar-width`, even though:
- Position, height, z-index, and the `data-open` attribute/class all updated correctly.
- A `cloneNode(true)` of the exact same live element, inserted fresh into `<body>`, rendered at the correct width immediately — proving the CSS/class rules themselves are correct.
- An inline `width: ... !important` set directly via JS on the live node still failed to apply — not explainable by normal CSS cascade rules.
- Removing `inert`, stripping all `<button>`/`<input>` children, and toggling classes/attributes directly on the live node made no difference.

**Leading (unconfirmed) theory**: something specific to that automation browser tab/profile — possibly a form-autofill extension observed injecting `fdprocessedid` attributes into the sidebar's buttons/input, or some other quirk of that CDP-controlled session (that session also showed inconsistent viewport-vs-screenshot dimensions throughout testing, e.g. `window.innerWidth` disagreeing with the screenshot tool's output size).

**Status**: user confirmed the sidebar renders and animates correctly in their own regular browser. So this is very likely an artifact of the automation tooling/extension, not a real bug — but the root cause was never actually nailed down, and the debugging session ended without full confirmation. Flagging here in case something *does* look off for real users later, since the actual mechanism was never identified.

**How to apply**: if the sidebar (or any other `position: fixed`, width-transitioning element) ever appears stuck/frozen for a real visitor, revisit this — don't assume it's automation-only without checking.
