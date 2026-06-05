# Frontend Design Brief — Scaler AI Persona
## Premium Visual System

---

## The One Thing to Remember

Every design decision must communicate: **"This person engineers intelligence."**
Not a chatbot. Not a portfolio. An AI *system* with a face on it.
The UI should feel like walking into a mission control room — calm authority, real-time awareness, dark precision.

---

## Aesthetic Direction: **Dark Ops / Intelligent Terminal**

Think: Linear meets Vercel meets a Bloomberg terminal.
- Near-black backgrounds with controlled luminance
- Monospaced type for data, sharp sans-serif for display
- Accent color: a single electric tone (electric indigo `#6366F1` OR acid lime `#BFFF00` — pick ONE and never deviate)
- Motion that feels like live data, not decoration
- Zero stock illustrations. Zero gradients on white. Zero rounded-everything.

Reference energy: Raycast, Resend, Railway, Fig.io

---

## Typography System

```css
/* Display — for name, section titles, hero statements */
font-family: 'Instrument Serif', Georgia, serif;  /* editorial weight */

/* UI + Body — for descriptions, labels, nav */
font-family: 'Geist', 'DM Sans', sans-serif;

/* Code + Data — for repo names, latency numbers, eval metrics */
font-family: 'Geist Mono', 'JetBrains Mono', monospace;

/* Scale — strict 4pt baseline */
--text-xs:   11px;
--text-sm:   13px;
--text-base: 15px;
--text-lg:   18px;
--text-xl:   24px;
--text-2xl:  32px;
--text-3xl:  48px;
--text-4xl:  72px;
--text-hero: clamp(64px, 10vw, 120px);
```

---

## Color System

```css
:root {
  /* Backgrounds — layered depth */
  --bg-base:      #080810;   /* true near-black with blue tint */
  --bg-surface:   #0f0f1a;   /* card surfaces */
  --bg-elevated:  #16162a;   /* hover states, modals */
  --bg-border:    rgba(255,255,255,0.07);

  /* Text */
  --text-primary:   #f0f0ff;
  --text-secondary: rgba(240,240,255,0.55);
  --text-muted:     rgba(240,240,255,0.28);

  /* Accent — ONE color only, used sparingly */
  --accent:         #6366F1;   /* electric indigo */
  --accent-dim:     rgba(99,102,241,0.15);
  --accent-glow:    rgba(99,102,241,0.35);

  /* Semantic */
  --success: #22c55e;
  --warning: #f59e0b;
  --error:   #ef4444;

  /* Borders */
  --border:       rgba(255,255,255,0.07);
  --border-hover: rgba(255,255,255,0.14);
}
```

---

## Component Architecture

```
src/
├── components/
│   ├── ui/                    ← Primitive building blocks
│   │   ├── Badge.tsx          ← status pills, tags
│   │   ├── Button.tsx         ← primary, ghost, icon variants
│   │   ├── Card.tsx           ← surface container with border
│   │   ├── Divider.tsx        ← horizontal rule with optional label
│   │   ├── GlowDot.tsx        ← animated online/live indicator
│   │   ├── Tag.tsx            ← tech stack chips
│   │   └── TypingText.tsx     ← typewriter effect for hero
│   │
│   ├── chat/
│   │   ├── ChatWindow.tsx     ← main chat container
│   │   ├── MessageBubble.tsx  ← user vs AI message variants
│   │   ├── InputBar.tsx       ← text input + send button
│   │   ├── SourceCitation.tsx ← RAG source pill shown under AI reply
│   │   └── TypingIndicator.tsx← animated 3-dot loader
│   │
│   ├── booking/
│   │   ├── CalendarPicker.tsx ← availability grid
│   │   ├── SlotCard.tsx       ← individual time slot
│   │   └── ConfirmModal.tsx   ← booking confirmation overlay
│   │
│   ├── persona/
│   │   ├── HeroSection.tsx    ← name, role, tagline, CTA
│   │   ├── SkillsGrid.tsx     ← tech stack with proficiency
│   │   ├── ProjectCard.tsx    ← GitHub repo with RAG-powered details
│   │   └── EvalMetrics.tsx    ← live metrics: latency, accuracy
│   │
│   └── layout/
│       ├── Navbar.tsx
│       ├── PageWrapper.tsx
│       └── NoiseOverlay.tsx   ← subtle grain texture over entire page
│
├── pages/
│   ├── chat/
│   │   └── page.tsx           ← Public chat interface
│   ├── book/
│   │   └── page.tsx           ← Booking flow page
│   └── eval/
│       └── page.tsx           ← Evals report page (optional public)
│
└── app/
    └── page.tsx               ← Landing/hero page, imports all components
```

