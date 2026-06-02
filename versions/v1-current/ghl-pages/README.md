# Hosting the Newly Booked funnel on GoHighLevel

Three self-contained HTML files in this folder, one per funnel
step. Each one is a full page that loads the React app, CSS, fonts,
videos, and images from the GitHub Pages CDN at
`artzy22.github.io/newly-booked-funnel/`.

When you push a change to the GitHub repo, the GHL pages update
automatically. You only re-paste if you change the HTML files in
this folder.

## Setup, page by page

### 1. Landing page (`landing-page.html`)

1. GHL → Funnels → New Funnel → "Newly Booked".
2. Add a new funnel step called "Landing" with URL slug `/apply` (or whatever).
3. Open the page editor → delete every default element.
4. Add a single **Custom HTML / Code** element, full width.
5. Open `landing-page.html` in this folder, copy everything.
6. Paste into the Custom HTML element.
7. Before saving: find `[REPLACE_WITH_SCHEDULE_PAGE_URL]` and replace it with the URL of the schedule page you'll create next (e.g. `https://yourdomain.com/book`).
8. Save and publish.

### 2. Schedule page (`schedule-page.html`)

1. New funnel step → "Schedule" → URL slug `/book`.
2. Empty the canvas, add a Custom HTML element.
3. Paste the contents of `schedule-page.html`.
4. Replace:
   - `[REPLACE_WITH_CONFIRMED_PAGE_URL]` → confirmed page URL (next step)
   - `[REPLACE_WITH_LANDING_PAGE_URL]` → landing page URL
5. Save and publish.

### 3. Confirmed page (`confirmed-page.html`)

1. New funnel step → "Confirmed" → URL slug `/confirmed`.
2. Empty canvas, Custom HTML element.
3. Paste `confirmed-page.html`.
4. Replace `[REPLACE_WITH_LANDING_PAGE_URL]` with your landing page URL.
5. Save and publish.

### 4. Privacy Policy (`privacy-page.html`)

1. New funnel step → "Privacy Policy" → URL slug `/privacy`.
2. Empty canvas, Custom HTML element.
3. Paste `privacy-page.html`.
4. Replace all three placeholders:
   - `[REPLACE_WITH_LANDING_PAGE_URL]` → your landing page URL
   - `[REPLACE_WITH_PRIVACY_PAGE_URL]` → this page's URL
   - `[REPLACE_WITH_TERMS_PAGE_URL]` → the terms page URL
5. Save and publish.

### 5. Terms of Service (`terms-page.html`)

Same as Privacy — new funnel step, slug `/terms`, paste the file, replace the same three placeholders, publish. The legal text loads inline; styling pulls from the CDN.

## How the funnel hand-off works

```
Landing  ──submit qualifier──►  Schedule  ──pick time──►  Confirmed
```

- The qualifier on the landing page redirects to the schedule URL with the lead's `name`, `email`, `phone`, `city`, `revenue`, `treatment` as URL params.
- The schedule page reads those params, the user picks a slot, and clicking "Confirm appointment" forwards everything plus the chosen `slot` to the confirmed page.
- The confirmed page reads `name` and `slot` from the URL and personalizes the "You're locked in, [Name]" headline plus the date/time card.

You don't need to wire up forms or webhooks for the navigation itself — the URL params carry everything between pages.

## Connecting to GHL CRM

The above setup gets the funnel **live**, but it doesn't yet drop leads into your GHL CRM. To do that, you need to wire the qualifier's `submitContact` handler to POST to a GHL form webhook. That's a separate step — send me your GHL form/webhook info and I'll wire it.

## Why this approach (vs. uploading raw files to GHL)

GHL's page builder is element-based and doesn't host individual `.jsx` files cleanly. Loading the JSX from GitHub Pages keeps:

- **One source of truth** — edit the repo, GHL updates automatically.
- **Cheap iteration** — no re-paste loop when copy changes.
- **Full GHL control over URLs and analytics** — the page lives at your GHL domain even though the assets stream from GitHub.

If you ever want to move off GitHub Pages, just change the `<base href="…">` line in each HTML to point at the new host. Everything else stays the same.
