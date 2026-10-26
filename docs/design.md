# ParkPilot AI — UI/UX Redesign & Bugfix Spec

This document is the single source of truth for the visual overhaul of
`app.py`. It exists because the previous attempt only touched surface CSS
(cars got a "vibrate" keyframe, nothing else changed) and **did not fix the
dark-mode input bug**. Every section below is written to be implemented
literally — code blocks are meant to be lifted close to verbatim, not
reinterpreted.

Give this whole file to the coding agent as context/spec. Do not summarize
it away — the root-cause section in particular has to be understood, not
skipped, or the date/time bug will resurface again.

---

## 0. Problems observed (as of this build)

1. **BUG — date/time inputs are unthemed in dark mode.** `Forecast date`
   and `Arrival time` render as bright white fields with barely-visible
   text, regardless of the dark/light toggle. This is the #1 priority fix.
2. **Animations are decorative, not systemic.** Only `.car` has a
   keyframe (`park`), and it just vibrates up/down 2px. Cards, bars,
   alerts, and spots pop in with no entrance motion. Nothing communicates
   *state change* (scan running → results arriving).
3. **No loading feedback.** `st.spinner(...)` is the only signal while
   `forecast()` runs — the lot grid, KPI cards, and forecast cards just
   sit blank/absent until data appears, then snap in all at once.
4. **Numbers snap instead of counting.** `.big` and `.pred-val` values
   (percentages) appear instantly with no count-up, so nothing reads as
   "live."
5. **Theme toggle is an abrupt flash**, not a transition.

---

## 1. ROOT CAUSE — the dark-mode input bug (fix this first)

### 1.1 What's actually happening

`.streamlit/config.toml` currently contains:

```toml
[theme]
base="light"
```

This is the problem. Streamlit's **native theme engine** (which controls
BaseWeb widgets — `st.date_input`, `st.selectbox`, and their popover/
calendar portals) is a *separate system* from the custom CSS injected via
`st.markdown(CSS, unsafe_allow_html=True)`. BaseWeb widgets pull their
colors from the theme object generated at the config level, and they
render some parts (calendar popovers, dropdown menus) into **portal
nodes appended near `<body>`**, outside `.stApp`. Custom CSS selectors
that only target elements inside the normal app tree can miss these
portals, and `:root` CSS variables can be overridden by BaseWeb's own
inline computed styles, which have higher effective priority.

In short: `config.toml` is hard-pinned to `light`, so Streamlit always
constructs these widgets with light-theme colors at the framework level.
The custom `THEME_CSS` block is fighting a battle it can only partially
win — it catches the outer input box in some cases but not the calendar
popover, the dropdown menu, or every internal span, which is exactly the
washed-out/white look in the screenshot.

### 1.2 The fix — two layers, both required

**Layer A — stop the framework-level conflict (required, do this first).**

Remove the hard-coded light theme from `config.toml` so Streamlit isn't
fighting the app's own dark/light toggle:

```toml
# .streamlit/config.toml
[theme]
base="dark"
primaryColor="#5ee7ff"
backgroundColor="#070b12"
secondaryBackgroundColor="#101722"
textColor="#f5f7fb"
font="sans serif"
```

Since the app already supports a runtime light mode via
`st.session_state.theme`, config.toml should match the **default**
(`st.session_state.theme = "dark"`), and the CSS overrides in
`THEME_VARS`/`THEME_CSS` are then only responsible for the *delta* when
the user switches to light — not for fighting the framework's base
styling on every render. This alone fixes the majority of the washed-out
input look because BaseWeb will now generate dark-appropriate widget
styles by default.

**Layer B — bulletproof CSS overrides that also catch portals (required, for the light-mode toggle case).**

Add these selectors to `THEME_CSS` — note the additions beyond what
exists today: unscoped portal selectors (not nested under `.stApp`), and
explicit rules for the calendar's day cells, header, and nav arrows,
which are the parts most commonly left light/unstyled.

