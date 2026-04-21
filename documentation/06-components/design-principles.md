# Design Principles

## Design Philosophy

The AI Interview Simulator visual language is built around a single concept: **"Midnight Focus."** The app is a practice arena — you are about to simulate a high-stakes interview. The design should make you feel focused, prepared, and in control. It should feel premium without being flashy, and immersive without being distracting.

**Competitive differentiation:** Most interview prep tools (Final Round AI, Interviews by AI, Prepin) use light themes with generic blue/teal SaaS palettes. We default to dark, use violet/indigo as our signature accent, and invest in typography — making the product immediately visually distinct.

---

## Component Library

The UI is built on **shadcn/ui** — components are generated into `frontend/src/components/ui/` and owned by the repo. They are not imported from an external package.

**Adding components:**

```bash
cd frontend
npx shadcn@latest add <component-name>
# e.g. npx shadcn@latest add button card badge dialog select skeleton
```

**Rule:** Never manually edit files in `components/ui/`. If a primitive needs customization, wrap it in a component in `components/features/` or `components/shared/`. Do not modify generated shadcn/ui base files.

---

## Typography

### Fonts

| Font | Role | Source |
|---|---|---|
| **Plus Jakarta Sans** | Display / landing page headings | Google Fonts via `next/font/google` |
| **Geist Sans** | UI body, labels, navigation, form text | `next/font/geist` (bundled with Next.js) |
| **Geist Mono** | Code snippets, transcripts, technical content | `next/font/geist` (bundled with Next.js) |

### Font Setup (`frontend/src/app/layout.tsx`)

```typescript
import { Plus_Jakarta_Sans } from 'next/font/google'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800'],
})
```

Apply variables to `<html>`:

```tsx
<html className={`${GeistSans.variable} ${GeistMono.variable} ${plusJakarta.variable}`}>
```

### Type Scale

| Use | Class | Notes |
|---|---|---|
| Landing hero headline | `font-display text-5xl md:text-7xl font-extrabold` | Plus Jakarta Sans |
| Landing section headline | `font-display text-3xl md:text-4xl font-bold` | Plus Jakarta Sans |
| Page title (app) | `text-2xl font-semibold` | Geist Sans |
| Section header | `text-lg font-semibold` | Geist Sans |
| Body | `text-sm` or `text-base` | Geist Sans |
| Caption / label | `text-xs text-muted-foreground` | Geist Sans |
| Code / transcript | `font-mono text-sm` | Geist Mono |

`font-display` maps to `var(--font-display)` in `tailwind.config.ts`:

```typescript
theme: {
  extend: {
    fontFamily: {
      display: ['var(--font-display)', 'sans-serif'],
    }
  }
}
```

---

## Color System

### Overview

The color system is defined as CSS custom properties in `globals.css` using the shadcn/ui convention. Tailwind utility classes (`bg-background`, `text-foreground`, etc.) reference these variables. Two complete themes are defined — dark (default) and light — toggled by the `dark` class on `<html>`.

**Theme management:** Use `next-themes` (`npm install next-themes`) wrapped in a `ThemeProvider` at the root layout. This handles SSR-safe theme switching, system preference detection, and localStorage persistence.

### Dark Theme (Default) — "Midnight Focus"

The dark theme is the primary experience. It defaults for all users until they opt into light.

| Variable | Tailwind Class | Hex | Usage |
|---|---|---|---|
| `--background` | `bg-background` | `#09090b` (zinc-950) | Page background |
| `--card` | `bg-card` | `#18181b` (zinc-900) | Cards, panels, sheets |
| `--card-elevated` | `bg-card-elevated` | `#27272a` (zinc-800) | Dropdowns, tooltips, popovers |
| `--border` | `border-border` | `#3f3f46` (zinc-700) | All borders and dividers |
| `--foreground` | `text-foreground` | `#fafafa` (zinc-50) | Primary text |
| `--muted-foreground` | `text-muted-foreground` | `#a1a1aa` (zinc-400) | Labels, hints, captions |
| `--primary` | `bg-primary` | `#7c3aed` (violet-600) | Primary buttons, key UI |
| `--primary-foreground` | `text-primary-foreground` | `#fafafa` | Text on primary bg |
| `--accent-gradient` | (inline style) | `violet-600 → indigo-500` | Landing CTAs, hero elements |
| `--ring` | `ring-ring` | `#7c3aed` (violet-600) | Focus rings |
| `--input` | `bg-input` | `#27272a` (zinc-800) | Form input backgrounds |
| `--muted` | `bg-muted` | `#27272a` (zinc-800) | Muted backgrounds |

#### Dark Theme `globals.css`

