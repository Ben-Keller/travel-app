# Gander — prototype v0.1 (Sri Lanka, August 2024)

A trip planner where you plan by **picking pictures**. A photo you tap is a
geo-located, duration-bearing, seasonal, bookable constraint — and the same card
object flies from the gallery to your tray, into a day in the itinerary, down to
a pin on the map, and into the printed plan. It is never re-created or swapped
for a lookalike.

Built on **Skein**, the Gander design system.

## Run it

It's one standalone file. Open `index.html`, or serve the folder:

```bash
python3 -m http.server 8000   # then http://localhost:8000
```

## The flow

1. **Globe** — canvas globe with a pulsing Sri Lanka pin, six featured cards
   orbiting it, typeahead search, date range, party, feasibility line, Express lane.
2. **Board** — stylised Sri Lanka map with watercolour stickers and ghost pins,
   nine shelves, tap-to-add with fly-to-tray, tap-again for must-have, drag to the
   ribbon to peg a day, fisheye tray, capacity meter in days.
3. **Questions** — derived from detected conflicts (whale season, two coasts),
   pace, bases, budget as photo cards. "Just decide" on all of them.
4. **Options** — three theses (Classic Loop / Slow South / East in Season), cards
   flying from the tray into day columns, the route thread drawing itself with
   per-mode stitches, stat strip, Left-out shelf with reasons, Compare view.
5. **Refine** — drag cards between days, lock/drop per slot, reference chips into
   chat, remix strip priced on hover, undo on every edit.
6. **Export** — print page with route map and day list, booking checklist sorted
   by lead time, share link and phone mocks.

## Build

`index.html` is generated and **committed** — the deployed site is that one file
plus `assets/`. Edit the parts in `src/`, then:

```bash
src/build.sh
```

It inlines `skein-tokens.css` + `app.css` + `data.js` + `app.js` into
`index.src.html`, prepends `head.html`, and writes `index.html`.

| File | What it is |
| --- | --- |
| `src/head.html` | doctype, meta, social card tags, favicon links |
| `src/index.src.html` | page markup with `/*__CSS__*/`, `/*__DATA__*/`, `/*__APP__*/` slots |
| `src/skein-tokens.css` | Skein design tokens |
| `src/app.css` | component and view styles |
| `src/data.js` | entities, shelves, authored options, questions, warnings |
| `src/app.js` | card layer, views, planner rules, chat |
| `assets/` | photos and watercolour graphics |

## Deploying

This folder is the published site root. `.github/workflows/pages.yml` at the repo
root uploads it on every push to `main` that touches `gander-prototype/**`, so the
folder keeps its name and nothing else in the repo is served.

Repo setting: **Settings → Pages → Source → GitHub Actions**. Branch deploy won't
work here — it only offers repo root or `/docs`.

Live at https://ben-keller.github.io/travel-app/ — a project-page subpath. Every
path in `index.html` is relative, so that works unchanged. `.nojekyll` is kept for
the case where someone switches back to a branch deploy.

## What's real and what isn't

Genuinely computed at runtime: distances (haversine, 1.35 road factor), transit
hours, the capacity meter, the stat strip, the *Near what you've picked* shelf
(45 km radius, re-ranked on every add), and remix pricing (clones the plan,
applies the trial day, diffs the stats).

Not real: the three options are authored day-by-day in `data.js` and lightly
patched by the pace slider and your answers — there's no solver. The planner chat
is a ladder of ~26 regex intents with five canned FAQ answers. The generation
"stream" is a setTimeout typewriter. **There is no LLM and no network call
anywhere in the app.**

Also: desktop-first (mobile stacks, but drag is rough), only Sri Lanka is built,
and photos are moodboard placeholders reused across entities.

## Credits

Photos from the "Sri Lanka Moodboard" Canva board by Elif Su Duygun.
Type: Bricolage Grotesque, IBM Plex Sans, IBM Plex Mono.
