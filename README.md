# Growth Grid

Marketing, catering, and community-event tracker for Chick-fil-A Northgate and
North Academy. Built as a React single-page app and published with GitHub Pages.

**Live site:** https://cfanorthcos.github.io/marketing/

## How data is stored

The app originally ran inside Claude's artifact runtime, which gave it a shared
server-backed `window.storage` API. GitHub Pages serves static files only — there
is no server — so `src/storage.js` reimplements that API on top of the browser's
`localStorage`.

That means:

- Edits are saved **per browser, per device**. Nothing syncs between teammates.
- Clearing site data for `cfanorthcos.github.io` wipes the saved events.
- `localStorage` caps out around 5 MB, and event photos are stored as inline
  data URLs, so a few dozen photos can fill it.
- **The published page is public.** Anyone with the URL can read the seed sales
  figures and notes committed in `src/GrowthGrid.jsx`.

If the team needs one shared, private copy of the data, this needs a backend
(Supabase, Firebase, a Google Sheet via Apps Script) or a private host — that's a
follow-up, not something GitHub Pages can do on its own.

## Local development

```bash
npm install
npm run dev      # http://localhost:5173/
npm run build    # production build into dist/
npm run preview  # serve the built site at /marketing/
```

## Deploying

`.github/workflows/deploy.yml` builds the site and publishes it on every push to
`main`, and can also be run manually from the Actions tab.

One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions.**

This setting is required, and the workflow cannot set it for you — the default
`GITHUB_TOKEN` isn't allowed to create a Pages site. If the source is left on
**Deploy from a branch**, GitHub ignores this workflow's build and serves the
repo root as-is. The root `index.html` points at `/src/main.jsx` (raw JSX, which
no browser can execute), so the published page comes up blank.

## Layout

| Path | What it is |
| --- | --- |
| `src/GrowthGrid.jsx` | The app — events, calendar, charts, annual plan, seed data |
| `src/storage.js` | `window.storage` shim over `localStorage` |
| `src/main.jsx` | React entry point; installs the shim before mounting |
| `vite.config.js` | Sets `base: "/marketing/"` for production builds |
