# Teach, Build, Ship: the portfolio as a short book

## Concept

The page reads like a short textbook in four chapters: **01 Teach**, **02 Build**,
**03 Toolkit**, **04 Contact**. A chapter rail works as the book's table of contents and
as a bookmark: a line beside each chapter fills as you read it, and a dot marks the
project you are on. On phones it becomes a bar on top. Chapters open with a large title
and a ghosted numeral, and each project has a section number (1.1, 2.1 …). A teacher's
structure, with the projects as proof that he ships.

## What changed for the visitor

- The first screen shows name, role, the tagline set large, GitHub, LinkedIn and email,
  and a **Featured work** list: Classroom Chat and Auto-Prep with direct "Live demo"
  links, Mega Chess with its screenshots. A live project is one click away.
- The owl is labelled "Classroom Chat · Open the live demo": a strip under the chapter bar
  on phones, a card at the foot of the rail on desktop. It never covers content.
- The rail lists every project under its chapter (desktop) and shows reading progress on
  every screen size.
- Real screenshots on the page: Mega Chess as its game picker on a phone beside the two
  boards it offers (cropped to the board, so they read at a glance), Local Chat and
  Fractal Defense in window frames. Clicking one opens the gallery at that image, with
  the same alt text as on the page.
- Classroom Chat, Mega Chess and Auto-Prep are marked **Featured** (badge in the section,
  star in the rail, and the hero list), although the chapters group them differently.
- Every technology is a labelled pill. The skills are a plain table of rows, not an SVG.
- The page ends on a contact chapter with the email address in large type.
- A keyboard-friendly lightbox (Escape, arrows, Home/End, focus in and back, counter,
  loading, empty and error states), full width on phones. When nothing can be shown, a
  small panel says so and offers "Open on GitHub" (repository galleries) or Close. The
  request access dialog has LinkedIn, Email and Close.
- The dead Local Chat "Screenshots" link now opens its two images.

## Decisions

- **Type.** Fraunces (display serif) for names, chapter titles and numerals, which gives
  the book feel. Atkinson Hyperlegible Next for text: it was designed for legibility and
  fits "making programming accessible". Body text 16–19px; chapter titles 60–120px.
- **Colour.** One teal accent plus a warm amber for "Featured", the tagline's underline
  and the "100 users" figure. Light: warm paper `#faf7f0`, ink `#1a1f22`, teal `#0a6a74`.
  Dark: teal-black `#0c1517`, lit teal `#5fd6de`, amber focus ring. Each theme has its own
  tokens (surfaces, window frames, numeral tint, contact band), not an inversion.
- **Layout.** A 66rem column beside the rail (76rem from 1600px). The rail's contents
  start under the brand, like a book's contents page; the owl card sits at its foot.
  Between 1024 and 1200px the hero is one column, with the featured list under the
  introduction, so neither column is squeezed. Featured scenes alternate text and media.
  Local Chat and Fractal Defense are a pair of cards with equal 16:10 frames and buttons
  on a shared bottom line; the screenshots sit inset in a darker frame, so a white app
  screen reads as a picture on the dark page. Contact is a full-width teal band. Two
  container queries adapt components to their own width: the Featured list puts its
  buttons under the text when narrow (360px phones), and the Auto-Prep diagram runs left
  to right when wide (tablets).
- **Numbering, once each.** The chapter number lives in the rail and the ghost numeral;
  section numbers only on projects. No "Chapter 01" labels, no numbers in the hero list
  or on the toolkit rows. The hero list uses drawn teal marks for Classroom Chat and
  Auto-Prep, so the owl appears once per screen (rail card or strip) plus its large
  panel in chapter one.
- **Motion.** CSS only, scroll-linked (`animation-timeline: view()`): sections rise 1.5rem
  into place and chapter numerals drift slightly. Nothing is ever hidden or transparent,
  so no content waits for an animation, and browsers without scroll timelines show the
  finished page. Scrolling stays native. `prefers-reduced-motion` turns it all off. The
  rail's progress is a small `requestAnimationFrame`-throttled scroll listener, so it
  works in every browser.
- **Galleries.** They follow the contract: `data-images` is read on each click. The
  Auto-Prep button stays hidden while its list is empty. When the list fills, the button
  appears and a preview is built from the same list inside the Auto-Prep panel: one image
  alone, two side by side, or one large plus two, the last marked "+N more" (checked with
  2 and 10 injected paths). Private "Code" buttons show a lock and "Code", with
  "(private, request access)" in the accessible name, so three buttons fit on one line.

## Copy I wrote

Sentences and labels that are not in the brief:

