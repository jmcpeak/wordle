---
name: lift-static-jsx-objects
description: >-
  Lift static JavaScript object literals out of TSX/JSX into module-level
  constants at the top of the component file. Use when writing or editing
  React components, adding MUI sx/style/slotProps/anchorOrigin/timeout props,
  or when the user asks to extract inline objects for readability.
---

# Lift static JSX objects

Makes components easier to read by keeping the render tree free of bulky object literals.

## Rule

Wherever you define **static** JavaScript objects inside TSX/JSX, lift them to constants at the top of the component file.

## Why

makes component easier to read.

## Pattern

**Before:**

```tsx
<Box
  sx={{
    width: 3,
    height: 3,
    borderRadius: '50%',
    bgcolor: 'text.disabled',
    opacity: 0.6,
    flexShrink: 0,
  }}
/>
```

**After:**

```tsx
const DOT_SX = {
  width: 3,
  height: 3,
  borderRadius: '50%',
  bgcolor: 'text.disabled',
  opacity: 0.6,
  flexShrink: 0,
} as const;

// inside JSX:
<Box sx={DOT_SX} />
```

## Conventions

1. Place constants **after imports**, **before** the component (module scope).
2. Name `sx` objects with `SCREAMING_SNAKE` + `_SX` (e.g. `ROOT_SX`, `STACK_SX`, `TITLE_SX`).
3. Name other static prop objects descriptively (`ANCHOR_ORIGIN`, `COLLAPSE_TIMEOUT`, `CACHE_OPTIONS`).
4. Prefer `as const` for static style/config objects (match existing files like `GamePage.tsx`).
5. Use the constant in JSX: `sx={ROOT_SX}`, not a fresh object.

## Lift these

- `sx={{ ... }}`, `style={{ ... }}`
- Static `slotProps`, `anchorOrigin`, `timeout`, `options`, `PaperProps`, etc.
- Objects that only use static theme token strings (`'text.secondary'`) or module-safe theme callbacks that do **not** close over props/state/hooks

## Do not lift

- Objects that close over **props**, **state**, **hooks**, or other locals
- `useMemo` / values that depend on runtime data
- Test fixtures in `*.test.tsx` (keep inline per assertion)
- Already-extracted module constants
- Function-form `sx={(theme) => ({ ... })}` unless it can live at module scope with no component closure

## When editing components

Apply this on every new or touched TSX/JSX file — do not leave new inline static objects in the render tree.
