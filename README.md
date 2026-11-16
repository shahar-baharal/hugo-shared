# hugo-shared

One Hugo module with the code every Menashe Forge site shares. Which sites
use it: the roster in `menashe-forge/docs/PROJECT-OVERVIEW.md`. A site's own
files beat the module's, so a site that needs a variation keeps its own copy of
that one file.

## What's here

- **QR page** (`/qr/` on every site, in each of its languages).
  - `content/qr/index.<lang>.md` — the page. Hugo only builds the languages a
    site has, so an English-only site never gets the Hebrew page.
  - `layouts/_shortcodes/site-qr.html` — `{{< site-qr >}}` draws a QR code of
    the homepage with `images.QR`, at build time into `public/qr/`; nothing is
    committed. Same arguments as Hugo's built-in `qr` shortcode, which it
    doesn't replace.
  - `i18n/{en,he,fr}.yaml` — its labels. A new language needs a page and labels.
- **QR icon** — `assets/icons/qr-code.svg`, drawn before a footer menu
  entry with `params.icon = "qr-code"` (by Congo, and by the HugoBlox fork's
  footer).
- **Cloudflare Web Analytics** — `layouts/_partials/cloudflare-web-analytics.html`
  adds the beacon on production builds when the site sets
  `params.cloudflare_analytics_token`. Called before `</body>`: on HugoBlox
  sites from the fork's `hooks.body_end` list, from shahar-best's
  `extend-footer.html`.
- **Google Analytics lead tracking** — `layouts/_partials/ga-contact-clicks.html`
  sends a GA4 `contact_click` event on WhatsApp, `tel:` and `mailto:` clicks.
  Setup: "Google Analytics lead tracking" below.
- **Inquiry form email** — `assets/inquiry/`: a Cloudflare Worker that turns
  a site's form into an email to the owner (free, via Email Routing). Setup:
  "Inquiry form" below.
- **Sveltia CMS loader** — `static/admin/index.html`, one version pin for
  every site's `/admin/`. Each site keeps its own `static/admin/config.yml`.
  A site without a CMS lists hugo-shared's mounts without `static` (baharal's
  `hugo.toml`).
