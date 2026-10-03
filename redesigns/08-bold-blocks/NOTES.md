# Bold Blocks

## Concept

A teacher's sticker sheet. Every project is a flat colour block with a thick ink
border and a hard shadow, labelled with stickers (Education tool, Live, Private
code), so a recruiter can sort the work at a glance. The loud surface sits on a
strict grid: one wrap width, one spacing scale, the same card anatomy (sticker
band, title, description, tech chips, buttons) for all five projects.

## What changed for the visitor

- Name, role, tagline, photo (160 px, never stretched) and the Classroom Chat
  owl card are all on the first screen, on phone and desktop.
- Sticky header with Work, Skills, Contact and a light/dark toggle; on phones
  it is one row (Ω mark, three pills, toggle), so both hero buttons reach the
  first screen even at 360 x 740.
- Real screenshots on the page: Mega Chess in two whole phone frames inside
  the card (the home screen with both boards, and the list of games), Local
  Chat's "Connect a device" screen (no internet, join by QR code) and Fractal
  Defense's main menu in paper frames. On phones pictures lead their card; the
  Auto-Prep diagram, which is text, follows the copy.
- Every technology is a labelled chip (icon plus text), in the cards and in the
  skills table.
- Auto-Prep shows what it does as a numbered "How it works" diagram (dashed
  outline, no shadows, so it never reads as buttons) while its screenshot
  folder is empty. When `data-images` gets files, the Screenshots button appears with a
  count and the diagram is replaced by one large and two small thumbnails.
- Local Chat's dead "Screenshots" link now opens its two images.
- Private repositories open a native `<dialog>` with LinkedIn, Email (subject
  line names the project) and Close. Without JavaScript the same link is a
  plain mailto.
- A contact block with email, GitHub and LinkedIn, and a footer with the same
  links.
- Lightbox: focus moves in and back, Escape closes, arrows and swipe move,
  counter, loading and error states, alt text per image.

## Decisions

- **Type**: Bricolage Grotesque (display and body, variable weight and optical
  size) for chunky headlines that still read well at 17 px; Space Mono for
  stickers, chips, buttons and labels, which gives the "label maker" feel.
  Fallbacks: Segoe UI/Roboto/Arial and Consolas/Liberation Mono.
- **Colour, light**: cream paper `#FFF4DE` with a faint dot grid, ink
  `#15131A`. Blocks in teal, yellow, pink, lilac and orange; all text on them is
  ink (the lowest pair, ink on the blue skill label, is about 5.8:1). White text is only used on ink.
- **Colour, dark**: its own construction, not an inversion. Paper `#14121B`,
  cards stay dark (`#1F1C2A`) and take their colour as a solid header band, a
  coloured border and a coloured hard shadow; the primary button fills with the
  card colour. Stickers and chips stay light objects with ink outlines in both
  themes. Text is warm off-white `#F6EFE2`. The hero block behind the photo
  becomes a dark panel drawn in blue with a blue dot grid; in light it is
  solid blue with an ink dot grid, so it reads as a surface, not a slab.
  Sticker colours come from the same palette tokens as the blocks.
  Handled in CSS with three mix tokens (`--fill-mix`, `--line-mix`,
  `--band-mix`), so each component is written once.
- **Layout**: 1200 px wrap. Featured projects are full-width cards (copy left,
  art right, 420 px). Mega Chess's phones are taller than its copy, so there
  the copy centres on them. The other two cards share a row through CSS
  subgrid: band, screenshot, title, description, chips and buttons line up
  across both, and Fractal Defense's shorter text leaves small, even gaps
  instead of one hole above its buttons (browsers without subgrid bottom-align
  the buttons instead). Buttons at equal widths. The contact block is two
  panels in both themes: pink heading panel, links on the surface colour.
  From 600 to 899 px the two smaller cards put the screenshot beside the
  text. On phones everything stacks on one left edge (section notes
  included), pictures lead their card and buttons go full width.
  Skills: a timetable of five columns on wide screens, labelled rows below
  1100 px.
- **Spacing**: 4, 8, 12, 16, 24, 32, 48, 64, 96 px. Borders 3 px (2 px on
  small stickers), shadows 6 px (4 px on buttons).
- **Motion**: buttons lift on hover and press into their shadow on click.
  Cards fade up 16 px in 260 ms once JavaScript is running. Setup runs at
  DOMContentLoaded (not at load, which waits for images), so nothing waits on
  a download; after a back/forward restore, anything on screen is shown at once.
  Reduced motion turns all of it off. The tape of project names under the hero
  is tilted but does not scroll.
- **Theme toggle**: the icon shows the theme a click switches to (a moon in
  light), matching its accessible name.
- **Tilt**: only stickers, the photo, the colour block behind it, the phone
  frames and the tape are rotated (1.5 to 3 degrees). Cards and text never are.
- **Focus**: a 3 px ring, `#0B2A8F` in light (3.8:1 or more on paper and every
  block colour) and yellow in dark. The owl card, which crosses the hero block,
  gets a paper halo under its ring; buttons on the lightbox's yellow title bar
  get an ink ring.

