# Plain and Fast

## 1. Concept

An essay with marginalia. One serif column reads top to bottom like a
well-set article; the margin beside it holds what a reader would pencil in:
the portrait, each project's logo and tools, the skill areas. Prose is set in
a serif, facts about code in a monospace, and the links are the interface.
The owl perches on the rule that closes the introduction, and an Ω opens the
page (in the header) and closes it (as the end mark after the last
sentence). It suits Ben because the tagline is "Making programming
accessible" and this page is that, literally: readable in five seconds,
complete without JavaScript, one small stylesheet, no build step.

## 2. What changed for the visitor

- Name, role, tagline, a sentence that links to every project, GitHub,
  LinkedIn, the email address and the owl are all on the first screen, on
  phone and desktop.
- Every project has a picture, sized by its rank. Classroom Chat: a
  full-width browser window on the live site, cropped to its heading
  ("Login to Classroom Chat") so it reads as proof the site is live, not as
  an empty form; it links to the site. Mega
  Chess: four phone screens (a swipe strip on phones). Auto-Prep: a drawing
  of the pipeline its copy describes (slide deck, question bank, worksheets,
  quizzes, Kahoot or Blooket games), made of text and inline SVG. Local
  Chat: two screens. Fractal Defense: three equal 4:3 tiles, the smallest
  pictures on the page (a swipe strip on phones). Each screenshot opens the
  lightbox at that picture; with JavaScript off it opens the image file.
- Mega Chess, Local Chat and Fractal Defense show their logos: at the head
  of the margin note on desktop, beside the project name on phones.
  Classroom Chat does not repeat its owl, which stands a few lines above it;
  Auto-Prep has no logo.
- On phones each card closes with its links: name, text, picture, tools,
  then Live demo / Screenshots / Code.
- Gallery buttons say how many pictures there are: "Screenshots (10)".
- The lightbox works with the keyboard (Escape, arrow keys, Home, End), puts
  focus on Close when it opens and returns it to what opened it, shows a
  counter, and has loading, empty and failure states. Previous and Next are
  shown only when there are two pictures or more. Pictures that are also on
  the page keep their written alt text inside the gallery; the other six
  Mega Chess files have written descriptions too (a lookup by file name, not
  a copy of the list). Only unknown files fall back to their file name.
- Private code is one plain link, "Code on request", parallel to "Code on
  GitHub". Without JavaScript it writes an email; with it, it opens a native
  dialog with LinkedIn, Email and Close, styled for both themes.
- Header navigation, skip link, landmarks, one h1, ordered headings, named
  controls, 44 px tap targets, a contact section and a footer.
- Every technology is plain text. Light and dark are each designed.
- Auto-Prep: while its folder is empty the Screenshots button is hidden and
  the pipeline drawing stands in. When the deploy script fills
  `data-images`, the button appears with its count and the first two
  pictures replace the drawing in fixed 16:10 boxes, without any change to
  the HTML.

## 3. Decisions