```css
/* === Date & time input hardening (dark mode) === */

/* Input boxes themselves */
[data-testid="stDateInput"] input,
[data-testid="stDateInput"] > div,
[data-baseweb="input"],
[data-baseweb="input"] input,
[data-baseweb="select"] > div,
[data-baseweb="select"] [role="combobox"] {
    background: var(--theme-input-bg) !important;
    color: var(--theme-input-text) !important;
    -webkit-text-fill-color: var(--theme-input-text) !important;
    border: 1px solid var(--theme-line) !important;
    box-shadow: none !important;
}

/* Portal-rendered popovers/menus/calendars are appended near <body>,
   OUTSIDE .stApp — do not scope these under .stApp or a wrapper class. */
div[data-baseweb="popover"],
div[data-baseweb="menu"],
div[data-baseweb="calendar"],
div[data-baseweb="calendar"] > div {
    background: var(--theme-panel) !important;
    color: var(--theme-text) !important;
    border: 1px solid var(--theme-line) !important;
}

/* Calendar internals: month header, weekday row, day cells, nav arrows */
div[data-baseweb="calendar"] div[role="presentation"],
div[data-baseweb="calendar"] div[role="gridcell"],
div[data-baseweb="calendar"] div[role="columnheader"] {
    background: transparent !important;
    color: var(--theme-text) !important;
}
div[data-baseweb="calendar"] button {
    background: transparent !important;
    color: var(--theme-text) !important;
}
div[data-baseweb="calendar"] button[aria-selected="true"] {
    background: var(--cyan, #5ee7ff) !important;
    color: #071018 !important;
    font-weight: 700 !important;
}
div[data-baseweb="calendar"] svg {
    fill: var(--theme-muted) !important;
}

/* Dropdown menu list items (Arrival time selectbox) */
div[data-baseweb="menu"] li,
div[data-baseweb="menu"] li * {
    background: transparent !important;
    color: var(--theme-text) !important;
}
div[data-baseweb="menu"] li:hover,
div[data-baseweb="menu"] li[aria-selected="true"] {
    background: var(--theme-panel2) !important;
}

/* Placeholder text specifically */
[data-testid="stDateInput"] input::placeholder {
    color: var(--theme-muted) !important;
    -webkit-text-fill-color: var(--theme-muted) !important;
    opacity: 1 !important;
}
```

### 1.3 Verification checklist (do not mark this bug fixed until all pass)

- [ ] In dark mode, `Forecast date` field background is dark, text is
      light and legible against it (not gray-on-white).
- [ ] Clicking the date field opens a calendar popover that is also dark
      — including the month/year header, weekday labels, and every day
      cell (not just the outer frame).
- [ ] The selected day in the calendar is clearly highlighted (accent
      color background, dark text on it).
- [ ] `Arrival time` dropdown box is dark, and opening it shows a dark
      dropdown list with legible light text and a visible hover state.
- [ ] Toggling to light mode re-themes both controls correctly (no
      leftover dark artifacts).
- [ ] No flash of unstyled/light content when the date picker first opens
      in dark mode (this would indicate the portal isn't being caught —
      re-check Layer B selectors if it happens).

---

## 2. Design tokens (motion + visual)

Centralize these so every component below stays consistent. Add near the
top of the `CSS` block:

```css
:root {
    /* motion */
    --ease-premium: cubic-bezier(.16,1,.3,1);
    --dur-fast: 180ms;
    --dur-base: 420ms;
    --dur-slow: 700ms;
    --stagger-step: 45ms; /* per-item delay multiplier */
}

/* Respect reduced motion globally */
@media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
        animation-duration: 0.001ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.001ms !important;
    }
}

/* Smooth theme switch instead of a hard flash */
.stApp, .card, .lot-wrap, .pred, [data-testid="stSidebar"],
[data-testid="stDateInput"] input, [data-baseweb="select"] > div {
    transition: background-color var(--dur-base) var(--ease-premium),
                color var(--dur-base) var(--ease-premium),
                border-color var(--dur-base) var(--ease-premium) !important;
}
```

---

## 3. Component-by-component spec

### 3.1 Hero / logo / status badge

```css
.logo {
    position: relative;
    overflow: hidden;
}
.logo::after {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,.45) 50%, transparent 70%);
    transform: translateX(-100%);
    animation: logoSheen 3.2s ease-in-out infinite;
}
@keyframes logoSheen {
    0%, 60% { transform: translateX(-120%); }
    100% { transform: translateX(120%); }
}

.badge {
    opacity: 0;
    animation: badgeIn var(--dur-slow) var(--ease-premium) forwards;
    animation-delay: .15s;
}
@keyframes badgeIn {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
}

/* Radar ping instead of plain opacity pulse */
.dot { position: relative; }
.dot::before {
    content: '';
    position: absolute; inset: -6px;
    border-radius: 50%;
    border: 1.5px solid #58e391;
    animation: ping 1.8s var(--ease-premium) infinite;
}
@keyframes ping {
    0%   { transform: scale(.6); opacity: .8; }
    100% { transform: scale(2.2); opacity: 0; }
}
```

