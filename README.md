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
- **Sveltia CMS loader** — `static/admin/index.html`, one version pin for
  every site's `/admin/`. Each site keeps its own `static/admin/config.yml`.
  A site without a CMS lists hugo-shared's mounts without `static` (baharal's
  `hugo.toml`).
- `hugo.toml` — the minimum Hugo version (0.141, for `images.QR`).

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

## Changing shared code

Edit here, push, then in each site: `hugo mod get -u github.com/shahar-baharal/hugo-shared`
(+ `hugo mod vendor` on HugoBlox sites) and commit.

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
