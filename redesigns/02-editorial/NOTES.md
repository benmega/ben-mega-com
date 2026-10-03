# 02 Editorial: "Contents"

## Concept

The page is set like one issue of a magazine: a cover with your name at the full
width of the grid, a numbered contents list, one spread per project with the
real screenshots shown large, a toolkit index and a contact colophon. A teacher
who makes programming accessible gets a page that reads the way good teaching
material does: clear order, numbered, nothing hidden. The light theme is the
"day edition"; the dark theme is the "night edition", a separate print run with
its own paper, ink, accent and an italic cut of the display face.

## What changed for the visitor

- First screen: name, then the role "CS Teacher & Full-Stack Developer" as
  the first line under it (20-26px, in ink), tagline, photo (160px, not
  stretched), GitHub, LinkedIn and email, the owl link to Classroom Chat and
  the list of all five projects. At 1440 x 900 the whole contents row fits on
  the first screen in both editions. On phones the contents is a dense
  one-line index (48px rows), so the Work section starts on the second
  screen.
- Sticky masthead with navigation (I Work, II Toolkit, III Contact) and a
  Day/Night edition switch. Sections are numbered in roman numerals set in
  the display italic, so they never collide with the project folios
  (01/05 ...). On phones the masthead scrolls away.
- Every project shows its product on the page, drawn in the frame that fits
  it:
  - Classroom Chat: a dotted plate with the owl beside a small browser window
    holding the login page (URL bar blossom.benmega.com; the window opens the
    live site), so the empty form is no longer the loudest picture. "100
    users" is set like a folio, a numeral and a small label.
  - Mega Chess: the opening spread. Folio and title on the left half;
    description, stack and actions on the right half, standing over the phone
    columns. Three phones and the two boards (cropped square out of their
    letterboxed screens) run across the full measure, tops on one line. The
    whole spread is about one screen tall at 1440 x 900.
  - Auto-Prep: a drawn pipeline until its folder has screenshots.
  - Local Chat: the "Connect a device" screen in a desktop window, cropped to
    the panel so it reads at full width.
  - Fractal Defense: a contact sheet. On wide screens the level takes two
    thirds with the main menu and victory screen stacked beside it, so the
    sheet is as tall as the text column; narrower, the two smaller screens
    sit under the level.
  The galleries hold the rest.
- On phones every spread reads the same way: folio and title, picture, then
  description, stack and buttons. Mega Chess shows two phones (tops aligned)
  and the two boards; the third phone is left to the gallery, and the Fig. 2
  caption drops "finding a friend" at that width so it matches what is shown.
- Technologies are written out in text: a "Stack" line per project, and a
  Toolkit index with icons plus visible names.
- A contact section with the email set large, plus GitHub and LinkedIn rows,
  and a footer with the contact links.
- The Local Chat "Screenshots" button now works. "Request code access" is a
  quiet text link under the buttons in each private project; it opens a
  native `<dialog>` with LinkedIn, Email and Close. It is a `mailto:` link, so
  without JavaScript it still writes an email with the project in the
  subject.
- Lightbox: keyboard (Esc, arrow keys), focus moves in and back, a counter
  set like the folios ("02/10"), loading and failure messages. Alt text and
  caption are generic ("Mega Chess screenshot 3 of 10"), because the list
  changes between deploys and file names make poor descriptions. Escape is
  handled explicitly in both dialogs.