### 3.2 RUN PARKING SCAN button

```css
.stButton > button {
    position: relative;
    overflow: hidden;
    animation: idleGlow 2.6s ease-in-out infinite;
}
@keyframes idleGlow {
    0%, 100% { box-shadow: 0 10px 30px rgba(94,231,255,.15); }
    50%      { box-shadow: 0 10px 40px rgba(94,231,255,.35); }
}
.stButton > button:active {
    transform: translateY(0) scale(.97);
}
```
A true click-ripple needs a tiny JS snippet since Streamlit buttons are
plain `<button>` elements — inject once via `st.markdown` with
`unsafe_allow_html=True` near the button:

```html
<script>
(function() {
  const btn = window.parent.document.querySelector('.stButton > button');
  if (btn && !btn.dataset.rippleBound) {
    btn.dataset.rippleBound = "1";
    btn.addEventListener('click', function(e) {
      const r = document.createElement('span');
      r.style.cssText = `position:absolute;border-radius:50%;pointer-events:none;
        background:rgba(255,255,255,.5);transform:scale(0);
        animation:rippleAnim .6s ease-out;left:${e.offsetX}px;top:${e.offsetY}px;
        width:8px;height:8px;margin:-4px;`;
      btn.appendChild(r);
      setTimeout(() => r.remove(), 650);
    });
  }
})();
</script>
<style>@keyframes rippleAnim { to { transform: scale(18); opacity: 0; } }</style>
```

### 3.3 KPI cards — staggered entrance + count-up

**Important architectural note:** Streamlit re-renders the whole HTML
fragment on every run — there's no persistent DOM to animate "from." So
"staggered entrance" must be done via **CSS `animation-delay` per
`nth-child`**, applied fresh every render (this works fine and looks
identical to JS staggering). Count-up needs a small JS pass because the
value itself must be interpolated, not just faded in.

```css
.card {
    opacity: 0;
    animation: cardIn var(--dur-base) var(--ease-premium) forwards;
}
.card:nth-of-type(1) { animation-delay: calc(var(--stagger-step) * 1); }
.card:nth-of-type(2) { animation-delay: calc(var(--stagger-step) * 2); }
.card:nth-of-type(3) { animation-delay: calc(var(--stagger-step) * 3); }
.card:nth-of-type(4) { animation-delay: calc(var(--stagger-step) * 4); }
@keyframes cardIn {
    from { opacity: 0; transform: translateY(10px) scale(.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
}
.card:hover {
    transform: translateY(-3px);
    border-color: #344255;
    transition: transform var(--dur-fast) var(--ease-premium);
}
```

Count-up: give each `.big` element a `data-value` attribute holding the
raw target number (strip the `%`/`#` in the number itself, keep the
symbol as a separate span), then run this once per render:

```python
# in main(), when building the KPI cards, change e.g.:
#   f'<div class="big">{value}</div>'
# to carry a numeric data-value + a units suffix, e.g.:
#   f'<div class="big" data-value="{avg_avail:.1f}">0<span class="unit">%</span></div>'
```

```html
<script>
(function() {
  document.querySelectorAll('.big[data-value]').forEach(function(el) {
    const target = parseFloat(el.getAttribute('data-value'));
    const unit = el.querySelector('.unit') ? el.querySelector('.unit').outerHTML : '';
    const dur = 700, start = performance.now();
    function tick(now) {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.innerHTML = (target * eased).toFixed(1) + unit;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
})();
</script>
```
(For KPI values that are lot numbers like `#12` rather than percentages,
skip count-up and just use the card entrance animation — count-up only
makes sense for continuous metrics.)

### 3.4 Parking lot grid — the centerpiece

