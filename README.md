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
- **Footer menu icons** — a menu entry's `params.icon = "qr-code"` draws an
  icon before its name. HugoBlox: `layouts/_partials/components/footers/minimal.html`
  (vendor's file plus this, plus `root_absolute` entries such as the `/admin`
  Edit link kept at the site root on `/he/`, `/fr/` pages). Congo draws
  `params.icon` itself, from `assets/icons/qr-code.svg` here.
- **Header height** (HugoBlox) — `layouts/_partials/set-header-height.html`
  sets `--header-h` to the sticky header's height, so a hero can fill the
  screen below it. Each HugoBlox site's `baseof.html` calls
  `{{ partial "set-header-height" . }}` before `</body>`: a `hooks/body-end/`
  file in a module is never loaded (HugoBlox reads that folder from the site only).
- `hugo.toml` — the minimum Hugo version (0.141, for `images.QR`).

## Using it in a site

1. Import it. HugoBlox sites list it **before** `blox`, so its overrides win:
   ```toml
   [[imports]]
     path = 'github.com/shahar-baharal/hugo-shared'
   [[imports]]
     path = 'github.com/HugoBlox/kit/modules/blox'
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

## Candidates to move here next

Found by comparing the sites' files (2026-11-02). Move an item when its real
need arrives (usually the next HugoBlox upgrade), not ahead of it. A HugoBlox
file that would break the Congo site (e.g. `baseof.html`) needs its own
module first: a `hugoblox/` folder with its own `go.mod`, imported by the
HugoBlox sites only.

1. **Cloudflare Web Analytics**: 6 copies that differ only by token (5 HugoBlox
   `hooks/body-end/cloudflare-web-analytics.html`, shahar-best's
   `extend-footer.html`). One partial reading a `params` token, production
   builds only, called from `baseof.html` like the header height (a module's
   `hooks/` file isn't loaded).
2. **Identical HugoBlox fixes**, same bytes in 5 sites: `site_footer.html`,
   `functions/get_logo_url.html`, `functions/get_featured_image.html`,
   `jsonld/business.html`. Rationale:
   `menashe-forge/docs/themes/hugoblox/OVERRIDES.md`.
3. **Sveltia CMS loader** (`static/admin/index.html`): copies pinned to
   different versions (0.219.0, 0.256.1). One pin here; each site keeps its
   own `config.yml`.
4. **Near-identical HugoBlox overrides**: `baseof.html`,
   `components/headers/navbar.html`, `views/card.html`, hero `component.jsx`,
   `hbx/blocks/contact-info/block.html`. Same skip-link, keyboard, RTL and
   i18n fixes with per-site twists (eztechrepair's dark logo, mordecai's
   `tel:` CTA): share the common file, keep a twist as a site override or a
   param.
5. **Maybe**: the "Website by Shahar Best" footer credit (raw HTML in each
   site's params) as a translated partial; accessibility-statement
   scaffolding from `menashe-forge/docs/accessibility/`.
