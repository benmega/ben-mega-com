# Lesson Plan

## Concept

The page is a well-made lesson handout on squared paper. It has a red margin line, handwritten notes in the margin and one highlighted line. Objectives come first, the projects are Units, the skills are Materials and contact is Office hours. This puts the teacher first and the developer right after, which is the order in which Ben describes himself. The owl gets a job: it is the class mascot in the header. The dark theme is the chalkboard, drawn by hand, not the paper colours inverted.

## What changed for the visitor

- The first screen shows the name, role and tagline, a photo at its real size (136px, taped into the margin) and an Objectives box. The box links to the projects, to both live demos and to all three contact routes. On a 390px phone, Unit 1's title and its Live demo button are on the first screen too.
- The header has plain navigation (Projects, Skills, Contact), a theme toggle and the owl, labelled "class mascot / Classroom Chat". On phones the header is one row (name, toggle, owl) and the section links give way to the Objectives box just below it. The handout words (Units, Materials, Office hours) stay in the section headings, each with a pen gloss ("= projects").
- All five units use the same layout: unit number and notes in the margin, text in the column, a numbered figure beside it. Every unit shows a picture that says something about it:
  - Fig. 1: a hand-drawn Classroom Chat figure (teachers, parents and students around one platform), with the real owl logo in the speech bubble.
  - Fig. 2: two real Mega Chess boards (international and Chinese chess), cropped from `phone_screenshot_5.png` and `phone_screenshot_4.png` and taped in like the photo.
  - Fig. 3: a hand-drawn Auto-Prep pipeline, because no screenshots exist yet.
  - Fig. 4: the Local Chat window, cropped in on the app's card so the frame is not mostly empty page.
  - Fig. 5: Fractal Defense in play, at 400px wide.
- Every tool has a visible name next to its icon, on the project cards ("Built with") and in the skills table ("Materials").
- The skills section is plain HTML, so its text does not shrink on phones. On phones each area is one ruled line with its tools running on, not a tall table.
- There is a real contact section with big, readable links, and the footer repeats them.
- The Local Chat screenshots button works. The Auto-Prep screenshots button is hidden while its folder is empty. It appears with a count as soon as `data-images` has files, and nobody has to touch the HTML.
- The lightbox works with the keyboard: Escape, arrow keys, focus in and back, a counter, and loading and error messages. The request access dialog is a native `<dialog>`. Email is its main button, LinkedIn is second and Close is quiet.

## Decisions

- **Type.** Fraunces (display: name, headings, figure labels, contact values) gives the page the feel of a printed handout. Caveat is used only for margin notes and the two drawings, where a teacher's pen would write. Body text uses the system sans stack. All sizes come from one scale of custom properties (13/15/17/20/26/28px, the hero at `clamp(52px, 6vw, 76px)`, plus named sizes for unit numbers, the tagline, contact values and captions). Body text and figure captions are 16px on phones. The section titles are 28px so "Office hours" fits the margin on one line.
- **Colour.** Paper: warm off-white `#f7f3ea`, near-black ink, blue ballpoint `#2a5391` for notes, teal `#0b6b74` for actions and a yellow highlighter. Chalkboard: green-black `#1c2a24`, chalk white and yellow chalk for notes and actions. The highlighter is used once, on the tagline. On the board it becomes a straight stroke of yellow chalk under the words, not a wavy line, so it cannot be taken for a spelling mark or a link. Tool icons are one colour in both themes: a muted ink on paper and chalk on the board. Screenshots are shown unfiltered. Every colour is written once as `light-dark(paper, board)`. Only two image-icon filters need separate dark rules. The report shows 0 contrast failures in all four views.
- **Layout.** A 168px margin column holds the unit numbers and the pen notes. The content column sits to its right. Units 1 to 3 pair the text with a 288px figure. Units 4 and 5 lead with real screenshots, so their figure column is 400px. At 880 to 1119px the columns narrow. Below 880px each figure sits under its unit's text with the caption beside it. Below 640px the margin folds into the column and every unit reads: number and notes, title, description, buttons, figure, then "Built with". Buttons share a line where they fit and take a full line where they do not.
- **Motion.** A short fade and rise (0.4s) as units scroll in. It only runs once JavaScript is active, and anything already on screen appears at once. There are small hovers (owl tilt, highlighter sweep on contact rows). `prefers-reduced-motion` turns it all off. Setup runs again on `pageshow` from the back/forward cache and is safe to repeat.
- **Print.** A small print stylesheet removes the texture and buttons, because it is a handout.

## Copy I wrote

Navigation: "Projects", "Skills", "Contact".

