# guide-shots

Takes the screenshots for the client guides (`../../assets/guides/`): the same
screen as a phone and as a computer, in Hebrew and English, from a real
signed-in Google account. Not part of the Hugo module (nothing mounts `tools/`).

1. Chromium with its own profile, remote debugging on localhost:
   `chromium --user-data-dir=$HOME/.cache/guide-shots --remote-debugging-port=9222`
   Sign in there by hand (Google refuses sign-in in automated browsers).
   Light mode everywhere: Chromium Settings → Appearance → Mode: Light (dialogs
   are cross-origin frames the emulation doesn't reach), and Google Search
   settings → Dark theme: Off.
2. `npm install && node server.mjs <out-dir>` — holds one tab per variant
   (`he-phone`, `he-desktop`, `en-phone`, `en-desktop`): phone = 390×844 mobile
   UA with touch, desktop = 1366×800; language from the variant. Listens on
   127.0.0.1:9333 only.
3. Drive with `./c` (one HTTP call per action), e.g.
   ```sh
   ./c open v=he-phone url='https://business.google.com/create?hl=he'
   ./c snap v=he-phone                       # accessibility tree: names to click
   ./c click v=he-phone role=button name='הבא' exact=1
   ./c type v=he-phone value='…'              # real keystrokes (opens dropdowns)
   ./c eval v=he-phone js="$(cat mark.js)"    # then js="window.__mark('הבא')"
   ./c shot v=he-phone name=08-contact        # → <out>/08-contact.he.phone.png
   ```
   `__mark` rings the button the reader should press; `__unmark` clears it.
4. Convert: `magick in.png -resize 1366x -quality 82 out.webp` (desktop;
   phone: `-resize 780x`), named `<step>.<lang>.<device>.webp`, into `assets/guides/<guide>/`.

`wizard.sh <variant>` walks Google's create-profile wizard and stops on the
contact screen, whose Next **creates a profile** (a duplicate, if one exists).
`manager.sh <variant>` shoots the "add a manager" screens without inviting.
Both use the Baharal profile on shaharbestbaharal@gmail.com (kept, unverified,
for re-takes; its id is in `manager.sh`).