- The request-access dialog names the project ("Private repository · Mega
  Chess") and its Email button carries the same subject as the no-JavaScript
  link ("Code access: Mega Chess"). On phones the project gets its own line
  and the three buttons are equal widths.

## Decisions

- **Type.** Fraunces (a soft, high-contrast display serif; the optical-size axis
  lets the name run at up to 350px without looking heavy) and Instrument Sans for
  text and labels. Day edition sets the display face upright at weight 480;
  night edition sets it italic at 380, so light type on dark does not bloom.
  The role under the name is in the text face, so it reads as information
  rather than decoration; the tagline stays in the display italic.
- **Colour.** Day: paper `#f5f2ea`, ink `#15130f`, one accent, vermilion
  `#c8321a`. Night: blue-black `#0f1218`, ivory `#eee7d8`, one accent, amber
  `#f0b14a`. Tokens live on `:root` and are redefined once for
  `prefers-color-scheme: dark` and once for the manual switch. The two blocks
  must stay identical, and a comment in styles.css says so. At night,
  screenshots are dimmed only to 95% brightness, so white app screens do not
  turn grey.
- **Layout.** A 12-column grid with 24px gutters and a 1360px measure. Spreads
  put text on five columns and pictures on seven (or four and eight),
  alternating sides; Classroom Chat is six and six. On the Mega Chess spread
  the right half splits on the phones' column line: the description runs
  across it, with the stack over the third phone and the actions over the
  boards. Feet sit on one line. Pictures always sit exactly on column lines
  and the text takes the extra gutter of air. Buttons sit on one row;
  "Request code access" is a text link on its own line beneath, so no row
  wraps unevenly. Between 761 and 960px the pictures take the full width and
  the text runs in two columns under them. On phones everything is one
  column with full-width buttons, and the gaps between spreads and the
  Toolkit rows are tighter than on desktop. Hairline rules and large
  numerals (01/05 ...) carry the structure.
- **Numbering.** Projects use arabic folios (01/05, and 01 to 05 in the
  contents); sections use roman numerals in the display italic (I, II, III).
  The two systems never meet.
- **Spacing.** One 4px-based scale (`--s1` to `--s8`); section spacing uses
  `clamp()`.
- **Motion.** One short rise (360ms, 12px) as blocks enter, only under
  `html.js`, with `threshold: 0` so nothing waits. Reduced motion turns it off.
  Setup runs on `DOMContentLoaded` (it never waits for images, fonts or a
  CDN) and again on every `pageshow` for back/forward restores; it is safe to
  run twice. A CSS safety net shows every `.reveal` block after 600ms if
  setup has not run (`html.js:not(.is-ready)`).
- **Third parties never hold the page.** The devicon stylesheet is fetched
  as `media="print"` and switched on by script.js once it has loaded, so a
  slow jsDelivr cannot block rendering; icons sit in fixed 20px slots so
  nothing moves when it arrives. The three external toolkit icons are
  `loading="lazy"`.
- **Auto-Prep.** With `data-images=""` the Screenshots button is hidden and the
  spread shows the drawn pipeline. As soon as the folder has images, script.js
  shows the button with a count and replaces the drawing with the first
  screenshot (a large 16:10 picture, cropped from the top, that opens the
  gallery); the Fig. 3 caption switches with it. Checked by filling
  `data-images` and firing `pageshow` twice.
- **Script hygiene.** One IntersectionObserver for the page's life; the
  Fractal Defense GitHub list is fetched once per page and reused (a failed
  fetch is not cached).

## Copy I wrote

Sentences and labels not in the brief, word for word:

- "Five projects: two live, two with public code."
- "Tools and platforms, grouped by area." (Toolkit deck)
- "By email, GitHub or LinkedIn."
- "Write to"
- "Open the platform" and "Live" (owl link and contents list)
- "Contents"; project kinds "Education tool", "Android app", "Desktop app", "Game"
- Section numerals "I", "II", "III" (hidden from screen readers)
- "Stack", "Live demo", "Code on GitHub", "Screenshots", "Request code access"
- "Night edition", "Day edition"
- Dialog: "Private repository", "Request access", "Email", "Close" (the body
  text is yours)
- "100 users" (the README's "Used by 100 users.", tightened; see Notes for Ben)
- "Fig. 1 The Classroom Chat owl and the login page. Select the window to open the live platform."
- "Fig. 2 Mega Chess on a phone: the games list and a new game, then finding a
  friend. The boards, international and Chinese, up close." (on phones
  without ", then finding a friend", because that phone is not shown there)
- "Fig. 3 What Auto-Prep does with a slide deck." and, once screenshots exist,
  "Fig. 3 Auto-Prep. Select the picture to see all screenshots."
- "Fig. 4 Local Chat: the Connect a device screen."
- "Fig. 5 Fractal Defense: a level in progress, the main menu and the victory screen."
- Frame labels: "blossom.benmega.com" (browser URL bar), "Local Chat" (window
  title)
- Email subject of the no-JavaScript access links: "Code access: Mega Chess"
  (and Auto-Prep, Local Chat)
- Auto-Prep drawing: "In", "Slide decks", "Then", "Question banks", "Out",
  "Worksheets", "Quizzes", "Kahoot games", "Blooket games", "Serverless on AWS",
  "Claude on Bedrock"
- Footer: "Set in Fraunces and Instrument Sans."
- Dialog eyebrow once opened: "Private repository · Mega Chess" (or Auto-Prep,
  Local Chat)
- Lightbox caption and alt: "<Project> screenshot <n> of <total>", e.g.
  "Mega Chess screenshot 3 of 10".
- Lightbox messages: "Loading…", "No screenshots yet.", "The screenshots could
  not be loaded. Please try again later.", "This image could not be loaded."
- Meta description: "Ben Mega is a CS teacher and full-stack developer making
  programming accessible. Education tools, apps and a game: Classroom Chat,
  Mega Chess, Auto-Prep, Local Chat and Fractal Defense."
- Open Graph description: "Making programming accessible. Education tools,
  apps and a game: Classroom Chat, Mega Chess, Auto-Prep, Local Chat and
  Fractal Defense."
- Accessible names: "Skip to content", "Open the Auto-Prep screenshots",
  "Close screenshots", "Previous screenshot", "Next screenshot", "Portrait of
  Ben Mega", "Open Classroom Chat at blossom.benmega.com"
- Alt text for the on-page screenshots (describes what each screen shows), e.g.
  "Mega Chess: the list of active games, with a Chinese chess and an
  international chess board", "Local Chat: the Connect a device screen with a
  QR code". All are in index.html.

## Notes for Ben

- **Please confirm "100 users".** It is the optional README fact and the only
  figure on the page, so it has to be true today. It is set as "100 users" (a
  numeral and a small label, like a folio) under the Classroom Chat
  description. I shortened the README's "Used by 100 users." because "used
  by ... users" says the same thing twice. Delete the `.spread__fact`
  paragraph if you would rather not claim it.
- **Fractal Defense gallery (your decision).** The GitHub API call to
  `repos/benmega/FractalDefense/contents/screenshots` returns 404 today (the
  folder does not exist in the repo), so opening the gallery logs a 404 in
  the console. The button then falls back to a `data-fallback` list of the
  three local screenshots, so visitors still get a working gallery. I kept
  `data-repo` because the brief's gallery contract requires it. The clean fix
  is yours: add a `screenshots` folder to the FractalDefense repo. If you
  would rather drop the GitHub fetch, replace `data-repo` and `data-folder`
  with a local `data-images` list.
- **Local Chat screenshot (your decision).** `promotional_graphic.jpg` shows a
  Wi-Fi network name and a LAN IP address in small print. The on-page crop
  stops just below the QR code, so they are not shown on the page, but the
  gallery shows the whole image. If you do not want them public, replace or
  edit the image in `assets/local-chat/`; the gallery script picks up the new
  file by itself.
- **Classroom Chat** has only its login form as a picture, so it now sits in a
  small window beside the owl and is never scaled up. A real screenshot of
  the app would make the flagship much stronger: replace
  `assets/classroom-chat-banner.png` in the frame, and consider giving the
  window more of the plate.
- **Mega Chess:** in the first phone, the "vs john" row that fades out above
  Play is part of the screenshot itself. It is not a crop; the phone is shown
  whole. `phone_screenshot_3` (Find Friends) is on the page on desktop; the
  two boards are `phone_screenshot_5` and `_4`, cropped square in CSS.
- **Toolkit icons:** SQLAlchemy, Nginx and AWS have no icon. Devicon only
  has wordmarks for them ("SQLA", "NGINX", "aws"), which cannot be read at
  20px, so their names stand on their own.
- **Fonts:** Google Fonts, two families: Fraunces and Instrument Sans, with
  `display=swap` and Georgia / Helvetica fallbacks. Other external resources are
  the ones the site already uses: devicon (jsDelivr, `@latest`, as on the
  current site), the Gunicorn and Hugging Face icons from simple-icons, the
  OpenAI icon from Wikimedia. ComfyUI uses `assets/comfyui.png`.
- **Auto-Prep preview** crops the first screenshot to 16:10 from the top. That
  suits desktop screenshots; a tall phone screenshot would be cut.
- The edition switch stores the choice in `localStorage` under `edition`;
  without a choice the page follows the system setting. Without JavaScript the
  switch and the gallery buttons are hidden and everything else reads normally.
- The automatic report is clean in all four views and at 360, 768, 1024 and
  1920 px wide (no overflow, contrast, tap-target, alt, name or heading
  lines). The Fractal Defense 404 above appears only when its gallery is
  opened, once per page.
