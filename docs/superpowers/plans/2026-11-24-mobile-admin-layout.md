# Mobile Admin Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use the native implementation flow task-by-task.

**Goal:** Make the Naqa admin dashboard usable on narrow iPhone screens without changing Firebase authentication or data behavior.

**Architecture:** Keep the existing DOM and JavaScript routes intact. Add a narrow-screen CSS layout that gives the content the available width, stacks the search controls, and preserves navigation through compact icon controls and visible submenu buttons when expanded.

**Tech Stack:** Static HTML, CSS, existing vanilla JavaScript.

**Spec:** User request to begin improving the published admin dashboard; first slice targets the mobile layout shown in the supplied screenshot.

## Global Constraints

- Do not modify `js/admin/firebase-gate.js`.
- Do not change Firebase configuration, routes, localStorage keys, or order/product behavior.
- Preserve Arabic RTL and English LTR support.
- Keep desktop layout unchanged outside the narrow-screen media query.

## Review Focus

- iPhone-width content must not be reduced to an unusable column.
- Search and add-product controls must wrap without horizontal overflow.
- Navigation controls must remain tappable and identifiable.
- Product edit full-screen sheet must retain its existing behavior.
- Firebase files and script order must remain byte-for-byte unchanged.

---

### Task 1: Narrow-screen layout

**Files:**
- Modify: `css/admin.css`
- Test: shell-based structural checks and CSS syntax sanity checks

**Interfaces:**
- Consumes: existing `.admin-shell`, `.side-nav`, `.admin-main`, `.top-bar`, `.search-wrap`, `.btn-add` classes.
- Produces: a responsive layout at `max-width: 600px`; no JavaScript API changes.

- [ ] Add a `max-width:600px` media block that reduces the navigation rail to a compact tappable column, keeps icons visible, and hides only redundant labels.
- [ ] Stack the top-bar search and add-product controls and make inputs/buttons full-width within the available content area.
- [ ] Prevent horizontal overflow while preserving the existing edit sheet and safe-area behavior.
- [ ] Run checks for changed-file scope, Firebase immutability, required selectors, and balanced CSS braces.
- [ ] Commit the atomic CSS change with a descriptive `fix:` message.