- Meta description: "Ben Mega is a CS teacher and full-stack developer making programming accessible. Education tools, apps and a game: Classroom Chat, Auto-Prep, Mega Chess, Local Chat and Fractal Defense."
- OG description: "Making programming accessible. Education tools, apps and a game by Ben Mega."
- Hero: "I teach computer science and build software: education tools, apps and a game."
- Featured list: "Featured work", "Gamified classroom communication", "AI lesson prep for teachers", "International and Chinese chess".
- Classroom Chat figure: "100 users" (from the README line "Used by 100 users.").
- Buttons and links: "See the work", "Get in touch", "Live demo", "Code", "Screenshots", "Back to top", "Email" (dialog), "Open on GitHub", "Close" (lightbox).
- Owl: "Classroom Chat" / "Open the live demo".
- Chapter leads: "Two education tools: one for the classroom, one for lesson prep." / "Two apps and a game." / "Tools and frameworks in use."
- Section labels: "Education tool", "Android app", "Desktop app", "Game".
- Classroom Chat panel: "Teachers", "Parents", "Students".
- Auto-Prep panel: "Slide decks", "Question banks", "Worksheets", "Quizzes", "Kahoot games", "Blooket games", "Serverless on AWS · Claude on Bedrock".
- Mega Chess captions: "Pick an opponent and a board", "International chess", "Chinese chess".
- Contact: "Get in touch", "Questions about a role, a tool or the code? Write to me."
- Lightbox: "Loading…", "This screenshot could not be loaded.", "No screenshots yet.", "The screenshots could not be loaded.", "+N more" (Auto-Prep preview).
- Alt text: "Portrait of Ben Mega", "The Classroom Chat owl", "Mega Chess screenshot: choosing an opponent and a board, with a Play button", "Mega Chess screenshot: an international chess board", "Mega Chess screenshot: a Chinese chess board", "Local Chat screenshot: the start screen, asking for a nickname", "Fractal Defense screenshot: a level with a stone path, a gold counter and a wave timeline". Gallery images reuse these when the same file is on the page, otherwise "<gallery title>, n of N"; Auto-Prep previews: "Auto-Prep screenshot n".
- Screen-reader labels: "Chapters", "Built with", "Who it connects", "What Auto-Prep does", "(featured)", "(opens in a new tab)", "of Classroom Chat (opens in a new tab)", "of Auto-Prep (opens in a new tab)", "Mega Chess screenshots", "Code (private, request access)", "Close", "Previous screenshot", "Next screenshot".

## Notes for Ben

- **I used "Used by 100 users."** from the README, set as a figure ("100 users") under the
  Classroom Chat description. Delete the `stat` paragraph if you prefer not to show it.
- **The Fractal Defense repository returns 404.** `https://github.com/benmega/FractalDefense`
  and its API (`/contents/screenshots`) both answered 404 on 2026-09-30, so the "Code"
  link is dead and the GitHub gallery cannot load. If the game lives in another repository
  (you have a public `benmega/tower-defense`), change the link and `data-repo`. So the
  button still works, it carries a `data-fallback` list of the three local screenshots in
  `assets/fractal-defense/`, used only when GitHub fails or returns no images. The update
  script does not touch it. Without the fallback, the lightbox shows "The screenshots could
  not be loaded." with an "Open on GitHub" button, which today also leads to the 404.
- **Local Chat: the image on the page is `app_ui_mockup.jpg`** (the start screen). The
  other file, `promotional_graphic.jpg`, prints your Wi-Fi network name and a LAN IP
  address in readable type. It is still in the gallery, because the update script lists
  every file in the folder. If you do not want those visible, remove or crop that file.
- **The Classroom Chat and Auto-Prep marks** in the Featured list are drawn icons (a chat
  bubble, slides) on a teal tile. Auto-Prep has no logo; for Classroom Chat the owl is
  already beside the list. Replace them if you prefer.
- **External resources:** Google Fonts (Fraunces, Atkinson Hyperlegible Next; `display=swap`,
  Georgia / Segoe UI / system-ui fallbacks), the devicon stylesheet, and the Gunicorn,
  OpenAI and Hugging Face icons the site already uses. OpenAI and ComfyUI logos are shown in
  greyscale to match the one-colour icons. Without the CDN every pill still shows its name.
- **Without JavaScript** the page is complete and screenshots are plain links to the image
  files. Gallery and private "Code" buttons are hidden, as they need JavaScript.
- **Known limits:**
  - Scroll-linked motion only runs where scroll timelines exist (Chrome, Edge, recent
    Safari). Other browsers get a static, complete page.
  - Both window images are cropped to 16:10 so the cards line up. The Local Chat start
    screen is enlarged so its card fills the frame (and dimmed slightly in dark mode);
    Fractal Defense loses a strip of its bottom toolbar.
  - Between 768 and 1024px the scenes are one column. The page is 8.3 phone screens long
    at 390px and 9.8 at 360px.
  - Gallery images that are not on the page (tablet screenshots, GitHub files) get generic
    alt text ("Mega Chess Screenshots, 6 of 10"), because the file lists carry no
    descriptions.
- **Automatic report:** every line is empty in all four views, at 360, 768, 1024, 1920 and
  1280x600, and with reduced motion. The only console error you can trigger is clicking
  Fractal Defense "Screenshots": the GitHub 404 above (the fallback images then show).
