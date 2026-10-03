# 05 — Bento

## Concept

The whole portfolio is one grid of tiles, and it fits in about three desktop screens.
Each project has its own accent colour, taken from the project itself: the owl's teal,
Mega Chess's green, the game's amber, and so on. The introduction underlines each
project name in that colour and links to its tile, so the first sentence also works as
a colour key for the page. The same five colours come back as a stripe on the closing
contact tile. It suits a teacher who builds many small, real things: the tiles show
the range, and the real screenshots are the proof.

## What changed for the visitor

- The first screen shows the name, role and tagline, the photo at its native size and a
  labelled owl tile ("My classroom platform / Classroom Chat / Open the app"). On desktop
  the email address and the first two project tiles are also above the fold. On a phone
  the first project (Classroom Chat, with its picture) starts on the first screen.
- There is a navigation bar (Projects, Skills, Contact). On tablets and desktops a
  contact tile sits at the top. The page ends with a large "Get in touch" tile, and the
  footer repeats the links.
- The project tiles show real imagery: the Classroom Chat login in a browser window
  whose address bar reads blossom.benmega.com, two Mega Chess phones, two Local Chat
  windows (the start screen and the "Connect a device" screen, each cropped on purpose
  to its card) and all three Fractal Defense screenshots, whole (title screen large,
  gameplay and upgrade screen stacked beside it). Auto-Prep has no screenshots yet, so
  its tile shows its pipeline, drawn in CSS as three cards: slide deck, question bank,
  and a card listing worksheet, quiz, Kahoot and Blooket, each with a small sheet
  glyph. The outputs are plain list items in a card, not bordered boxes, so they do not
  look like buttons.
- On a phone the Classroom Chat window is shown whole and a little tilted, smaller,
  with its address bar and Login button in view, so it reads as a product shot rather
  than an empty form.
- Clicking a project picture opens its gallery, the same as its Screenshots button.
- Every technology has a text label. Skills are plain lists with icons, with no levels
  or bars.
- Private repositories use a "Request code" button that opens a native dialog with
  LinkedIn, Email and Close. The dialog names the project and opens with focus on
  Close, so a reflexive Enter does not leave the site.
- The lightbox works with the keyboard (Escape, arrow keys, focus returns to the
  button). It also takes swipes, shows a counter, and has loading and failure states.
  When nothing can be shown, it shrinks to a small box with an icon and the message,
  plus a "View on GitHub" link for Fractal Defense.
- Light and dark are designed separately. Light uses warm paper with white tiles and
  soft brown shadows. Dark uses near-black with tiles lit from above and deep tinted
  panels. Every accent colour has its own value in each theme, and all pass AA.

## Decisions

- **Type**: Bricolage Grotesque for everything readable, with an optical size axis:
  big and tight for "Ben Mega", open at body size. JetBrains Mono is used only for
  small labels: eyebrows, tech chips, the counter. Both come from Google Fonts with
  system fallbacks.
- **Colour**: a neutral base with one ink colour. The only saturated colours are the
  five project accents and the owl tile. All colours, shadows and the phone bezel are
  tokens on `:root`, redefined for `prefers-color-scheme: dark`. The bright accents
  (`--teal-bright` …) are defined once and used both by the dark theme and by the
  closing contact tile, which is dark in both themes.
- **Layout**: a 12-column grid. The introduction tile is the largest and darkest-inked
  thing on the page, so it leads; the three featured projects are larger than the other
  two. Classroom Chat (01) opens the grid, top left. Mega Chess is tall beside
  Classroom Chat and Auto-Prep. Local Chat and Fractal Defense share the last row,
  6 + 6 columns, with picture panels of the same height, so their titles and buttons
  line up.
  - Local Chat's picture panel is as tall as two whole 4:3 shots need. Fractal Defense
    has much less text, so its panel takes the rest of its tile's height and holds all
    three screenshots; the two tiles end with their buttons on one line, and the
    titles sit at different heights on purpose.
  - The five skill tiles are equal in width, each a single column of names (5, 4, 5,
    4 and 3 items), so the band reads as one calm row. Below 1240px they take two
    rows (6 + 6, then 4 + 4 + 4 of 12 columns) with the names flowing in rows.
  - At 720–1079px the grid has 6 columns.
  - Under 720px the phone has its own layout: the intro, then the photo (a small
    square) beside the wider owl tile. The top contact tile is left out on phones: it
    repeats the closing tile and pushed every project off the first screen. The
    header's Contact link leads to the closing tile. The featured projects follow as
    full tiles, each with a different arrangement. The two other projects become
    compact rows with a thumbnail (the Local Chat logo from its start screen, the
    castle); thumbnail, text and buttons share one left edge. In dark the white Local
    Chat thumbnail is dimmed a little and edged in its accent, so it does not outshine
    the page. The skills sit two per row, with DevOps as a wide strip.
