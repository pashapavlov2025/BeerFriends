# BeerFriends — Distribution Guide

Everything you need to submit the game to web game portals. Each platform has its own flow; this file keeps the quirks together so you don't have to re-google every time.

---

## 1. Produce the build

```bash
npm run build              # TS + Vite → dist/
npm run dist:zip           # zip dist/ → beerfriends-dist.zip (for itch.io, Y8, GameDistribution)
npm run preview            # local smoke-test of the production build
```

The build is **fully relative-path** (`base: './'` in vite.config) — the same bundle uploads to any platform.

Current bundle: ~80 KB gzip JS + ~5 KB gzip CSS + fonts=0 + sounds=0 → total payload under ~300 KB uncompressed. Well under every platform's limit.

---

## 2. Platform matrix

| Platform            | Review?      | SDK            | Ads real?      | Revenue split | Notes |
|---------------------|--------------|----------------|----------------|---------------|-------|
| **itch.io**         | No           | None           | Optional       | 0–30% you set | Easiest. Upload zip, pick category, go live. |
| **Y8**              | Light        | Y8 Games SDK   | Yes            | Rev-share     | Accepts zip. Form-based submission. |
| **GameDistribution**| Automated    | GD SDK (wired) | Yes            | Rev-share     | Needs real `VITE_GD_GAME_ID`. Gets picked up by 100s of sites. |
| **Poki**            | Manual QA    | Poki SDK (wired) | Yes          | Rev-share     | Apply for developer account first. 2–4 week review. |
| **CrazyGames**      | Manual QA    | Crazy SDK (wired) | Yes         | Rev-share     | Previously rejected — needs another polish pass + resubmit. |
| **Kongregate / Armor Games / Newgrounds** | Varies | None     | Platform's own | Varies | Backup channels — lower traffic but zero gatekeeping. |

Recommended order: **itch.io → GameDistribution → Y8 → Poki → CrazyGames (retry)**. First three are the path-of-least-resistance.

---

## 3. Per-platform submission

### 3.1 itch.io (do this first — no approval)