```css
.spot {
    opacity: 0;
    animation: spotIn var(--dur-base) var(--ease-premium) forwards;
}
/* Stagger by column position using nth-child across the 9-col grid */
.lot-grid .spot:nth-child(9n+1)  { animation-delay: calc(var(--stagger-step) * 1); }
.lot-grid .spot:nth-child(9n+2)  { animation-delay: calc(var(--stagger-step) * 2); }
.lot-grid .spot:nth-child(9n+3)  { animation-delay: calc(var(--stagger-step) * 3); }
.lot-grid .spot:nth-child(9n+4)  { animation-delay: calc(var(--stagger-step) * 4); }
.lot-grid .spot:nth-child(9n+5)  { animation-delay: calc(var(--stagger-step) * 5); }
.lot-grid .spot:nth-child(9n+6)  { animation-delay: calc(var(--stagger-step) * 6); }
.lot-grid .spot:nth-child(9n+7)  { animation-delay: calc(var(--stagger-step) * 7); }
.lot-grid .spot:nth-child(9n+8)  { animation-delay: calc(var(--stagger-step) * 8); }
.lot-grid .spot:nth-child(9n+9)  { animation-delay: calc(var(--stagger-step) * 9); }
@keyframes spotIn {
    from { opacity: 0; transform: scale(.85); }
    to   { opacity: 1; transform: scale(1); }
}

.spot:hover {
    z-index: 2;
    transform: scale(1.06);
    box-shadow: 0 0 0 1px var(--cyan), 0 6px 18px rgba(0,0,0,.4);
    transition: transform var(--dur-fast) var(--ease-premium);
}

/* Empty spot: breathing glow + gentle scale, stronger than current freeGlow */
.spot.empty {
    animation: spotIn var(--dur-base) var(--ease-premium) forwards,
               freeBreathe 2.4s ease-in-out .5s infinite;
}
@keyframes freeBreathe {
    0%, 100% { box-shadow: inset 0 0 0 1px rgba(53,216,121,.16), 0 0 8px rgba(53,216,121,.10); }
    50%      { box-shadow: inset 0 0 0 1px rgba(53,216,121,.35), 0 0 22px rgba(53,216,121,.22); }
}

/* Occupied spot: the car "drives in" as part of the entrance animation
   (this replaces per-transition diffing, which Streamlit's full-HTML
   rerender model can't support — every render is treated as "new
   arrivals settling into the lot") */
.spot.occupied .car {
    animation: driveIn var(--dur-slow) var(--ease-premium) backwards,
               idle 2.8s ease-in-out 1 var(--dur-slow) infinite alternate;
}
@keyframes driveIn {
    0%   { transform: translateX(-140%) scale(.9); opacity: 0; }
    70%  { transform: translateX(6%) scale(1.03); opacity: 1; }
    100% { transform: translateX(0) scale(1); opacity: 1; }
}
@keyframes idle {
    from { transform: translateY(1px); }
    to   { transform: translateY(-1.5px); }
}

/* Headlight glow pulse, replaces the plain static ::before */
.car::before {
    animation: headlight 1.6s ease-in-out infinite;
}
@keyframes headlight {
    0%, 100% { box-shadow: 0 0 4px 1px rgba(191,247,255,.5); }
    50%      { box-shadow: 0 0 9px 3px rgba(191,247,255,.9); }
}
```

Also add a tooltip-style hover label so spots feel interactive even
though they're not clickable yet:

```css
.spot::after {
    content: attr(data-status);
    position: absolute;
    bottom: -26px; left: 50%; transform: translateX(-50%) translateY(4px);
    background: #0b1019; color: #fff; font-size: 10px; padding: 3px 7px;
    border-radius: 6px; white-space: nowrap; opacity: 0; pointer-events: none;
    transition: opacity var(--dur-fast), transform var(--dur-fast);
    z-index: 3;
}
.spot:hover::after { opacity: 1; transform: translateX(-50%) translateY(0); }
```
Requires adding `data-status="Spot 07 · Free"` / `"Spot 07 · Occupied"`
to each `.spot` div in `parking_lot_html()`.

### 3.5 Forecast radar cards

```css
.bar > span {
    width: 0% !important; /* start collapsed */
    animation: fillBar var(--dur-slow) var(--ease-premium) forwards;
    animation-delay: .3s;
}
@keyframes fillBar {
    to { width: var(--target-width, 0%); }
}
```
In Python, when rendering each `.bar > span`, set both the inline
`width` (fallback) **and** a CSS variable so the keyframe can animate to
it:
```python
f'<div class="bar"><span style="--target-width:{val}%; width:{val}%"></span></div>'
```

```css
.pred { opacity: 0; animation: cardIn var(--dur-base) var(--ease-premium) forwards; }
.pred:nth-of-type(1){animation-delay:calc(var(--stagger-step)*1)}
.pred:nth-of-type(2){animation-delay:calc(var(--stagger-step)*2)}
.pred:nth-of-type(3){animation-delay:calc(var(--stagger-step)*3)}
.pred:nth-of-type(4){animation-delay:calc(var(--stagger-step)*4)}
.pred:nth-of-type(5){animation-delay:calc(var(--stagger-step)*5)}

.pred.tight { animation: cardIn var(--dur-base) var(--ease-premium) forwards, tightPulse 2s ease-in-out 1s infinite; }
@keyframes tightPulse {
    0%, 100% { border-color: var(--line); }
    50%      { border-color: var(--red); box-shadow: 0 0 16px rgba(255,100,124,.25); }
}
```
Add `class="pred tight"` in Python when `val < 25` for that checkpoint.