---

## Page-by-Page Design Rules

### Landing Page (`/`)

**Layout:** Full-screen hero. No above-the-fold scroll needed.

```
┌─────────────────────────────────────────────────┐
│  [navbar: name left — nav links right]           │
│                                                  │
│  MOHAMMED           ← hero display serif, huge   │
│  SHAAZ®             ← accent dot on the ®        │
│                                                  │
│  AI / Full-Stack Engineer                        │
│  ──────────────────────────                      │
│  Talk to my AI ↗    Book a call ↗                │
│                                                  │
│  ● Live  |  < 1.8s latency  |  RAG-grounded      │
└─────────────────────────────────────────────────┘
```

Rules:
- Background: `--bg-base` with a very subtle radial gradient bloom at bottom-left using `--accent-glow`
- Noise overlay at 3% opacity across the entire page (add grain texture)
- The name uses `Instrument Serif` at `clamp(72px, 12vw, 140px)`, weight 400
- "® Live" status badge: small pill with a pulsing green dot — this signals the AI is actually live
- CTA buttons: one filled (`--accent`), one ghost (`border: 1px solid --border`)
- Bottom strip: three metrics in monospace — latency / accuracy / model — like a status bar

---

### Chat Interface (`/chat`)

**Layout:** Two-column on desktop. Full-screen on mobile.

```
┌──────────────────┬──────────────────────────────┐
│  LEFT PANEL      │  CHAT AREA                   │
│  ─────────────   │  ──────────────────────────  │
│  About Shaaz     │  [message history]           │
│  Projects (3)    │                              │
│  Skills          │  [AI typing indicator]       │
│  Book a call     │                              │
│                  │  [source citations]          │
│  ─────────────   │                              │
│  ● Online        │  [input bar + send]          │
└──────────────────┴──────────────────────────────┘
```

Rules:
- Left panel: `--bg-surface`, 260px wide, fixed. Section headers in `--text-muted` caps
- Chat area: `--bg-base`. Messages have NO bubble borders — use background only
- **AI messages:** `--bg-elevated` background, left-aligned, max-width 80%
- **User messages:** `--accent-dim` background, right-aligned
- Under each AI message: small source citation pills in monospace — `[resume.pdf]` `[autoflow README]`
- Input bar: full-width, `--bg-surface` background, `1px solid --border`, sharp corners (no pill shape)
- Typing indicator: three dots that wave with CSS animation, color `--accent`
- Streaming text: characters appear one by one with a blinking cursor `|`

**MessageBubble design:**
```tsx
// AI message
<div className="message-ai">
  <div className="message-content">{text}</div>
  {sources.length > 0 && (
    <div className="sources">
      {sources.map(s => <span className="source-pill">{s}</span>)}
    </div>
  )}
</div>

// Styling:
// .message-ai: bg --bg-elevated, padding 14px 18px, border-left 2px solid --accent
// .source-pill: font-mono, font-size 11px, color --text-muted, border 1px solid --border
```

---

### Booking Page (`/book`)

**Layout:** Centered single-column. Clean and intentional.

Rules:
- Page header: "Schedule a call with Shaaz" in display serif
- Calendar grid: 7-column CSS grid, each day is a `40x40` square
  - Available: `--bg-elevated` with hover → `--accent-dim`
  - Selected: `--accent` background, white text
  - Unavailable: 30% opacity, no pointer events
- Time slots: horizontal scrollable row of pills below the calendar
- Confirm button: full-width, `--accent` background, 48px height
- After booking: replace form with a confirmation card:
  ```
  ✓ Confirmed
  Thursday, June 12 · 3:00 PM IST
  Calendar invite sent to your email
  ```

---

## Motion Rules

Only 4 animation types — use nothing else:

