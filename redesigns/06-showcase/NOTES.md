# 06 Showcase

## Concept

A run of product launches. Each project gets a full-width stage in its own
colour, with its real screenshots in CSS-drawn device frames: a tablet and a
phone for Mega Chess, desktop windows for Local Chat, a bronze game window for
Fractal Defense, a browser window for Auto-Prep once its screenshots exist.
The hero's "lineup" introduces the five colours, and they come back in the
underline of "accessible", the header line and the contact section. It suits Ben
because the proof is the work: a recruiter sees five shipped things, big, in
under a minute.

## What changed for the visitor

- The first screen has the name, role, tagline, photo (88 px, never stretched),
  contact links, the owl and a list of all five projects with links to them.
  On tablets (768-1023 px) that list is a row of five coloured tiles under the
  hero. On phones all five wrap into three rows of chips; they are fully on the
  first screen at 390 x 844 and start at its bottom edge at 360 x 740.
- Every project shows its screenshots on the page instead of hiding them behind
  a button. Each has what it is, its stack as a quiet line of labelled icons,
  and its links.
- Classroom Chat and Auto-Prep have no screenshots, so they get honest drawings:
  the owl with the three groups the platform is for, and Auto-Prep's pipeline
  drawn from its description. Neither pretends to be the product.
- The owl is a labelled link ("Classroom Chat is live") at the top of the hero,
  first in the source too, so keyboard focus follows the visual order. Every
  link that opens a new tab says so to screen readers.
- Navigation, a skills section, a contact section and a footer. In Skills,
  small dots in the project colours mark which projects use each tool (taken
  from the stacks in the brief), so the section ties back to the stages.
- The header line takes the colour of the project on screen.
- Keyboard lightbox (Escape, arrows, focus return, counter, loading and error
  states), a native request-access dialog with LinkedIn, Email and Close
  (focus starts on Close, so Enter does not leave the site). "Request access"
  is a mailto link underneath, so it still works without JavaScript.
- Gallery buttons are announced as "Screenshots (10 images)"; the count
  follows `data-images`.
- The Local Chat "Screenshots" button works.

## Decisions

- **Type**: Bricolage Grotesque (800) for display, a grotesque with character
  that stays legible at 72 px; Inter for text. Fluid scale with clamp().
  Display tracking is -0.022em on the statement and -0.028em on titles, loose
  enough that letters in "programming" do not touch.
- **Colour**: one hue per project (teal, green, violet, pink, amber), tuned
  separately for each theme so text passes AA. In both themes each stage is a
  room tinted in its colour with a top edge in that colour: dark rooms (9 %
  tint) with a coloured spotlight behind the visual, light rooms (7 %) with a
  white one. Phone bezels stay black and the game window stays bronze in both
  themes, as real devices would. The hero has no background decoration; the
  colour lives in the lineup and the underline.
- **Layout**: 12-column feel, 5/7 split, sides alternate. On desktop the
  lineup's top lines up with the name. On phones: title, visual, stack,
  buttons; every project stacks its buttons full width under 480 px. Spacing tokens
  from 4 px to 64 px; frames sized in em from container width so bezels keep
  their proportions at every size.
- **Motion**: one short fade-up (0.4 s) per block, only after JavaScript runs;
  none with reduced motion. Small hover moves on the device stages. The "Live"
  dot pulses three times on load, then rests (a looping pulse would suggest
  uptime monitoring that does not exist).
- **Mega Chess**: the Chinese chess board (`tablet_screenshot_4`) in a tablet
  that fills most of the stage, with the international board
  (`phone_screenshot_5`) on a phone in front of its lower-right corner, so the
  stage says what the line says: both kinds of chess. The phone only covers
  the black margin beside the board.
- **Local Chat**: the connect window is cropped just under the QR code, so the
  line naming the home Wi-Fi and the LAN address is not on the page (the
  lightbox still shows the whole image, as the gallery contract needs). The
  sign-in window overlaps it to the right of the QR code, where the card is
  blank.
