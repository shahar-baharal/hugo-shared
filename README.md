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