- **Crops**: every deliberate crop of a screenshot is written in image pixels
  (`--cx`, `--cy`, `--cw`, `--ch` on a `.crop` box) with a comment, so it can be
  checked against the file. The Fractal Defense shots are not cropped at all on
  desktop and tablet.
- **Spacing and type tokens**: a 4px scale (`--s-1`…`--s-7`) with half steps
  (`--s-h` 2px, `--s-1h` 6px, `--s-2h` 10px, `--s-4h` 20px, `--s-5h` 28px, `--s-6h`
  40px); 16px gaps between tiles (12px on phones), 24px tile radius, 16px inner radius.
  Every font size is a `--fs-*` token, and tap height, icon size and the lightbox
  button size are tokens too. Literal px remain only for drawing geometry: the owl's
  and the phones' positions, the arrowheads, the slide-deck stack, the crop boxes, the
  contact rows' fixed icon and label columns, and underline offsets.
- **The Ω watermark** sits off the top-right corner of the introduction, clear of the
  name at every width (on phones only its arch and right foot show). It has its own
  colour per theme, lifted in dark (`#1f2227`) so it reads the same in both.
- **Motion**:
  - Tiles fade up 14px as they enter the viewport: opacity over 0.3s, with at most
    three 40ms stagger steps, so every tile is fully in by about 0.45s. The hiding
    class is added by `script.js` only, so without JavaScript or with reduced motion
    nothing is ever hidden. A page restored from the back/forward cache shows every
    tile at once.
  - On hover a tile lifts 3px and its border takes the project accent, and its
    picture moves a little: the phones fan out, the owl hops, the arrows nudge, the
    Local Chat windows and Fractal shots tilt apart. These hover effects apply only on
    devices that can hover, so on a phone a tapped tile does not stay lifted.
  - Keyboard focus inside a tile gives the same lift and accent border.
  - The in-page links scroll smoothly, and the target tile flashes a ring in its
    accent.

## Copy I wrote

Tightened from the brief:

- "Making programming accessible." (added a full stop)
- Local Chat: "A desktop application for peer-to-peer communication without relying
  on an internet connection." (hyphens, "an")

New sentences and labels:

- "I teach CS and build education tools, apps and a game: Classroom Chat, Auto-Prep,
  Mega Chess, Local Chat and Fractal Defense."
- Tile labels: "01 Education tool · Live", "02 App · Android", "03 Education tool ·
  Live", "04 App · Desktop", "05 Game"
- Auto-Prep drawing: "Slide deck", "Question bank", "Class materials", "Worksheet",
  "Quiz", "Kahoot", "Blooket" (hidden from assistive tech; it repeats the description)