```css
/* 1. Fade-in stagger — for page load reveals */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
.stagger-1 { animation: fadeUp 0.5s ease 0.1s both; }
.stagger-2 { animation: fadeUp 0.5s ease 0.2s both; }
.stagger-3 { animation: fadeUp 0.5s ease 0.3s both; }

/* 2. Pulse — for the live indicator dot */
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
  50%       { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
}

/* 3. Typing dots — for chat loading state */
@keyframes wave {
  0%, 60%, 100% { transform: translateY(0); }
  30%            { transform: translateY(-6px); }
}

/* 4. Border shimmer — on card hover */
@keyframes shimmer {
  from { background-position: -200% center; }
  to   { background-position:  200% center; }
}
```

**No** bounce, no spin, no scale-up on hover (use opacity + border-color transitions instead).
Hover transitions: `transition: all 0.15s ease` — fast and crisp.

---

## What Makes This Stand Out

### 1. The "Live System" Signal
Add a top-of-page status bar (3px tall, full width):
```tsx
<div className="system-bar">
  <span>● Voice Agent: Live</span>
  <span>● Chat: Online</span>
  <span>Last response: 1.4s avg</span>
  <span>Powered by GPT-4o + RAG</span>
</div>
// Styling: bg #0d0d1f, text --text-muted, font-mono 11px, flex justify-between px-8 py-1.5
```
This signals immediately: this is not a demo. It's production.

### 2. RAG Source Citations in Chat
Every AI answer should show which document it came from:
```
"I worked at Springer Capital from Jan–Apr 2026..."
  [resume.pdf · line 12]  [linkedin.pdf]
```
This visually proves the system is grounded — exactly what the evaluator is looking for.

### 3. Eval Metrics on Landing Page
A small metrics strip below the hero:
```
1.4s avg latency   ·   94% task completion   ·   < 3% hallucination rate
```
Monospaced, small, muted. Like a Bloomberg terminal readout. This alone separates you from 900 of the 1000 applicants.

### 4. Noise Texture Overlay
```tsx
// NoiseOverlay.tsx — add to root layout
export function NoiseOverlay() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-50"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        opacity: 0.025,
        mixBlendMode: 'overlay',
      }}
    />
  )
}
```
Adds a subtle film grain that makes the whole UI feel crafted, not generated.

### 5. Project Cards with Live GitHub Data
```tsx
// ProjectCard — fetches README summary via your RAG backend
<div className="project-card">
  <div className="project-header">
    <span className="project-name font-mono">autoflow</span>
    <span className="project-tag">AI Engineering</span>
  </div>
  <p className="project-desc">{ragSummary}</p>
  <div className="project-stack">
    {stack.map(t => <span className="stack-chip">{t}</span>)}
  </div>
  <a href={githubUrl}>View repo ↗</a>
</div>

// .project-card: bg --bg-surface, border 1px solid --border,
//   padding 20px, hover border-color --border-hover
// .project-name: font-mono, color --accent
// .stack-chip: font-mono 11px, bg --accent-dim, color --accent, px-2 py-0.5 rounded-sm
```

---

## What NOT to Do

| ❌ Don't | ✅ Do instead |
|---|---|
| Purple gradient hero background | Near-black with subtle accent bloom |
| Rounded pill buttons everywhere | Sharp corners (`border-radius: 4px` max) |
| Card shadows (`box-shadow`) | Card borders (`border: 1px solid --border`) |
| Inter or Space Grotesk | Instrument Serif + Geist |
| Stock illustrations or Lottie animations | Real data, metrics, terminal-style UI |
| Loading spinners | Skeleton shimmer or typing dots |
| Centered everything | Left-aligned editorial layout |
| Gradient text on every heading | One heading with gradient max, rest plain |
| 12 different accent colors | One accent color used in ≤ 3 places per page |

---

## Spacing System

```css
/* All spacing is multiples of 4px */
--space-1:  4px;
--space-2:  8px;
--space-3:  12px;
--space-4:  16px;
--space-5:  20px;
--space-6:  24px;
--space-8:  32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;

/* Section padding */
--section-padding-x: clamp(24px, 5vw, 80px);
--section-padding-y: clamp(48px, 8vw, 120px);
```

Never use arbitrary values. Every padding and margin must be a multiple of 4.

---

## The Evaluator's Eye Test

When Scaler opens your URL, in the first 3 seconds they should think:

1. **"This is live"** — the status bar and live indicators
2. **"This person knows design"** — the typography, spacing, and restraint
3. **"This is not a template"** — the noise texture, the editorial layout, the metric strip

That's the bar. Build to that bar.