### 3.6 Alerts

```css
.alert {
    opacity: 0;
    animation: alertIn var(--dur-base) var(--ease-premium) forwards;
}
@keyframes alertIn {
    0%   { opacity: 0; transform: translateX(-16px); }
    70%  { opacity: 1; transform: translateX(4px); }
    100% { opacity: 1; transform: translateX(0); }
}
.alert span:first-child { display: inline-block; animation: iconPulse 1.8s ease-in-out infinite; }
@keyframes iconPulse {
    0%, 100% { transform: scale(1); }
    50%      { transform: scale(1.18); }
}
```

### 3.7 Map + chart cards

```css
.card:has(iframe), .card:has(img) {
    opacity: 0;
    animation: cardIn var(--dur-slow) var(--ease-premium) forwards;
}
.card img {
    animation: chartReveal 900ms var(--ease-premium) forwards;
}
@keyframes chartReveal {
    from { clip-path: inset(0 100% 0 0); }
    to   { clip-path: inset(0 0 0 0); }
}
```
(`:has()` is supported in current Chrome/Edge/Safari; if targeting older
browsers, add explicit wrapper divs with a class instead of relying on
`:has()`.)

### 3.8 Pre-scan / empty state

```css
.card .big:contains --- /* not valid selector, use structural approach below */
```
Instead, target the three step cards structurally and float them:
```css
[data-testid="column"] .card {
    animation: cardIn var(--dur-base) var(--ease-premium) forwards,
               floatIdle 4.5s ease-in-out 1s infinite alternate;
}
@keyframes floatIdle {
    from { transform: translateY(0); }
    to   { transform: translateY(-5px); }
}
```
Apply the same `.lot-grid .spot` stagger/breathe rules from §3.4 to the
demo grid — they already share the same classes, so no extra CSS is
needed there, just confirm `parking_lot_html(58, 1)` output isn't wrapped
in anything that suppresses the animation.

---

## 4. File-by-file change list

- **`.streamlit/config.toml`** — replace `[theme] base="light"` with the
  dark-default block in §1.2 Layer A.
- **`app.py` → `CSS` block** — add tokens (§2), hero/badge/button rules
  (§3.1–3.2), card/spot/pred/alert/map rules (§3.3–3.7).
- **`app.py` → `THEME_CSS` block** — add the hardened selectors from §1.2
  Layer B.
- **`app.py` → `parking_lot_html()`** — add `data-status="..."` attribute
  per spot (§3.4).
- **`app.py` → KPI card f-strings in `main()`** — switch `.big` values to
  `data-value="{raw_number}"` + inner unit span for count-up (§3.3).
- **`app.py` → forecast card loop in `main()`** — add
  `--target-width` CSS var to `.bar > span`, and conditionally add
  `tight` class when `val < 25` (§3.5).
- **`app.py`** — inject the ripple-button script (§3.2) and count-up
  script (§3.3) once via `st.markdown(..., unsafe_allow_html=True)`,
  placed after the sidebar button and after the KPI cards render
  respectively.

---

## 5. Acceptance criteria (definition of done)

- [ ] Dark-mode date/time bug checklist in §1.3 fully passes.
- [ ] Reloading the page (pre-scan state) shows the 3 step cards floating
      gently and the demo lot grid's spots animating in with stagger.
- [ ] Clicking **RUN PARKING SCAN** shows a visible click ripple and the
      button has a subtle idle glow beforehand.
- [ ] After a scan completes, the 4 KPI numbers visibly count up rather
      than appearing instantly.
- [ ] The 45-spot grid animates in with a noticeable stagger (not all at
      once), occupied spots show a car "driving in," and empty spots have
      a breathing glow distinct from occupied spots.
- [ ] Hovering any spot shows a small tooltip with its number and status.
- [ ] Forecast radar bars visibly fill from 0 to their value rather than
      appearing pre-filled; any card under 25% pulses red.
- [ ] The alert banner slides in with a slight overshoot, and its emoji
      icon pulses gently while visible.
- [ ] Toggling dark/light mode transitions smoothly (color/background
      fade) instead of flashing.
- [ ] With OS-level "reduce motion" enabled, all of the above becomes
      instant/static — nothing is broken or half-animated.