- Classroom Chat window: "blossom.benmega.com" (the live demo address, drawn in the
  window's address bar; hidden from assistive tech)
- Owl tile: "My classroom platform", "Classroom Chat", "Open the app"
- Section and tile titles: "Projects", "Skills", "Contact", "Get in touch"
- Buttons: "Live demo", "Code", "Screenshots", "Request code", "Close",
  "View on GitHub"
- Dialog label: "Private repository", or "Mega Chess · Private repository" (and the
  same for Auto-Prep and Local Chat)
- Lightbox messages: "Loading…", "Loading screenshots…", "This screenshot could not be
  loaded.", "No screenshots yet.", "The screenshots could not be loaded right now."
- Alt and hidden text:
  - "Portrait of Ben Mega"
  - "<Project> screenshot n of N"
  - "Close screenshots", "Previous screenshot", "Next screenshot"
  - "Skip to content"
  - "(opens in a new tab)"
  - "Built with" (the label of every project's tech list)
  - "Sections" (the header navigation)
  - "Introduction" (the first band)
  - "Ben Mega" (the header brand link, whose visible name is hidden under 440px)
- Meta and Open Graph description: "Ben Mega is a CS teacher and full-stack developer
  making programming accessible. Projects: Classroom Chat, Mega Chess, Auto-Prep,
  Local Chat and Fractal Defense."

"Used by 100 users" is not used.

## Notes for Ben

- **Check `benmega/FractalDefense`.** Today the GitHub API answers 404 for the
  repository itself (not only for its `screenshots` folder). The repo is private,
  renamed or gone, so the public "Code" link on that tile probably leads to a GitHub
  404.
  - The gallery still fetches from GitHub first, as the brief requires.
  - When the fetch fails, the gallery shows the three screenshots in
    `assets/fractal-defense/`. They are listed in a new attribute on that button,
    `data-fallback-images`. The gallery script does not touch it, because the button
    has no `data-gallery-dir`.
  - If both fail, the lightbox shows the small failure box with a "View on GitHub"
    link to the repository.
  - The failed fetch still logs one 404 in the browser console, as the current site
    does.
- **Auto-Prep**: while `data-images` is empty, the Screenshots button is hidden
  (`hidden`), and the tile shows the drawn pipeline. When the gallery script fills the
  list, the button appears on the next load, and the pipeline picture then opens the
  gallery too. On a phone the three buttons then sit as two plus one full-width row.
  Nothing needs to change by hand.
  - I did not add a thumbnail of the first Auto-Prep screenshot to the tile. It would
    have to be inserted by JavaScript after load, into a tile that is partly on the
    first desktop screen, so the page would jump; and the proportions of the future
    images are unknown. When real screenshots exist, pick one and write it into the
    HTML like the other projects' pictures.
- **Local Chat promotional graphic**: it shows your Wi-Fi name and a local IP
  address. It was already in the old gallery, and it is now also the second window on
  the Local Chat tile. There it is too small to read, but it is readable in the
  lightbox. Replace the file if you mind.
- **The owl** appears once, in its own tile at the top. The copy that used to peek
  over the Classroom Chat project picture was removed, because both were on the first
  desktop screen together.
- **Skill icons**: SQLAlchemy, Nginx and AWS only have wordmark icons in devicon,
  which are unreadable specks at 18px. They show their initial in a small outlined
  square instead.
- **External requests**:
  - Google Fonts: Bricolage Grotesque and JetBrains Mono, `display=swap`.
  - The devicon stylesheet (`@latest`, as before).
  - The three icon images already used: Gunicorn, OpenAI, Hugging Face.

  If a CDN fails, the page stays fully readable. The icons disappear and the labels
  remain.
- **Images**:
  - On desktop the first screen loads only `profile.jpg` and the owl.
  - Everything else is `loading="lazy"` with `width` and `height`.
  - The Fractal Defense screenshots (title screen about 1 MB, upgrade screen about
    570 KB, gameplay about 450 KB) are the heaviest images on the page. They sit in the
    last project row. On phones only the title screen is shown, as a thumbnail, but
    the browser may still fetch the two hidden ones when that row comes near.
- **No theme toggle**: the page follows the system setting.
- **Without JavaScript**, the Screenshots and Request code buttons are hidden, since
  neither can work. Everything else stays: all text, links and pictures.
- **Checks**: `node redesigns/_tools/shot.mjs 05-bento` reports nothing in any of the
  four views: no contrast, tap-target, overflow, heading or missing-content warning.
  The same holds at 360×740, 768×1024, 1024×768, 1100×800 and 1920×1080. At 1440×900
  the desktop page is 3.1 screens tall, at 1920×1080 2.5; on a 390px phone it is 5.2
  screens.
- **Known limits**:
  - At about 720–810px wide the Local Chat tile is too narrow for its two buttons, so
    "Request code" drops to a second line. The Fractal Defense tile beside it keeps one
    row. Everything stays aligned and tappable. At these widths the two Local Chat
    windows are small (about 80px of picture height).
  - Between about 1080 and 1300px wide the "Class materials" card in the Auto-Prep
    drawing is too narrow for two columns, so its four items stand in one column and
    the three cards grow to match (about 130px instead of 90px).
  - While the Fractal Defense gallery asks GitHub, the lightbox is full size with
    "Loading screenshots…". If nothing comes back, it then shrinks to the failure box.
  - The Fractal Defense gallery logs one 404 in the console when it asks GitHub for
    the screenshots (see above). Nothing else is logged.
  - A two-line inline script in `<head>` adds the `js` class before first paint, so the
    Screenshots and Request code buttons do not flash in. All other behaviour is in
    `script.js`.
