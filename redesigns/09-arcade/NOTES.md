# 09 - Arcade

## Concept

The page is set up like a game's front end. The header is a HUD, the hero is a title screen with a start menu, the projects are a "stage select", the skills are an inventory and the contact section is a "Continue?" screen. The Classroom Chat owl is the companion character, with a speech box on the title screen. Ben builds a gamified classroom platform, a chess app and a tower defense game, so the game language fits his work. The type does most of the serious work: a pixel face is used for headings only, all reading text is set in Atkinson Hyperlegible Next, and the site has no XP, levels or scores.

## What changed for the visitor

- The first screen shows name, role, tagline, the photo (128 to 144 px, never upscaled), "Select project" and "Contact" buttons, GitHub, LinkedIn and email, and the owl link to Classroom Chat with a label saying what it is.
- A sticky HUD with Projects, Skills and Contact links. A pixel cursor marks the section you are reading. There is also a theme toggle, and your choice is saved.
- Every project card shows a real screenshot or a drawn "screen" in a console bezel. The Mega Chess card shows its two boards, international and Chinese, cropped large from one real screenshot of the app. Local Chat shows its "Connect a device" screen, cropped so the line with your Wi-Fi name and local IP stays off the page. Fractal Defense shows its gameplay. Classroom Chat and Auto-Prep have no app screenshots, so their cards show pixel illustrations drawn from the descriptions: teacher, parent and student messages (drawn as plain grey text lines, never as bars) for Classroom Chat, and slides → questions → worksheet, quiz or game for Auto-Prep.
- Every tech chip and skill slot shows its name as visible text. On phones the skills are an RPG-style item list (icon in its slot, name beside it, two columns), so the whole inventory fits in about one screen.
- A contact section with large tap targets, a closing call to action, and a footer.
- The Local Chat "Screenshots" button now works. Private repositories open a native `<dialog>` with Email, LinkedIn and Close buttons.
- The lightbox works with the keyboard (Esc, arrow keys, Home and End) and with swipes. The image and a "◀ 1 / 10 ▶" selector sit together in the middle of the screen, so the arrows are always right under the image, on phones too. It shows loading and failure states and returns focus to the button that opened it.

## Decisions

- **Type.** Headings use "Jersey 10", a condensed pixel face that stays readable at display sizes. It is used only at 20 px and larger: h1, h2, h3, labels, the HUD links and the counters. All sizes are tokens in `:root` (`--t-xs` to `--t-ui-lg` for reading text, `--t-tag` to `--t-h1` for display); the text inside the SVG illustrations is sized in viewBox units in the markup, so it scales with the screen. Body text, buttons and chips use "Atkinson Hyperlegible Next", which was designed for legibility. That keeps the page readable for recruiters and fits "making programming accessible".
- **Colour, dark ("night cabinet").** Deep navy with coin gold (`#ffc94d`) for primary actions and cyan (`#62e4e9`) for the tagline, links and focus. The only glow is on the h1, on hovered buttons and on the "Live" LED.
- **Colour, light ("daytime handheld").** Designed on its own terms, not inverted: putty paper, slate bezels, a four-green LCD palette on the illustrated screens, berry "A button" actions (`#a3245e`) and hard ink outlines with offset pixel shadows instead of glow. The night sky becomes a sun and clouds. The "Live" LED is green in both themes. Devicon's pale brand colours (React, Tailwind, AWS, Firebase, Python) get deeper shades on the light theme through colour tokens, so the chips do not wash out. The JavaScript logo keeps its brand yellow in both themes with black letters, like the official logo.
- **Pixel frames.** Frames are four offset box-shadows that leave the corner pixels out, so every panel has stepped pixel corners without images. Card hover and focus snap a corner-bracket "selection reticle" in around the card.
- **Layout.** Featured projects sit in a three-column row from 1024 px up. The cards in a row share their rows through CSS subgrid, so screens, titles, text, chips and buttons line up across the row and the spare height is spread out instead of pooling above the buttons. From 640 to 1023 px each card is wide, with the screen on the left. On phones the cards stack. The inventory is one row of slots per area on a five-slot column grid; from 1024 px the Skills heading sits beside it and stays in view while you scroll. Only real skills get a slot: no empty filler cells. Sections are 64 px apart on desktop. The spacing scale is 4, 8, 12, 16, 24, 32, 48, 64 and 96 px.
- **Phones.** Chip and skill labels are 16 px on phones, stepping down to label size from 640 px, where cards and slots are roomier. Below 640 px the inventory is a two-column item list instead of square slots.
- **Title menu.** Both menu labels are centred. The pixel cursor hangs to the left of the selected label without pushing it, so "Contact" never looks off centre.
- **Motion.** Button presses and the owl hop use steps() timing, like sprites. Reveals are 0.3 s and apply only to items that start below the first screen, so nothing visible is ever hidden. A bfcache restore clears any pending reveals, and running setup twice is harmless. The blinking cursor, the twinkling stars and the bobbing arrow in the owl's speech box each run a few cycles and then stop. Reduced motion turns all of this off.
- **Galleries.** `data-images` is read when the button is clicked. The Auto-Prep button is hidden at load while its list is empty. When the list has files, the button appears on the lower right of the card's screen, and the first screenshot replaces the Auto-Prep illustration (`data-cover`). The button sits on the screen rather than in the action row, so Auto-Prep keeps two buttons (Live demo, Code) in line with its neighbours. Escape closes the lightbox for real and synthetic key events. If GitHub fails and there is no local fallback, the message offers a link to the repository.
- **Skill slots are not interactive,** so they have no hover effect.