1. Sign up at [itch.io/register](https://itch.io/register).
2. **Dashboard → Create new project**.
3. Fill in:
   - **Title:** `BeerFriends: Brewery Tycoon`
   - **Project URL:** `beerfriends-brewery-tycoon` (becomes `<you>.itch.io/beerfriends-brewery-tycoon`)
   - **Short description:** *"Tap. Brew. Prestige. A free idle brewing game."*
   - **Classification:** Games
   - **Kind of project:** HTML
   - **Release status:** Released
   - **Pricing:** No payments (or "name your own price" with $0 minimum)
4. Upload `beerfriends-dist.zip`, tick **"This file will be played in the browser"**.
   - Embed options: Viewport 480×780 (mobile-friendly), tick **Mobile friendly**, tick **Fullscreen button**.
5. Cover image: upload `public/og-image.png` (1200×630 works fine — itch crops).
6. Tags: `idle`, `clicker`, `html5`, `mobile`, `tycoon`, `beer`, `brewery`, `incremental`
7. **Save & publish**.

Add analytics: itch.io has basic built-in; `@vercel/analytics` already runs and reports to your Vercel dashboard regardless of host.

### 3.2 GameDistribution (next-easiest)

1. Register at [gamedistribution.com](https://gamedistribution.com) as a developer.
2. Submit a new game → get a **Game ID** (UUID).
3. Set it locally:
   ```bash
   echo "VITE_GD_GAME_ID=<your-uuid>" > .env.production
   npm run build
   npm run dist:zip
   ```
4. Upload zip. Fill the submission form:
   - Category: **Clicker / Idle**
   - Orientation: **Portrait**
   - Mobile-friendly: **Yes**
   - Age rating: 7+ (beer imagery — their policy is that "brewery/tavern" themes are OK for 7+ since no drunkenness shown)
5. Platform auto-tests your SDK integration. We already wire `gameplayStart/Stop`, `midgame`, and `rewarded` ads — their QA bot should pass.

### 3.3 Y8

1. Register at [y8.com → Developer Portal](https://account.y8.com/).
2. New game → upload zip. Title + description + 2–3 screenshots.
3. Optional: integrate Y8 Games SDK for leaderboards (not wired — skip for first pass).

### 3.4 Poki

1. Apply at [developers.poki.com](https://developers.poki.com/). Approval takes a few days.
2. Once approved, get your game's **Poki SDK URL** (they inject a per-game ID via the SDK host).
3. Build once — our `pokiSDK.ts` adapter auto-loads their SDK when hostname matches `*.poki.com` / `*.poki-gdn.com` or `?platform=poki` is forced.
4. Upload zip via their dashboard. Manual QA 2–4 weeks.

### 3.5 CrazyGames (retry)

Previous rejection reasons: quality bar. Resubmit **after** getting traction on itch / GD, so we can link to proof of engagement.

1. Log in at [developer.crazygames.com](https://developer.crazygames.com).
2. Update the existing submission (don't create a new one — they prefer iterations).
3. Changelog in the submission form should highlight the polish since last round:
   - Daily bonus
   - Brewery Lore rewarded screen (ads-free fallback)
   - Confetti + screen shake + tavern scene
   - Proper og-image + meta tags
   - Analytics + multi-platform SDK auto-detection

---

## 4. Test locally on each platform (before submitting)

URL override forces a specific SDK path — great for pre-flight:

```
http://localhost:5173/?platform=crazy
http://localhost:5173/?platform=poki
http://localhost:5173/?platform=gd
```

With none of these query params set, the game falls back to the in-house "Brewery Lore" 5-second rewarded screen (no real ad network), so local dev is noise-free.

---

## 5. Marketing copy (reuse everywhere)

**Short (≤140 chars):**
> Tap. Brew. Prestige. A free idle brewing game — build your beer empire and unlock rare recipes.

**Medium (≤500 chars):**
> BeerFriends: Brewery Tycoon is a free HTML5 idle clicker. Tap to brew beer, buy upgrades, build brewery rooms, unlock 6 signature beers, craft custom recipes, and prestige for permanent bonuses. A cozy tavern with four regulars awaits at the bottom of every screen — watch out for the occasional dropped mug. Plays instantly in your browser, desktop or mobile, no install.

**Long (for portal descriptions, store pages):**
> Welcome to BeerFriends: Brewery Tycoon — a cozy, juicy idle clicker about running your own brewery.
>
> - 🍺 **Tap to brew** — every tap earns coins; upgrades and recipes compound the payout.
> - ⬆️ **14 upgrades** + 6 brewery rooms to build (barrel storage, ice cellar, hop garden, etc.).
> - 📖 **6 unlockable beers** plus a crafting system that blends any two recipes into a new one with +20% synergy.
> - 🏆 **Achievements & gems** — spend gems on permanent perks like Auto-Tap and Golden Skin.
> - ⭐ **Prestige** for permanent +10% earnings per level (keeps your collection, rooms, and gems).
> - 🎁 **Daily bonus** with streak rewards.
> - 🎨 **Juicy feedback** — confetti, screen shake, floating numbers, a live tavern scene with four seated patrons.
> - 💾 **Auto-save** — progress persists in your browser.
>
> Plays instantly in the browser on desktop or mobile. No install. No account.

**Tags / keywords:**
`idle, clicker, tycoon, incremental, brewery, beer, simulation, casual, html5, mobile-friendly, prestige, craft`

---

## 6. Required assets (all in `public/`)

| Asset          | Status | Size     | Notes |
|----------------|--------|----------|-------|
| `favicon.svg`  | ✅     | 9.3 KB   | |
| `og-image.svg` | ✅     | 2.1 KB   | source, editable |
| `og-image.png` | ✅     | 40 KB    | 1200×630, regenerate with `npm run gen:og` |
| `icons.svg`    | ✅     | 5 KB     | utility sprite |
| Screenshots    | ❌     | —        | **TODO**: 2–3 PNGs 720×1280 of actual gameplay |

Screenshots are optional for itch but required for GD / Poki / CG submissions. Use Chrome DevTools → device toolbar (iPhone 12) → Cmd+Shift+P → "capture full-size screenshot". Save under `public/screenshots/` — gitignored in bundle but uploaded separately to each platform.

---

## 7. Revenue tracking

We track custom events via `@vercel/analytics`:

- `session_start` — every load
- `tab_view` — each tab switch
- `lore_boost_requested` / `lore_boost_claimed`
- `lore_coins_requested` / `lore_coins_claimed`
- `platform_detected`, `sdk_ready`, `sdk_init_failed`
- `ad_rewarded_shown`, `ad_midgame_shown`

See Vercel Analytics dashboard (`vercel.com/<you>/beerfriends/analytics`) for engagement per source — you can filter by referrer to compare platforms.

---

## 8. Known items to polish (defer to v1.1)

- Real SFX (current synthesis is acceptable but not great). See commit history for the synthesis rabbit hole; best path is drop-in MP3s from Kenney.nl into `public/sounds/`.
- Background ambient loop (optional).
- Y8 Games SDK integration for leaderboards.
- Second CrazyGames resubmission after getting traction elsewhere.