Headings and labels: "Objectives", "Units", "Materials", "Office hours", "Built with" (above each project's tools), "Live demo", "Code on GitHub", "Screenshots", "Request access" (screen readers hear "Request access to the code"), "Close", "Email", "LinkedIn", "GitHub".

Header owl: "class mascot" / "Classroom Chat" (screen readers also hear ", live demo").

Objectives box:
- "Browse five projects: two education tools, two apps and a game."
- "Try a live demo: Classroom Chat or Auto-Prep."
- "Reach Ben: GitHub, LinkedIn or email."

Units:
- "= projects"
- Margin notes: "live demo", "public code", "private code", "used by 100 users", "Android app", "desktop app", "game".
- "Fig. 1 One platform for teachers, parents and students". The drawing labels are "Teachers", "Parents", "Students" and "Classroom Chat".
- "Fig. 2 International and Chinese chess boards in the app"
- "Fig. 3 Slide deck in; worksheets, quizzes and games out". The drawing labels are "Slide deck", "Question bank", "Worksheets", "Quizzes", "Kahoot or Blooket" and "with Claude on Bedrock".
- "Fig. 4 The desktop app starts by asking for a nickname"
- "Fig. 5 A level in play, with the tower menu along the bottom"

Materials: "= skills", "The tools Ben works with, by area."

Office hours: "= contact", "also for access to private code".

Dialog: "a note from Ben" (above "Request access" and your existing text).

Lightbox messages: "Loading…", "No screenshots yet.", "This screenshot could not be loaded.", "The screenshots could not be loaded. Please try again later."

Theme toggle names: "Switch to the chalkboard theme", "Switch to the paper theme".

Alt text: "Ben Mega"; the Classroom Chat drawing is labelled "Classroom Chat connects teachers, parents and students"; "Mega Chess: an international chess board"; "Mega Chess: a Chinese chess board"; "Local Chat: the nickname screen of the desktop app"; "Fractal Defense: a level in play, with the tower menu along the bottom"; the pipeline drawing is labelled "Auto-Prep: a slide deck becomes a question bank, which becomes worksheets, quizzes, and Kahoot or Blooket games". Lightbox images get "<gallery title>, N of M: <file name>". The file name loses its folder and extension, and `_` and `-` become spaces.

Meta description: "Ben Mega is a CS teacher and full-stack developer making programming accessible. He builds education tools (Classroom Chat, Auto-Prep), apps (Mega Chess, Local Chat) and a game (Fractal Defense)." OG description: "Making programming accessible. Education tools, apps and a game by Ben Mega, CS teacher and full-stack developer."

## Notes for Ben

Please decide:

- **Fractal Defense GitHub returns 404.** On 30 September 2026 `https://github.com/benmega/FractalDefense` returned 404, on the website and in the API. The repository is private, renamed or gone. So the "Code on GitHub" button on Unit 5 leads to a GitHub 404 page, and each Screenshots click logs one failed request before the lightbox falls back to the three copies in `assets/fractal-defense/` (listed in a `data-fallback` attribute on the button). Before launch, do one of these: make the repository public again with a `screenshots` folder; point `data-repo`, `data-folder` and the GitHub link at the right repository (your public `benmega/tower-defense` may be the one, but it has no `screenshots` folder); or, if the code stays private, swap the GitHub button for the "Request access" button the other private units use. I left the link as the brief gives it.
- **"used by 100 users"** comes from the Classroom Chat README (the optional fact in the brief). It is one margin note on Unit 1. Delete that `<span>` if you would rather not show it.
- **Local Chat `promotional_graphic.jpg` shows your Wi-Fi name and a LAN address.** It reads "Have them join Wi-Fi 'Bensavinee_5GHz'" and shows `http://192.168.1.102:5000` and a QR code. It is not on the page. The brief requires it in the Local Chat gallery, so visitors see it as the second image in the lightbox. You may want to replace that file with a version without the network name before launch.

Good to know:

- **External fonts:** Google Fonts, Fraunces (500, 600) and Caveat (500, 600), `display=swap`. If they do not load, the fallbacks are Georgia and Segoe Print / cursive. The devicon stylesheet and the Gunicorn, OpenAI and Hugging Face icons come from the same URLs the live site uses.
- **Phone header:** below 640px the three section links are not shown, so the header fits on one row. The Objectives box right under it is itself a `nav` landmark ("Objectives") and links the projects, both demos and all three contact routes, so phones keep a navigation landmark and one-tap routes.
- **Mega Chess figure:** it loads two phone screenshots (`phone_screenshot_4.png` is about 1 MB) to show two board crops. They are lazy-loaded, but on a desktop they sit just below the first screen, so they load almost at once. I kept both, because the two boards are the clearest proof of "international and Chinese chess". A lighter version would need new, resized files, which this brief does not allow.
- **Theme toggle:** optional extra. The page follows the system setting. A manual choice is saved in `localStorage` under `theme`. Choosing the system's own theme clears the saved value.
- **Without JavaScript,** everything can be read. The screenshot buttons, the access buttons and the toggle are hidden, because they could do nothing without it.
- **Browser support:** colours use CSS `light-dark()` (Chrome and Edge 123+, Firefox 120+, Safari 17.5+). Older browsers get the whole paper palette from an `@supports not` block, and the toggle is hidden there. The objective lines use `text-wrap: balance`, which older browsers ignore without harm.
- **`script.js` loads in the head, not deferred.** It is small. This lets it apply a saved theme before the page paints, so a visitor who chose the chalkboard never sees a flash of paper. The rest of the setup waits for `DOMContentLoaded` (and runs again on `pageshow` from the back/forward cache).
- **Lightbox focus:** focus moves to the close button on open. When the lightbox was opened with a mouse or a tap, the focus ring is not drawn (`focus({ focusVisible: false })`, where the browser supports it); with the keyboard it is.
- **Known limits:**
  - On phones the page is about 6.7 screens long at 390 x 844 (8 at 360 x 740). At 360px the first screen ends at Unit 1's title; its Live demo is just below (the same link is in the Objectives box).
  - On a 900px-wide window the tagline wraps to two lines next to the Objectives box.
  - Between 640 and 879px "Office hours" wraps to two lines in the narrower margin.
  - With the page scrolled straight to Materials, the three external icon images can take a moment to appear on a slow connection.
