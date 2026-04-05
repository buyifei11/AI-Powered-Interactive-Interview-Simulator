# Design Principles

## Component Library

The UI is built on **shadcn/ui** — components are generated into `frontend/src/components/ui/` and owned by the repo. They are not imported from an external package.

**Adding components:**

```bash
cd frontend
npx shadcn@latest add <component-name>
# e.g. npx shadcn@latest add button card badge dialog select skeleton
```

**Rule:** Never manually edit files in `components/ui/`. If a primitive needs customization, wrap it in a component in `components/features/` or `components/shared/` — do not modify the generated base.

---

## Design Tokens & Color Palette

The design system uses CSS custom properties (set in `globals.css`) for all theme values. Tailwind utility classes reference these tokens.

### Core Palette (Dark Theme — Primary)

| Token | Value | Usage |
|---|---|---|
| Background | `slate-900` (`#0f172a`) | Page background |
| Surface | `slate-800` (`#1e293b`) | Cards, panels, modals |
| Surface elevated | `slate-700` (`#334155`) | Nested cards, tooltips |
| Border | `slate-700` / `slate-600` | Dividers, card borders |
| Text primary | `slate-100` (`#f1f5f9`) | Headlines, body text |
| Text secondary | `slate-400` (`#94a3b8`) | Labels, captions, hints |
| Accent primary | `teal-500` → `blue-600` (gradient) | Primary CTAs, key highlights |
| Accent hover | `teal-400` → `blue-500` (gradient) | Hover state for primary CTAs |
| Destructive | `rose-500` | Errors, destructive actions (e.g. recording indicator) |
| Success | `emerald-500` | Positive scores, success states |
| Warning | `amber-500` | Mid-range scores, caution states |

### Semantic Score Colors

Used in score displays across dashboard and report pages:

| Score Range | Color |
|---|---|
| 1–4 | `rose-500` (red) |
| 5–7 | `amber-500` (yellow) |
| 8–10 | `emerald-500` (green) |

---

## Typography

- **Font family:** System font stack via Tailwind (`font-sans`) — no custom font loading in MVP. Update `globals.css` to import a Google Font when branding is finalized.
- **Headlines:** `font-bold` or `font-extrabold`, `text-slate-100`
- **Body:** `font-normal`, `text-slate-100` or `text-slate-300`
- **Captions/labels:** `text-sm`, `text-slate-400`
- **Code/mono:** `font-mono`, `text-sm`

---

## Layout Patterns

### Auth Layout (`(auth)/layout.tsx`)
Centered column, no sidebar, no topbar. Brand logo at top.

```
full-screen, min-h-screen, flex flex-col items-center justify-center
  └── Card (max-w-md, w-full, p-8)
      ├── BrandLogo (centered, mb-6)
      ├── Page headline
      └── Form content
```

### App Shell (`AppShell.tsx`)
Authenticated layout: fixed sidebar on desktop, topbar on all sizes.

```
flex h-screen overflow-hidden
  ├── Sidebar (fixed, 240px, desktop only)
  └── Main content area (flex-1, overflow-y-auto)
      ├── Topbar (sticky, h-16)
      └── Page content (p-6 or p-8)
```

### Interview Session Layout
Full-height chat layout — no standard page padding. Mirrors a messaging interface.

```
flex flex-col h-full
  ├── Message feed (flex-1, overflow-y-auto, p-6, space-y-6)
  └── Control bar (fixed bottom, bg-slate-900, border-t)
      └── MicButton + status text
```

### Report Page Layout
Standard content page with max-width container.

```
max-w-4xl mx-auto px-4 py-8
  ├── Header (session metadata)
  ├── Overall score card
  ├── Dimension scores grid (grid-cols-2 md:grid-cols-4)
  ├── Suggestions list
  ├── Summary paragraph
  └── Collapsible transcript
```

---

## Component Authoring Conventions

### Naming
- Use `PascalCase` for all components.
- Feature-scoped components live in `components/features/{feature}/`.
- Shared/cross-feature components live in `components/shared/`.
- shadcn/ui primitives live in `components/ui/` (never edit these).

### Props
- Prefer explicit prop interfaces over `React.HTMLAttributes` spreading unless building a generic wrapper.
- Use `cn()` from `lib/utils.ts` (re-exported from `clsx` + `tailwind-merge`) to merge class names conditionally.

```typescript
import { cn } from "@/lib/utils"

interface Props {
  className?: string
  isActive?: boolean
}

export function MyComponent({ className, isActive }: Props) {
  return (
    <div className={cn("base-classes", isActive && "active-classes", className)}>
      ...
    </div>
  )
}
```

### Client vs Server Components
- Default to **Server Components** — no `"use client"` directive unless the component uses hooks, event handlers, browser APIs, or Zustand.
- Components that use `useState`, `useEffect`, `useRef`, MediaRecorder, Audio API, or Zustand stores **must** be Client Components.
- Keep Client Component boundaries as deep in the tree as possible — wrap only the interactive part, not the whole page.

### Loading States
- Use `<Skeleton>` from `components/ui/skeleton` for content that is loading.
- Never render empty containers while loading — always show a skeleton or spinner.
- Use `isLoading` from React Query or local state; do not rely on undefined checks for loading indication.

### Error States
- All data-fetching components must handle error states explicitly — do not silently fail.
- Show a card with a brief message and a retry action where appropriate.

---

## Responsive Design

| Breakpoint | Usage |
|---|---|
| `sm` (640px) | Not commonly used — most mobile breakpoints are at `md` |
| `md` (768px) | Tablet+ layout switch: show sidebar, multi-column grids |
| `lg` (1024px) | Desktop-optimized layouts: wider containers, more columns |

- **Mobile first:** Write base classes for mobile, then override with `md:` and `lg:` prefixes.
- **Sidebar:** Hidden on mobile, visible fixed on `md+`. Mobile navigation uses a sheet/drawer.
- **Feature grids:** `grid-cols-1` on mobile, `grid-cols-2` on `md`, `grid-cols-4` on `lg` where appropriate.

---

## Accessibility

- All interactive elements must be keyboard-navigable (shadcn/ui + Radix handles this for primitives).
- All images must have meaningful `alt` text or `alt=""` if decorative.
- Color alone must never convey information — score colors are always paired with a numeric label.
- Focus rings must be visible — do not use `outline-none` without providing a custom focus style.
- The mic button must have an accessible label that changes with recording state (`aria-label="Start recording"` / `"Stop recording"`).