## Copy I wrote

Headings, labels and buttons:
"Stage select", "Featured", "More projects", "Inventory", "Continue?", "Companion", "Classroom Chat mascot", "Open the live platform", "Select project", "Contact", "Live demo", "Code", "Code (private)", "Screenshots", "More on GitHub", "Private repository", "Request access", "Live", "Android", "Desktop", "Game".

Sentences:
- "Education tools, apps and a game. Live demos and code where they are public; private repositories on request."
- "The code for Classroom Chat and Fractal Defense is public. Browse all of Ben's public repositories on GitHub."
- "The tools Ben works with, sorted by area."
- "Hiring for a developer or ed-tech role, or curious about one of the tools? Say hello."
- Meta description: "Ben Mega is a CS teacher and full-stack developer making programming accessible. Education tools, apps and a game: Classroom Chat, Mega Chess, Auto-Prep, Local Chat and Fractal Defense."
- OG description: "Making programming accessible. Education tools, apps and a game, with live demos, screenshots and code."

Illustration text: "Teacher", "Parent", "Student", "Slides", "Questions", "Worksheet", "Quiz", "Game". Board labels on the Mega Chess card: "International", "Chinese". Accessible title of the Auto-Prep illustration: "Slide decks become a question bank, then worksheets, quizzes and games".

Alt text: "Auto-Prep: first screenshot" (set by the script when screenshots exist), "Mega Chess international chess board", "Mega Chess Chinese chess board", "Local Chat 'Connect a device' screen: other devices join over Wi-Fi or LAN by scanning a QR code", "Fractal Defense gameplay: a stone path across the map, the wave bar and the tower shop", "Classroom Chat owl logo".

Lightbox states: "Loading", "This image could not be loaded", "No screenshots yet", "Loading from GitHub", "No screenshots found", "Could not load the screenshots from GitHub", "Open the repository on GitHub".

I did not use "Used by 100 users".

## Notes for Ben

- **External fonts:** Google Fonts "Jersey 10" and "Atkinson Hyperlegible Next" (`display=swap`). Fallbacks are Arial Narrow / Arial and Segoe UI / system-ui. The devicon stylesheet and the three external icons (Gunicorn, OpenAI, Hugging Face) are the same ones the current site uses.
- **Fractal Defense screenshots:** today `https://api.github.com/repos/benmega/FractalDefense/contents/screenshots` returns **404**, so the current site's button fails too. I added a `data-fallback` attribute with the three local images in `assets/fractal-defense/`. The lightbox shows those when GitHub fails or the folder is empty. The browser still logs the 404 in the console. The screenshot tool reports this line only when the button is clicked. The page itself cannot suppress it. If you add a `screenshots` folder to the repository (or change `data-folder`), GitHub is used again.
- `script.js` is loaded in `<head>` without `defer`, so a saved light or dark choice applies before first paint. The rest waits for DOMContentLoaded.
- Without JavaScript all content is readable. The theme toggle, the Screenshots buttons and the "Code (private)" buttons are hidden, because they need a script.
- The card images are fixed, hand-picked crops written in the HTML and CSS: Mega Chess uses `tablet_screenshot_2.png` twice (one crop per board), Local Chat uses `promotional_graphic.jpg`. The crop offsets are pixel positions in those files, noted in `styles.css`. If you replace either file, check its card. The Local Chat card crop stops above the line with your Wi-Fi network name and local IP address; the full image, with that line, is still in the Local Chat gallery (as on the current site). Crop it out of the file if you would rather not publish it at all.
- The card rows use CSS subgrid (all current browsers). An older browser falls back to plain equal-height cards.
- The theme toggle is optional under the brief. I kept it because the light theme is a separate design worth seeing.
- Known limits: devicon's Python icon is yellow on dark, so on the light theme I set it to Python blue for contrast. Brand icons such as AWS stay in their own colours. The icons are decorative, and each has a text label.
