# Level Up Society

Marketing site for the Level Up Society paid community (Next.js + React).

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19**
- **TypeScript** (strict) + **Tailwind CSS v4**
- **motion** — scroll reveals, spring hovers, parallax, animated counters
- **lenis** — smooth scrolling
- **lucide-react** — icons

## Run it

Node 22 is installed locally for you at `~/coding/.tools/node-v22.14.0-darwin-x64`.
Add it to your PATH (or paste this into `~/.zshrc`):

```sh
export PATH="$HOME/coding/.tools/node-v22.14.0-darwin-x64/bin:$PATH"
```

Then:

```sh
cd ~/coding/level-up-society
npm run dev     # http://localhost:3000
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint
```

> Note: `git` is not available on this Mac yet (Apple's Xcode Command Line Tools
> are missing). Run `xcode-select --install` in Terminal when you want git.

## Structure

```
src/
  app/
    layout.tsx      fonts + metadata
    page.tsx        section order
    globals.css     design tokens (colors, radii, keyframes)
  components/
    SmoothScroll.tsx  lenis wrapper
    Nav.tsx           sticky nav + mobile sheet + scroll progress bar
    Hero.tsx          headline, floating preview cards, ambient orbs
    Stats.tsx         animated stat counters
    Pillars.tsx       5 growth pillars (bento grid)
    Journey.tsx       3-step education path (sticky + scroll-linked rail)
    Philosophy.tsx    "for you / not for you"
    Pricing.tsx       $97/mo membership card
    Faq.tsx           animated accordion
    CallToAction.tsx  waitlist email capture
    Footer.tsx
    Reveal.tsx        scroll-reveal + stagger primitives
    ui.tsx            PillButton, SectionLabel, Wordmark
  lib/
    data.ts         all site copy in one place
```

## Editing content

Everything editable lives in `src/lib/data.ts` — nav links, pillars, journey
steps, membership features, FAQs, and stats. No need to touch components for
copy changes.

## Design system

Tokens are in `src/app/globals.css` under `@theme`:

| Token | Value |
| --- | --- |
| `--color-ink` | `#0b0b0c` |
| `--color-cream` | `#f7f4ed` |
| `--color-gold` | `#f7c548` |
| `--radius-card` | `2rem` |
| `--radius-card-lg` | `2.75rem` |
| `--radius-pill` | `999px` |

Radii are deliberately large — rounded, never sharp.

## Not built yet

Auth, payments, member area, and the community platform itself. This is the
marketing site only.