- **Stack**: in a project it is a line of icon + name without borders, so it
  never outweighs the visual; bordered chips are used only in Skills.
  SQLAlchemy and Nginx have only wordmark logos, which turn into grey
  scribbles at 18 px, so they get plain database and server glyphs; the label
  names them.
- **Mega Chess gallery**: the button has `data-first` naming
  `tablet_screenshot_4` and `phone_screenshot_5` (the two boards). The
  lightbox still reads `data-images` at click time; files named in
  `data-first` that are still in the list go to the front, the rest follow in
  folder order. If those files disappear, it opens in folder order.
- **Loading**: `script.js` is deferred; a one-line inline script in the head
  adds `html.js` so reveals are set up before first paint. `script.js` adds
  `js-ready` as it starts. Without it (a partial upload, a blocked request)
  a CSS failsafe shows every reveal after 1.2 s and the gallery buttons stay
  hidden.
- **Auto-Prep**: while `data-images` is empty, the diagram shows and the
  Screenshots button is hidden. When the job fills it, the first image appears
  in a browser frame (prep.benmega.com), shown whole (`object-fit: contain`)
  inside a fixed 1280x800 box so odd shapes are not cropped and nothing
  shifts. The caption changes, and the button shows with a count. With three
  buttons the live demo takes its own row and the other two sit side by side.
  Tested by filling the attribute with a wide and a square image.

## Copy I wrote

- Meta description: "Ben Mega is a CS teacher and full-stack developer making programming accessible. Education tools, apps and a game: Classroom Chat, Mega Chess, Auto-Prep, Local Chat and Fractal Defense."
- OG description: "Making programming accessible. Education tools, apps and a game: Classroom Chat, Mega Chess, Auto-Prep, Local Chat and Fractal Defense."
- Owl link: "Classroom Chat is live" / "Try the classroom platform"
- Hero: "Education tools, apps and a game. Two of them are live in the browser today."
- Buttons and labels: "See the projects", "Email me", "The lineup", "Live", "Built with", "Live demo", "Code on GitHub", "Screenshots", "Request access", "Close"
- Project kinds: "Education tool", "Android app", "AI lesson prep", "Desktop app", "Tower defense game"
- Classroom Chat: "100 users" (the README fact, shown as a figure; remove if outdated). Drawing labels "Teachers", "Parents", "Students".
- Auto-Prep drawing: "Slide deck", "Question bank", "Ready for class", "Worksheets", "Quizzes", "Kahoot", "Blooket", "Serverless on AWS · Claude on Bedrock". "Ready for class" is my label for the output step.
- Captions: "The Classroom Chat owl and the three groups it connects." / "A Chinese chess game on a tablet, an international game on a phone." / "Slide deck in, question bank, then worksheets, quizzes and games out." / "Auto-Prep in the browser." (once screenshots exist) / "The connect screen and the sign-in card." / "The main menu and a wave in progress."
- Skills: "The tools behind the projects, by area." / "The coloured dots mark the projects above that use each tool." Screen-reader text on those chips: "(used in Classroom Chat, Local Chat)" and so on.
- Contact: "Get in touch" / "About a role, about the tools, or to ask for access to the code."
- Dialog heading: "Request access"
- Lightbox messages: "Loading…", "No screenshots yet.", "This image could not be loaded.", "Could not load the screenshots from GitHub."
- Alt texts: "Portrait of Ben Mega", "The Classroom Chat owl mascot", "A Chinese chess board in Mega Chess on a tablet", "An international chess board in Mega Chess on a phone", "Auto-Prep in the browser", "The Local Chat connect screen, with a QR code for joining over Wi-Fi", "The Local Chat sign-in card, asking for a nickname", "The Fractal Defense main menu over a painted castle", "Fractal Defense in play: the path, the wave bar and the tower menu". In the lightbox: "<gallery title>, image 2 of 10" and the counter "2 of 10".
- Accessible names: "Skip to content", "Projects on this page", "Previous image", "Next image", "(10 images)" after "Screenshots" (number from `data-images`), and "(opens in a new tab)" after every link that opens one.

