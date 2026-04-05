# Feature: Landing Page

## Purpose

The public entry point to the app. The landing page introduces the AI Interview Simulator to unauthenticated visitors, communicates the core value proposition, and funnels users into sign-up or sign-in. It is the first impression of the product and should be visually polished.

**Users:** All (unauthenticated and authenticated)

---

## Routes

| URL | Page | Auth required |
|-----|------|--------------|
| `/` | Landing page — hero, features, CTA | No |

Authenticated users visiting `/` are not redirected. They can still see the landing page and navigate to `/dashboard` via the nav.

---

## Page Sections

### 1. Navbar
- Brand logo (left)
- Navigation links: "Features", "How it works" (anchor links on the same page)
- CTA buttons: "Sign in" (ghost) and "Get started" (primary) — link to `/login` and `/signup`
- On mobile: hamburger menu or simplified CTA only

### 2. Hero Section
- Headline: Clear, benefit-driven. E.g. "Ace your next interview with AI-powered practice."
- Subheadline: One sentence expanding on the product. E.g. "Practice with a realistic AI interviewer that listens, responds, and gives you a comprehensive debrief — so you walk into every interview confident."
- Primary CTA: "Start practicing — it's free" → `/signup`
- Secondary CTA: "See how it works" → anchor to #how-it-works
- Visual: Mockup or illustration of the interview UI (the mic button, transcript feed)

### 3. How It Works
- Three-step visual flow:
  1. **Configure** — Choose your job role and interview type
  2. **Practice** — Speak your answers to AI follow-up questions
  3. **Improve** — Review your detailed feedback report
- Keep this section extremely visual and minimal in text

### 4. Feature Highlights
- Grid of 4–6 feature cards:
  - "Voice-first interview" — speak naturally, just like a real interview
  - "Intelligent follow-ups" — the AI probes deeper based on your answers
  - "No mid-session scores" — stay in the zone; feedback comes after
  - "Comprehensive debrief" — scores across clarity, structure, relevance, confidence
  - "Works for any role" — software engineering, data science, product, and more
  - (Future) "Video interview mode" — practice with your camera on

### 5. Footer
- Brand logo
- Links: Privacy Policy, Terms of Service, GitHub (if open source)
- Copyright

---

## Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `LandingHero` | `components/marketing/` | Hero section with headline, subheadline, CTAs, and visual |
| `HowItWorks` | `components/marketing/` | Three-step process illustration |
| `FeatureGrid` | `components/marketing/` | Grid of feature highlight cards |
| `LandingNav` | `components/marketing/` | Top navigation bar for landing page |
| `BrandLogo` | `components/shared/` | Theme-aware logo |

---

## Design Notes

- The landing page has its own visual language — it does not use the authenticated `AppShell` (no sidebar, no topbar).
- Dark background (`slate-900`) consistent with the existing prototype's aesthetic.
- Gradient accents (teal-to-blue) for CTAs and highlight elements — matches the existing UI.
- The hero section should feel alive: consider a subtle animated gradient or a glowing mic icon to hint at the voice-first nature of the product.
- All CTAs above the fold should be immediately visible without scrolling on a 1080p screen.

---

## State

No server data fetching needed on the landing page. It is fully static. No auth state is required for rendering.

---

## Key Edge Cases

- **Authenticated user on `/`:** Show the landing page as-is. The navbar should show "Go to dashboard" instead of "Get started" if the user is signed in. This requires reading the Supabase session client-side.
- **Slow network:** All images and visuals should have explicit width/height to prevent layout shift. Use Next.js `<Image>` for any bitmap assets.
- **Mobile:** The hero CTA must be reachable without scrolling on a 375px viewport. Feature grid collapses to single column on mobile.
