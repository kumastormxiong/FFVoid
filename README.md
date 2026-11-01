# FFVoid (虚空造物) - Artist Page

Official bilingual artist page for FFVoid / 虚空造物.

Live: [ffvoid.com](https://ffvoid.com) · [Spotify](https://open.spotify.com/artist/4697UO1twJkVreMzMQIFo0)

## Design

- **Void / Signal**: a near-black page with bone-coloured type. Album covers supply the colour.
- **Signal field**: the hero has a field of hairlines that breathe on their own and bend toward the pointer or finger.
- **Albums as an index**: hover (desktop) previews the cover. Click opens the Spotify player: beside the list on desktop, under the chosen row on mobile.
- **Type**: Cormorant Garamond for display, Noto Sans SC for Chinese and body text.
- **Responsive**: mobile-first, 16px gutter on phones, no horizontal scroll.
- **Accessibility**: visible focus, reduced motion respected, the signal field stays static under reduced motion.

## Files

- `index.html`: structure and metadata
- `style.css`: all styling
- `app.js`: bilingual copy, album index, preview and player logic
- `signal.js`: hero signal field (canvas)
- `albums.json`: discography, newest first is handled automatically
- `assets/covers/`: local cover images

## Adding an album

Add an entry to `albums.json` (copy an existing one). Fields: `id` (Spotify album ID), `title`, `titleZh`, `series` (`dreamy` or `gameon`), `releaseDate` (`YYYY-MM-DD`), `type`, `typeZh`, `trackCount`, `genre`, `genreZh`, `descriptionEn`, `descriptionZh`, `spotifyUrl`, `localCover` (path under `assets/covers/`), `coverUrl` (Spotify CDN fallback). The newest album is automatically featured in the hero.

## Local preview

The page loads `albums.json` with `fetch`, so open it through a local server rather than by double-clicking `index.html`. If the fetch fails, a built-in copy of the discography is used.

```bash
python -m http.server 8080
# or
npx serve .
```

Then visit `http://localhost:8080`.

## Deploy

Hosted on Cloudflare Pages. Headers are in `_headers`.

## /cube

`cube/` hosts the mini game 醒醒吧！方块 (Wake Up, Cubes!) at [ffvoid.com/cube](https://ffvoid.com/cube/). Source of truth: [WakeupCubes-VR](https://github.com/kumastormxiong/WakeupCubes-VR).

## /microcosm

`microcosm/` hosts 画境坍缩：千界之眸 (Microcosm Canvas), a cross-scale infinite-zoom puzzle game playable on desktop, phone and Quest (WebXR) at [ffvoid.com/microcosm](https://ffvoid.com/microcosm/). Static files, three.js r160, no build step. Design notes: `microcosm/DESIGN.md`.