## Notes for Ben

Decide before launch:

- **Fractal Defense repo is not public.** `github.com/benmega/FractalDefense`
  still answered 404 on 1 October 2026, as does the GitHub API folder the
  gallery reads. So "Code on GitHub" is a dead link for visitors today. I
  kept it, because the brief lists the repo as public and publishing it is
  your call. Either make the repo public, or swap that link for the Request
  access button the other private projects use (copy the
  `<a class="btn" href="mailto:..." data-dialog="access-dialog">` line from
  Mega Chess). The Screenshots button does not depend on it: when GitHub
  fails it opens the three files in `assets/fractal-defense/` (listed in
  `data-fallback`), with one failed request in the console.
- **Local Chat screenshot shows a Wi-Fi name and LAN address.**
  `local-chat/promotional_graphic.jpg` shows "Bensavinee_5GHz" and a LAN IP.
  The page crops that line out; the lightbox shows the whole file, because the
  gallery lists it. Replace the file with a cleaned copy (same name) to fix
  both.
- **"100 users"** is the README figure. Confirm it is current, or delete the
  `project__fact` line.
- **"Two of them are live in the browser today."** follows from the two live
  demo links, but it is a claim you should be happy to make.
- **Mega Chess `phone_screenshot_1`** (the game list, "vs john" six times)
  reads like test data. The gallery no longer opens on it (see `data-first`),
  but it is still image 3 of 10. Replace or remove it if you agree.

Good to know:

- External: Google Fonts (Bricolage Grotesque, Inter, `display=swap`, system
  fallbacks), the devicon stylesheet, and the three icon images already on the
  site. ComfyUI uses `assets/comfyui.png`.
- `fractal-defense/main_menu.png` is about 1 MB and shown on the page. It is
  lazy-loaded, has fixed dimensions and is far below the first screen, but a
  compressed copy (same name) would help phones.
- The GitHub API allows 60 requests an hour per visitor without a token; the
  Fractal Defense fallback covers that too.
- Without JavaScript all content reads; gallery buttons are hidden because they
  cannot work; "Request access" opens an email instead of the dialog.
- Page length: about 6.6 screens on desktop, 8.3 on a phone (9.5 at 360 px,
  7.3 on a 768 px tablet), down from 8.5 and 10.1 on phones. The lineup and
  the nav are the shortcuts.
- Uses `color-mix()`, `:has()` and container queries (browsers from 2023 on).
  Older browsers lose the tints and the three-button layout, not the content.
- `redesigns/_shots/06-showcase/` holds old test images and reports from
  earlier rounds. They are outside this folder, so I did not delete them.

## Judges' feedback I did not follow

- **Classroom Chat drawing kept.** There are no screenshots of the app; the
  only image, `classroom-chat-banner.png`, is a login form, which proves less
  than the labelled owl drawing. The first real screenshot follows one stage
  later. A real screenshot from you would be the fix.
- **Same stage rhythm for all five projects.** Kept on purpose: the repeat
  makes the page easy to skim and compare. The visuals (tablet and phone,
  pipeline, desktop windows, game windows) carry the variety.
- **Bricolage + Inter kept.** I removed the blurred hero blobs instead, which
  were the most "launch page" part of the look.

## Checked

With `shot.mjs`: the four standard views plus 360x740, 390x844, 768x1024,
1024x768 and 1920x1080, all with no findings. Mega Chess gallery opens on
"1 of 10" (the tablet board) with focus on Close; ArrowRight shows the phone
board ("2 of 10"); Escape closes and focus returns to the button. Request
access opens with focus on Close. Auto-Prep with `data-images` filled: the
browser frame, caption and "Screenshots (3 images)" appear; the three buttons
stack on phones and form two rows on desktop. Reduced motion: 15 of 15
reveals visible.
