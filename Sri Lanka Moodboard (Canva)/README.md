# Sri Lanka Moodboard — Canva export

Source: "Sri Lanka Moodboard - Photo Collage" on Canva, shared by Elif Su Duygun
https://www.canva.com/design/DAGJzeGfcyc/-zKMHiMCQ4EvDOZefnULLA/edit
Captured: 11 Sep 2026

## Contents
- `images/` — 68 unique media files (photos, watercolor graphics, stickers) used across the board's 4 pages.
- `metadata.json` — board info, per-page text, per-file details, and 99 placements (some images appear on more than one page).
- `metadata.csv` — the same placement table, one row per placement.

## Pages
1. Overall mood — photo collage, "SRI LANKA, AUGUST 2024"
2. Itinerary — Negombo, Kandy, Sigiriya, Ella, Yala, Mirissa, Galle, Colombo
3. Itinerary (continued) — reuses the same photo set as page 2
4. Map — illustrated map with watercolor stickers

## Filenames
`p<page>_<order>_<label-or-alt>_<media-id>.<ext>` — order is top-to-bottom,
left-to-right on the page where the image first appears.

## Metadata fields
- `page`, `page_title`, `order_on_page`
- `nearby_label` — nearest text on the board (usually the place name)
- `alt_text` — Canva's own description, where the element had one
- `pos_pct` — x / y / w / h as a percentage of the page box, origin top-left
- `width`, `height`, `bytes` — the exported file
- `media_id` — Canva's internal id for the asset

## Known limitation
Images were pulled at the largest rendition Canva's editor served (mostly
800–1600px on the long edge). 16 small decorative stickers on page 4 (map)
came through only at thumbnail size (30–150px) — Canva's editor stopped
serving new downloads before they could be re-fetched. Everything else,
including all photos, is full-size.