```css
.dark {
  --background: 240 5.9% 3.9%;       /* zinc-950 */
  --foreground: 0 0% 98%;             /* zinc-50 */
  --card: 240 3.7% 10.9%;            /* zinc-900 */
  --card-foreground: 0 0% 98%;
  --popover: 240 3.7% 10.9%;
  --popover-foreground: 0 0% 98%;
  --primary: 263.4 70% 50.4%;        /* violet-600 */
  --primary-foreground: 0 0% 98%;
  --secondary: 240 3.7% 15.9%;       /* zinc-800 */
  --secondary-foreground: 0 0% 98%;
  --muted: 240 3.7% 15.9%;           /* zinc-800 */
  --muted-foreground: 240 5% 64.9%;  /* zinc-400 */
  --accent: 263.4 70% 50.4%;         /* violet-600 */
  --accent-foreground: 0 0% 98%;
  --destructive: 0 72.2% 50.6%;      /* rose-500 */
  --destructive-foreground: 0 0% 98%;
  --border: 240 3.7% 25%;            /* zinc-700 */
  --input: 240 3.7% 15.9%;           /* zinc-800 */
  --ring: 263.4 70% 50.4%;           /* violet-600 */
}
```

---

### Light Theme — "Open Studio"

The light theme is offered as an optional preference. It keeps the same violet/indigo accent but shifts surfaces to clean white/zinc-50.

| Variable | Tailwind Class | Hex | Usage |
|---|---|---|---|
| `--background` | `bg-background` | `#fafafa` (zinc-50) | Page background |
| `--card` | `bg-card` | `#ffffff` (white) | Cards, panels |
| `--card-elevated` | `bg-card-elevated` | `#f4f4f5` (zinc-100) | Nested surfaces |
| `--border` | `border-border` | `#e4e4e7` (zinc-200) | Borders, dividers |
| `--foreground` | `text-foreground` | `#18181b` (zinc-900) | Primary text |
| `--muted-foreground` | `text-muted-foreground` | `#71717a` (zinc-500) | Labels, hints |
| `--primary` | `bg-primary` | `#7c3aed` (violet-600) | Primary buttons |
| `--primary-foreground` | `text-primary-foreground` | `#ffffff` | Text on primary |
| `--ring` | `ring-ring` | `#7c3aed` (violet-600) | Focus rings |
| `--input` | `bg-input` | `#ffffff` | Form input backgrounds |

#### Light Theme `globals.css`

```css
:root {
  --background: 0 0% 98%;            /* zinc-50 */
  --foreground: 240 5.9% 10%;        /* zinc-900 */
  --card: 0 0% 100%;                 /* white */
  --card-foreground: 240 5.9% 10%;
  --popover: 0 0% 100%;
  --popover-foreground: 240 5.9% 10%;
  --primary: 263.4 70% 50.4%;        /* violet-600 */
  --primary-foreground: 0 0% 100%;
  --secondary: 240 4.8% 95.9%;       /* zinc-100 */
  --secondary-foreground: 240 5.9% 10%;
  --muted: 240 4.8% 95.9%;           /* zinc-100 */
  --muted-foreground: 240 3.8% 45%;  /* zinc-500 */
  --accent: 263.4 70% 50.4%;
  --accent-foreground: 0 0% 100%;
  --destructive: 0 72.2% 50.6%;      /* rose-500 */
  --destructive-foreground: 0 0% 100%;
  --border: 240 5.9% 90%;            /* zinc-200 */
  --input: 0 0% 100%;
  --ring: 263.4 70% 50.4%;           /* violet-600 */
}
```

---

### Semantic / Functional Colors

These are fixed across both themes — do not theme these with variables.

| Purpose | Color | Class | Hex |
|---|---|---|---|
| Recording active (mic button) | Rose | `bg-rose-500` | `#f43f5e` |
| Recording pulse/glow | Rose | `shadow-rose-500/60` | — |
| Score: high (8–10) | Emerald | `text-emerald-500` | `#10b981` |
| Score: mid (5–7) | Amber | `text-amber-400` | `#fbbf24` |
| Score: low (1–4) | Rose | `text-rose-500` | `#f43f5e` |
| Success / confirmation | Emerald | `text-emerald-500` | `#10b981` |
| Warning | Amber | `text-amber-400` | `#fbbf24` |
| Error / destructive | Rose | `text-rose-500` | `#f43f5e` |

---

### Accent Gradient

The signature gradient is used on primary CTAs and hero elements. Use as an inline Tailwind class group:

```tsx
// Primary CTA button
<button className="bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 text-white font-semibold ...">

// Hero headline gradient text
<h1 className="bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent ...">
```

---

## Theme Toggle Implementation

### Package

```bash
cd frontend
npm install next-themes
```

### ThemeProvider (`components/providers/ThemeProvider.tsx`)

```tsx
'use client'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}
```

Mount in `app/layout.tsx` wrapping the app:

```tsx
<ThemeProvider>
  {children}
</ThemeProvider>
```

### Theme Toggle Component (`components/shared/ThemeToggle.tsx`)

```tsx
'use client'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label="Toggle theme"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  )
}
```

Place `<ThemeToggle />` in the `Topbar` (authenticated shell) and `LandingNav` (landing page).

Store the user's preference in Supabase `profiles` (optional, post-MVP) so it persists across devices. For MVP, `next-themes` localStorage persistence is sufficient.

---

## Micro-Details & Visual Touches

These details elevate the design from "functional" to "premium":

### Landing Page Hero
- Subtle radial gradient behind the hero text: violet at ~8% opacity, centered behind the headline
- Example: `bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(124,58,237,0.08),transparent)]`