- Type: Source Serif 4 (optical sizes on) for reading and headings; IBM Plex
  Mono for the role, labels, captions, tool lists, navigation and footer.
  Fallbacks: Iowan Old Style, Palatino, Georgia; Cascadia Mono, Consolas,
  Menlo. Body 18 to 20 px, line-height 1.6, measure 38 rem. Scale in
  `--text-*` tokens. Project names in the intro never break across lines.
  Three small sizes, each with one job: `--text-meta` for facts a visitor
  reads (tool lists, captions, the owl's line, skill areas), `--text-label`
  for section labels and the footer, `--text-s` for navigation and controls.
  Meta and label are 13 px as desktop marginalia; on phones meta is 16 px,
  label and controls 15 px. The footer stays at 15 px so the copyright
  line does not break on a phone.
- Colour: light is ink on warm paper (#1d1c19 on #fbfaf6, teal links
  #0a6470). Dark is chalk on a night board (#e9e6de on #101719, links
  #7fd6df). One accent, the teacher's pen: red pen #a13a17 on paper, yellow
  chalk #f2c35b on the board. It marks the tagline, the closing Ω and the
  arrows of the Auto-Prep drawing. Two palettes, not an inversion: dark also
  sets the serif lighter (370 and 560 instead of 400 and 600, because light
  text on dark reads heavier), raises the dialog onto a lighter surface, and
  dims screenshots (10 %; the white Local Chat screens only 6 %, since more
  turned them muddy grey). All AA by the tool's check.
- Layout: a 38 rem column; from 60 rem an 11 rem margin column opens to the
  left. Below 60 rem the portrait (56 px) sits beside the name, so the owl
  is fully on the first screen even at 360 x 740. Tool lists wrap on phones
  with a middle dot between tools; the dot never hangs at a line end.
  Spacing scale `--s1` to `--s9` (0.25 to 6 rem). Sections are separated by
  hairlines with small mono labels; the intro ends on a heavier ink rule
  that the owl stands on. The portrait's ring, the header rule, the section
  labels, the logos and the tool lists share one left edge. From 110 rem
  (very wide screens) the whole page scales up 12.5 %, measure included.
- Screenshots: sized by the project's rank, so the featured work gets the
  full width first. Classroom Chat's window spans the column (up to the
  file's own 578 px, so it is never enlarged); the picture
  is cropped to its top 112 px (the page heading) under an address bar that
  reads blossom.benmega.com. Mega Chess 4 across (a
  snap strip under 34 rem). Local Chat 2 across, each box cropped to the app
  window (one landscape window, 864 x 535 px of the picture, and one
  portrait card, 490 x 604 px), set to equal height; nickname first, as in
  the gallery. Fractal Defense three equal 4:3 tiles (a snap strip under
  34 rem). The lightbox always shows whole pictures.
- Logos: 48 px in the margin, 40 px beside the name on phones, empty alt
  (the heading names the project). The Mega Chess and Fractal Defense logos
  are dark ink, so at night they are inverted with the hue kept
  (`invert(1) hue-rotate(180deg)`). The Fractal Defense logo is clipped to
  the tower and its branches (its wordmark, illegible at 48 px, is cut) and
  scaled back up to fill the box.
- Auto-Prep drawing: three cards with small line drawings and mono labels,
  arrows between them; stacked with down arrows on phones. It says nothing
  the project copy does not.
- Motion: nothing animates on load and nothing is ever hidden for an
  animation. Link colours change over 120 ms, the owl tilts 6 degrees on
  hover, dialogs fade in over 160 ms, anchor links scroll smoothly. Tilt,
  fade and smooth scroll only under `prefers-reduced-motion: no-preference`.
- Margin column: on desktop each project is two grid rows, its text and
  pictures (one wrapper) and its links; the tool list spans both
  (`grid-row: 1 / -1` on explicit rows), so it holds however much the
  column grows. The portrait spans the name, role and tagline.
- Dialog controls keep 44 px targets, but their focus ring is drawn 8 px
  inside the box so it hugs the word instead of framing empty space.
- JavaScript: about 290 lines, deferred. Lightbox, dialog, gallery counts,
  Auto-Prep preview. All content is in the HTML. Listeners bind once; a
  `pageshow` handler closes any dialog left open after a back/forward-cache
  restore and syncs the galleries again.

## 4. Copy I wrote

Page text:

- "I build education tools (Classroom Chat, Auto-Prep), apps (Mega Chess,
  Local Chat) and a game (Fractal Defense)."
- "Classroom Chat is live at blossom.benmega.com"
- "The owl is its mascot."
- "Used by 100 users." (the README fact the brief allows)
- "Making programming accessible." (the tagline with a full stop)
- "Write to ben@benmega.com, or find me on LinkedIn and GitHub."
- Headings: "Featured projects", "Other projects", "Skills", "Contact",
  "Request access" (dialog title).
- Link and button words: "Projects", "Skills", "Contact", "Skip to content",
  "Live demo", "Code on GitHub", "Code on request", "Screenshots", "Email",
  "Back to top", "LinkedIn", "Close", "Previous", "Next".
- Captions: "The sign-in page of the live site." / "From left: active
  games, a new game, international chess, Chinese chess." / "How a slide
  deck becomes class materials." / "From left: choosing a nickname,
  connecting a device." / "From left: the main menu, a level, the victory
  screen."
- Auto-Prep drawing labels: "Slide deck", "Question bank", "Worksheets,
  quizzes, Kahoot or Blooket games".
- "blossom.benmega.com" in the drawn address bar (decorative, hidden from
  screen readers).

Alt text and accessible names:

- "Portrait of Ben Mega"; "Ben Mega, top of page" (the Ω in the header);
  "Sections" (the nav); "Built with" (each tool list); "Contact" (link
  lists). The owl image and the project logos have empty alt; the text
  beside them names them.
- "Classroom Chat sign-in page, live at blossom.benmega.com" (a linked picture)
- "Mega Chess list of active games, Chinese and international"
- "Mega Chess new game screen with an opponent list and a choice of board"
- "Mega Chess international chess board at the start of a game"
- "Mega Chess Chinese chess board at the start of a game"
- "Local Chat sign-in screen asking for a nickname"
- "Local Chat screen for connecting a device over Wi-Fi by scanning a QR code"
- "Fractal Defense main menu over a painting of a castle at dusk"
- "Fractal Defense level with a stone path, a wave timeline and the tower shop"
- "Fractal Defense victory screen after all six waves, with stars and the score"
- Gallery only (script.js): "Mega Chess screen for finding friends by player
  ID"; "Mega Chess on a tablet: the list of active games"; "Mega Chess on a
  tablet: a new game with a choice of board"; "Mega Chess on a tablet:
  finding friends by player ID"; "Mega Chess on a tablet: a Chinese chess
  board at the start of a game"; "Mega Chess on a tablet: an international
  chess board at the start of a game"

Head:

- Description: "Ben Mega is a CS teacher and full-stack developer making
  programming accessible. He builds education tools, apps and a game:
  Classroom Chat, Auto-Prep, Mega Chess, Local Chat and Fractal Defense."
- Open Graph description: "Making programming accessible. Education tools,
  apps and a game by Ben Mega: Classroom Chat, Auto-Prep, Mega Chess, Local
  Chat and Fractal Defense."

Written by the script:

- "Loading…", "No screenshots yet.", "This screenshot could not be loaded.",
  "The screenshots could not be loaded from GitHub.", the count " (10)", and,
  for a gallery file that has no written description (future Auto-Prep
  files, say), alt text built from its name: "Auto-Prep: quiz editor".

## 5. Notes for Ben

- **Fractal Defense links are dead today.** https://github.com/benmega/FractalDefense
  answers 404, and so does the API folder the gallery reads
  (`repos/benmega/FractalDefense/contents/screenshots`). The current site has
  the same problem. I kept the URLs from the brief. The page copes: the
  Screenshots button falls back to the three pictures on the page instead of
  showing an error. A public repo `benmega/tower-defense` ("A tower defense
  game") exists; if that is the game, change `href` and `data-repo`. Its
  root has no `screenshots` folder either.
- **Image weight.** The page itself is small, its pictures are not: about
  5 MB for a visitor who scrolls to the end. The heaviest are
  `mega-chess/phone_screenshot_4.png` (1.05 MB, shown about 140 px wide)
  and `fractal-defense/main_menu.png` (1.02 MB, shown about 195 px wide);
  the three logos are 260 to 270 KB each for a 48 px mark. All of them are
  lazy and decode asynchronously, and the first screen loads only the
  portrait and the owl (about 105 KB) plus the fonts. I looked for lighter
  files: `phone_screenshot_3` (99 KB) is the find-friends screen, not the
  Chinese board, so it cannot stand in. Small copies (for example 400 px
  WebP thumbnails and 96 px logos) would make the page fast all the way
  down; the brief does not allow new images, so that is your call.
- The Classroom Chat picture is `assets/classroom-chat-banner.png`, the only
  image of the app: its sign-in form. The page shows only its heading. A
  screenshot of a class chat would serve the featured project better; it
  would drop into the same window frame (remove the `aspect-ratio` crop on
  `.window img`).
- **Privacy:** `local-chat/promotional_graphic.jpg` shows a home Wi-Fi
  network name and a LAN address (192.168.1.102). Both are readable in the
  "connecting a device" picture and in the lightbox. Swap the asset if that
  matters to you.
- External fonts: Google Fonts, two families (Source Serif 4, IBM Plex
  Mono), `display=swap`. Without them the page sets in Palatino or Georgia
  and Consolas. Nothing else is loaded from outside; the devicon stylesheet
  is not used, since every tool is a word.
- The Auto-Prep preview crops its two pictures to 16:10 from the top edge.
  If the screenshots turn out to be portrait, change the ratio in
  `.shots-fit .shot`. They are placed by the script, so on that day the
  Auto-Prep block changes height a little after the first paint (it is well
  below the first screen).
- The Mega Chess strip shows four of the ten files by hand (`phone_screenshot
  _1, _2, _5, _4`), and Local Chat and Fractal Defense name their files in
  the HTML. Renaming those files means editing the HTML; the button lists
  stay in sync by themselves.
- The captions and alt text describe what I saw in the screenshots. Check
  them; you know the apps.
- No manual theme toggle; the page follows the system setting.
- The shot tool's report is clean in all four views (no contrast, tap
  target, alt, overflow or console flags). Checked with --eval in round 3:
  the Mega Chess gallery steps 1 to 10 with a written alt on every picture;
  focus goes to Close on open, a dispatched Escape closes the lightbox and
  focus returns to "Screenshots (10)"; Auto-Prep is hidden while empty and
  shows "Screenshots (2)" with two previews after a simulated deploy plus
  `pageshow`; Fractal Defense falls back to the page pictures (1 of 3)
  after the GitHub 404. That 404 is the only console line, and only when
  that gallery is opened.
- Opening a dialog puts focus on its Close control, as the native dialog
  does. After a keyboard or scripted open that shows the focus ring around
  Close; with a mouse click Chrome does not show it.