- **Client guides** — step-by-step pages for non-technical owners (the first:
  creating a Google Business Profile; baharal.com/guides/ and a personal copy
  on a client's site). Making or changing one: the playbook
  `menashe-forge/docs/CLIENT-GUIDES.md`.
  - `assets/guides/<guide>/<step>.<lang>.{phone,desktop}.webp` — the
    screenshots, one set for every site. Assets publish only when a page uses
    them. How they were taken, and re-taking them: `tools/guide-shots/README.md`.
  - `layouts/_shortcodes/guide-shot.html` — `{{< guide-shot src="gbp/02-name"
    alt="…" >}}`: the phone shot on narrow screens, the desktop one from 768px.
  - `layouts/_shortcodes/ui-en.html` — `{{< ui-en "Next" >}}`: a button's
    English name in parentheses, safe inside right-to-left text.
  - `layouts/_shortcodes/copy-value.html` — `{{< copy-value "text" >}}`: a
    value to type somewhere, with a copy button (labels in `i18n/`).
- `hugo.toml` — the minimum Hugo version (0.141, for `images.QR`), and the
  image-processing settings (quality 82, Lanczos, smart crop). A site takes them
  with `[imaging] _merge = 'deep'` in its own config.

## Using it in a site

1. Import it. HugoBlox sites list it before the fork:
   ```toml
   [[imports]]
     path = 'github.com/shahar-baharal/hugo-shared'
   [[imports]]
     path = 'github.com/shahar-baharal/baharal-hugoblox/modules/blox'
   ```
2. `hugo mod get github.com/shahar-baharal/hugo-shared@latest`; on HugoBlox
   sites also `hugo mod vendor` (they commit `_vendor/`). Commit `go.mod`,
   `go.sum` (and `_vendor/`).
3. Add the footer link to each language's footer menu. Menus stay in the site:
   a module's per-language menu config adds those languages to the site.
   ```toml
   [[footer]]
     name = 'QR code'        # 'קוד QR', 'Code QR'
     pageRef = '/qr'
     weight = 55
     [footer.params]
       icon = 'qr-code'
   ```

Check with `hugo config mounts | grep '"path"'`: hugo-shared comes before `blox`.

## Google Analytics lead tracking

What a site owner needs to know is whether the site brings work, so the lead is
a visitor who reaches out. Cloudflare Web Analytics counts visits but can't
count clicks; GA4 can. Every click on a WhatsApp, `tel:` or `mailto:` link
sends:

| Event | Parameter | Values |
|---|---|---|
| `contact_click` | `method` | `whatsapp`, `phone`, `email` |

A click counts intent, not a call or message actually made, and ad blockers
hide some visitors. Map links need nothing: GA4's enhanced measurement already
records outbound clicks.

**Turn it on for a site:**

1. In [analytics.google.com](https://analytics.google.com), Baharal account:
   Admin → Create → Property named after the business (in English), with its
   time zone and currency, objectives *Generate leads* and *Understand web
   traffic* → Web stream for the domain, enhanced measurement on. Copy the stream's
   Measurement ID (`G-…`, public).
2. Load GA with the theme. HugoBlox: `[hugoblox.analytics.google]
   measurement_id = "G-…"` in `params.toml` (production builds only). Then add
   `"ga-contact-clicks"` to `hugoblox.hooks.body_end`.
3. In GA, once per property:
   - **Key event**: Admin → Data display → Events → *Create event* → name
     `contact_click`, *Mark as key event* on, *Create with code* → Create.
     Clicks before this aren't counted retroactively.
   - **Custom dimension**: Admin → Data display → Custom definitions →
     *Create custom dimension*: name `Contact method`, scope Event, parameter
     `method`.
   - **Search Console**: Admin → Product links → Search Console links → Link
     the domain property, so search queries show up in GA. Setting up the
     property itself: `menashe-forge/docs/SEARCH-CONSOLE.md`.
4. Check after deploying: click the phone link on the live site, then Reports
   → Realtime → "Event count by Event name" shows `contact_click`.

**Reading the numbers**: Reports → Engagement → Key events. Where leads come
from: Explore → Free form, rows *First user primary channel group*, columns
*Contact method*, values *Key events*, filter *Event name* = `contact_click`.
Visits from data-centre towns (Ashburn, Boardman, The Dalles) are bots. Your
own test clicks count too, so keep them few.

Each site's `docs/` says which property it uses and anything site-specific
(e.g. which contact channel the owner prefers).

## Inquiry form

A visitor fills in a form on the site; the owner gets one email, laid out in
the page's language and direction. No third-party form service: the site's own
Worker sends it through Cloudflare Email Routing, which is free when the
recipient is a verified address. Live on flynoam.com since 2026-11-16 (why:
`sites/flynoam/docs/decisions.md`).

### Pieces (each does one thing)

| Piece | Where | Does |
|---|---|---|
| Form | HugoBlox: the fork's `inquiry-form` block (`baharal-hugoblox/modules/blox/blox/inquiry-form/README.md`). Other themes: any form that sends the request below | Renders the fields from the block's `content`, posts JSON |
| Worker | `assets/inquiry/worker.js` | `POST /api/inquiry`: same-origin and honeypot checks, then one email via the `EMAIL` binding |
| Template | `assets/inquiry/email.js` | `render(fields) → {html, text}`: pure function, no Worker APIs |
| Preview | `tools/inquiry/preview.js` | `node preview.js < sample.json > out.html` (or `--text`) |
| Tests | `tools/inquiry/email.test.js` | `cd tools/inquiry && node --test` |
| Setup | `tools/inquiry/setup.sh <domain> <to>` | Email Routing on, owner's inbox added as destination; safe to re-run |

### The request (form → Worker)

`POST /api/inquiry`, same origin, JSON:

```json
{ "subject": "New inquiry", "lang": "he-IL", "dir": "rtl", "botcheck": false,
  "fields": [{ "label": "Name", "type": "text", "value": "…", "width": "half" }] }
```

- `dir` optional: without it, Hebrew or Arabic labels mean `rtl`.
- `fields` in form order; empty values are dropped. The first field's value
  (the visitor's name) is appended to the subject.
- `type`: the input's type. `tel` gets a call link, plus a WhatsApp link if the
  number starts with `+` or the site sets `INQUIRY_COUNTRY_CODE`; `email` gets a
  mailto link and becomes the reply-to; `date` (`yyyy-mm-dd`) is shown in
  `lang`'s format.
- `width`: `full` | `half` | `third`, the same width the field has in the form.
- Responses: `{"success":true}`, or `{"success":false,"error":…}` with 4xx/5xx.
  A missing var is a 500 naming it.

### The email layout

Fluid-hybrid cells: each field is an `inline-block` with `width:100%` and a
`max-width` from its `width` (600px body: full 568, half 284, third 189), so
short fields share rows on wide screens and stack on phones with no CSS
support at all; one `@media` rule (kept by Gmail) then stretches stacked cells
to the full width. Tables, inline styles and `dir` on every block, the usual
email-client rules. No template framework: MJML, Maizzle and React Email all
add a build step or React for what is one ~80-line function. Outlook desktop
ignores `max-width` on `inline-block`, so there every field takes a full row.

To change the look: edit `email.js`, run the preview and the tests, then bump
the sites (below).

### Adding it to a site

1. **Cloudflare** (once per domain; wrangler logged in to the account holding
   it, `npx wrangler login`):
   `menashe-forge/themes/hugo-shared/tools/inquiry/setup.sh <domain> <owner-email>`, then
   click the link Cloudflare emails to the owner. It adds MX and SPF records:
   on a domain that already receives mail elsewhere (Google Workspace, Zoho),
   don't run it; ask first.
2. **`wrangler.jsonc`** (the site must deploy as a Worker, `menashe-forge/docs/HOSTING.md`;
   HugoBlox sites have `_vendor/`, others run `hugo mod vendor` first):
   ```jsonc
   "main": "_vendor/github.com/shahar-baharal/hugo-shared/assets/inquiry/worker.js",
   "assets": { …, "run_worker_first": ["/api/inquiry"] },
   "send_email": [{ "name": "EMAIL" }],
   "vars": {
     "INQUIRY_TO": "owner@example.com",        // required, verified in step 1
     "INQUIRY_FROM": "inquiry@<domain>",        // required, on the domain of step 1
     "INQUIRY_FROM_NAME": "Business name",      // optional, default: the subject
     "INQUIRY_ACCENT": "#012d5e",               // optional, heading and link color
     "INQUIRY_COUNTRY_CODE": "972"              // optional, local numbers → WhatsApp links
   }
   ```
3. **The form**: on a HugoBlox page, `- block: inquiry-form` with its
   `content` (the block's README). Elsewhere: any form that sends the request
   above.
4. **Check**: `hugo --environment production`, push, then submit the live form
   with a dummy phone and an `@example.com` email; it lands in the owner's
   inbox. Record the setup in the site's `docs/`.

Free on any Workers plan: sends to verified destinations don't count against
Email Sending's quota. Sending to arbitrary recipients (e.g. a copy to the
visitor) would need Workers Paid and Email Sending on the domain.

### Gotchas

- **Only a default export** in `worker.js`: Workers treats named exports as
  entry points and refuses to start.
- **`to` must be set**: a `send_email` binding's `destination_address` does not
  fill it in for `send({...})`, so the Worker passes `INQUIRY_TO`.
- **Local testing**: `wrangler dev` with a script argument ignores
  `wrangler.jsonc` (no vars, no binding); copy the config with `main` pointing at
  your local clone instead. Its simulator prints paths to the text and HTML
  instead of sending. The local runtime may reject a recent
  `compatibility_date`: override it in the copy.
- **Debugging live**: the error is in the JSON response
  (`curl -X POST https://<domain>/api/inquiry -H 'Origin: https://<domain>' -d '{"fields":[{"label":"x","value":"y"}]}'`).

## Changing shared code

Edit here, push, then `menashe-forge/workflows/scripts/bump.sh` (its README).

To try a change before pushing, use a throwaway Go workspace in the site:
```sh
go work init . ../../themes/hugo-shared
HUGO_MODULE_WORKSPACE=go.work hugo server --ignoreVendorPaths '**'
rm go.work go.work.sum   # never commit them
```

## What doesn't belong here

HugoBlox fixes and options go in the fork, `shahar-baharal/baharal-hugoblox`
(its `MENASHE-FORGE.md`). This module holds only code that works with any theme.

## Candidates to move here next

- **Maybe**: the "Website by Shahar Best" footer credit (raw HTML in each
  site's params) as a translated partial; accessibility-statement
  scaffolding from `menashe-forge/docs/accessibility/`.