### Cards (Dark Mode)
- Thin top-edge highlight to simulate depth: `border-t border-t-zinc-700`
- No heavy shadows — use border + background contrast instead

### Mic Button States
- Idle: `bg-violet-600 hover:bg-violet-500 shadow-lg shadow-violet-500/20`
- Recording: `bg-rose-500 scale-110 shadow-[0_0_40px_rgba(244,63,94,0.6)]`
- Loading: `opacity-50 cursor-not-allowed`
- Recording pulse: `animate-ping` ring in `rose-400` at 75% opacity

### Focus Rings
- All interactive elements use `ring-violet-600` on focus — consistent with `--ring` token
- Never suppress focus rings without providing an equivalent visible focus indicator

### Animations
- Page transitions: `animate-in fade-in duration-300`
- Skeleton loading: standard shadcn/ui `<Skeleton>` (zinc-800 shimmer in dark, zinc-200 in light)
- Mic button recording indicator: `animate-ping` + `animate-pulse` layered glow

---

## Layout Patterns

### Auth Layout (`(auth)/layout.tsx`)
Centered column, no sidebar, no topbar.

```
min-h-screen bg-background flex flex-col items-center justify-center px-4
  └── Card (max-w-md w-full p-8 border border-border rounded-2xl)
      ├── BrandLogo (centered, mb-6)
      ├── Page headline (text-xl font-semibold text-foreground)
      └── Form content
```

### App Shell (Authenticated)
Fixed sidebar on desktop, topbar on all sizes.

```
flex h-screen overflow-hidden bg-background
  ├── Sidebar (fixed w-60, bg-card, border-r border-border — desktop only)
  └── Main area (flex-1 overflow-y-auto)
      ├── Topbar (sticky h-14, bg-card/80 backdrop-blur, border-b border-border)
      └── Page content (p-6 md:p-8)
```

### Interview Session Layout
Full-height chat — no standard page padding.

```
flex flex-col h-full bg-background
  ├── Message feed (flex-1, overflow-y-auto, p-6, space-y-6)
  └── Control bar (bg-card border-t border-border, p-6)
      └── MicButton (centered) + status text
```

### Report Page Layout
Standard content page with max-width container.

```
max-w-4xl mx-auto px-4 py-8 space-y-8
  ├── Header (session metadata)
  ├── Overall score card (bg-card border rounded-2xl p-6)
  ├── Dimension scores (grid grid-cols-2 md:grid-cols-4 gap-4)
  ├── Suggestions (bg-card border rounded-2xl p-6)
  ├── Summary paragraph (bg-card border rounded-2xl p-6)
  └── Collapsible transcript
```

---

## Component Authoring Conventions

### Naming
- `PascalCase` for all components.
- Feature-scoped: `components/features/{feature}/ComponentName.tsx`
- Shared/cross-feature: `components/shared/ComponentName.tsx`
- shadcn/ui primitives: `components/ui/` — never edit these manually.

### Class Merging

Always use `cn()` from `lib/utils.ts` for conditional class names:

```typescript
import { cn } from "@/lib/utils"

export function Card({ className, isActive }: { className?: string; isActive?: boolean }) {
  return (
    <div className={cn(
      "rounded-2xl border border-border bg-card p-6",
      isActive && "border-violet-500 shadow-md shadow-violet-500/10",
      className
    )}>
```

### Client vs Server Components
- Default to **Server Components** unless the component uses hooks, event handlers, browser APIs, or Zustand.
- Components using `useState`, `useEffect`, `useRef`, MediaRecorder, Audio API, `useTheme`, or Zustand must be Client Components (`"use client"`).
- Push Client Component boundaries as deep in the tree as possible.

### Loading & Error States
- Use `<Skeleton>` for content that is loading — never leave empty containers.
- All data-fetching components must handle error states explicitly with a visible message and retry action.
- Never use `undefined` checks alone as loading indicators — use explicit `isLoading` booleans.

---

## Responsive Design

| Breakpoint | px | Usage |
|---|---|---|
| `sm` | 640px | Rarely used |
| `md` | 768px | Show sidebar; 2-column grids; most layout switches |
| `lg` | 1024px | 4-column grids; expanded containers |

- **Mobile first.** Base classes are mobile; override with `md:` and `lg:`.
- **Sidebar:** Hidden on mobile (replaced by sheet drawer), fixed on `md+`.
- **Feature grids:** `grid-cols-1` → `md:grid-cols-2` → `lg:grid-cols-4`.

---

## Accessibility

- All interactive elements must be keyboard-navigable — shadcn/ui + Radix handle this for primitives.
- All images use meaningful `alt` text, or `alt=""` if purely decorative.
- Color is never the sole conveyor of information — score colors are always paired with a numeric label.
- Focus rings must always be visible — do not use `outline-none` without a custom visible focus style.
- The mic button must update `aria-label` with recording state: `"Start recording"` / `"Stop recording"`.
- Theme toggle must have `aria-label="Toggle theme"`.
- Contrast ratios: primary text on dark background meets WCAG AA (4.5:1 minimum). Verify with a contrast checker when introducing new color combinations.