## Copy I wrote

- "Hi, I'm Ben" (photo caption)
- "Gamified classroom platform" and "Live" (owl card in the hero)
- "See the projects", "Email me"
- "Two education tools and an Android app."
- "More projects"
- Nav label "Work" (for the projects section; it keeps the phone header on
  one row)
- Stickers: "Education tool", "Live", "Public code", "Private code",
  "Android app", "Desktop app", "Game", "100 users"
- Auto-Prep diagram: "How it works", "Slide deck", "Question bank",
  "Worksheets", "Quizzes", "Kahoot games", "Blooket games"
- Buttons: "Live demo", "Code", "Screenshots", "Request code"
- "What I build with."
- "Say hello"
- "Reach me by email, GitHub or LinkedIn."
- Dialog: "Request access"; its sticker shows the project name, or
  "Private repository".
- Lightbox states: "Loading…", "No screenshots yet.",
  "Image N could not be loaded.",
  "Could not load the screenshots from GitHub. Open the repository on GitHub"
- Lightbox image alt: "<title>, image N of M" (for example "Mega Chess
  Screenshots, image 1 of 10")
- Email subject for private code: "Source code access: <project>" (for
  example "Source code access: Mega Chess")
- Accessible names: "Built with" (each tech list), "What Auto-Prep makes from
  a slide deck" (the diagram), "Open screenshot N of M" (Auto-Prep
  thumbnails, once they exist), "Switch to dark theme" / "Switch to light
  theme", "Close", "Previous image", "Next image", "Page" (the nav)
- Meta description: "Ben Mega is a CS teacher and full-stack developer making
  programming accessible. Projects: Classroom Chat, Mega Chess, Auto-Prep,
  Local Chat and Fractal Defense."
- Open Graph description: "Making programming accessible. Education tools,
  apps and a game by Ben Mega: Classroom Chat, Mega Chess, Auto-Prep, Local
  Chat and Fractal Defense."
- Alt texts: "Portrait of Ben Mega, smiling"; "Classroom Chat owl mascot";
  "Local Chat's Connect a device screen: no internet needed, a phone joins by
  scanning a QR code"; "Fractal Defense main menu over a castle at dusk: New Game, Endless
  Mode, Load Game, Settings, Shop and Achievements".

## Notes for Ben

- **"100 users"** sticker on Classroom Chat uses the optional fact from the
  README. Remove the one `<span class="sticker ... sticker--users">` if it is
  out of date.
- **External resources**: Google Fonts (Bricolage Grotesque, Space Mono,
  `display=swap`), the devicon stylesheet, and the three icon images the site
  already uses (Gunicorn, OpenAI, Hugging Face). ComfyUI uses the existing
  `assets/comfyui.png`. Without the CDNs every chip still shows its name.
- **Fractal Defense** gallery button has one extra attribute,
  `data-fallback`, listing the three screenshots in `assets/fractal-defense/`.
  They are shown if the GitHub API cannot be reached (rate limit, offline).
  Today the API answers 404 for `benmega/FractalDefense/contents/screenshots`,
  so the fallback is what visitors see; add that folder to the repository, or
  point `data-folder` at one that exists. If both fail, the lightbox links to
  the repository. The button has no
  `data-gallery-dir`, so the deploy script leaves it alone.
- **Auto-Prep**: the Screenshots button is hidden while `data-images` is empty
  and appears on the next page load after the deploy script fills it. Tested by
  filling it with other images: button shows "(3)", thumbnails replace the diagram.
- **Theme toggle** stores the choice in `localStorage` under `theme`; without a
  stored choice the page follows the system. The toggle is hidden without
  JavaScript.
- `script.js` is loaded first in `<head>`, before the stylesheets and without
  `defer`, so the stored theme applies before first paint and the script never
  waits for a stylesheet. It does everything else at DOMContentLoaded; a
  manual theme choice also updates the `theme-color` tags.
- **Mega Chess art** uses `phone_screenshot_2` (271 KB) and `_1` (412 KB),
  lazy and with `fetchpriority="low"`, instead of the 1 MB `_4`. The Mega Chess logo
  (265 KB) is still a large file for a 68 px sticker; a smaller copy in
  `assets/` would help, but new images are outside this brief.
- **Local Chat screenshot exposes your network.** `promotional_graphic.jpg`
  shows your Wi-Fi network name and the machine's LAN address under the QR
  code. The card crops that line out (in every browser), but the Screenshots
  lightbox shows the whole image, and the file is public on the site today.
  Replace it with a copy without that line if you mind.
- **Lightbox**: Escape is handled in the script as well as by the browser;
  the arrows are hidden, not dimmed, when there is one image or none; on
  phones and tablets the dialog takes the shape of the image, so a landscape
  shot gives a compact dialog.
- `script.js` runs inside one function and adds nothing to the global scope.
- The final report printed no problems in the four views, nor at 360, 768,
  1024 and 1920 px wide.
