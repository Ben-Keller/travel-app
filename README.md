# Wander

Design and prototype work for **Wander** — a trip planner where you plan by
picking pictures.

| Path | What it is |
| --- | --- |
| `wander-prototype/` | The interactive prototype (Sri Lanka, Aug 2024). This folder is what gets published. |
| `Sri Lanka Moodboard (Canva)/` | Source photos exported from the Canva moodboard, with placement metadata. The prototype uses its own resized copies. |
| `skein-tokens.css` | Skein design tokens (same file as `wander-prototype/src/skein-tokens.css`). |

## Live site

https://ben-keller.github.io/travel-app/

Published by `.github/workflows/pages.yml`, which uploads `wander-prototype/`
as the site root on every push to `main` that touches it. **Settings → Pages →
Source must be set to "GitHub Actions"** (not "Deploy from a branch") or the
workflow will fail at the deploy step.

See `wander-prototype/README.md` for the flow, the build, and an honest account
of what the prototype actually computes.
