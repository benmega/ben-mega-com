# 01 — Evolved Brand

## Concept

The same site, grown up. It keeps the dark background, the teal and blue, the round photo with its ring and the owl, so anyone who knows benmega.com sees the same person. Around that it adds what a recruiter needs: a clear statement, two actions, real screenshots and a contact section. What makes it Ben's rather than a template is a small system of **teacher's marks**, drawn by hand in teal: a stroke under "accessible" and under "touch", the same stroke under the nav link for the section in view, and a tick beside each skill area, marked one after another as the list arrives. The hero's dashed compass circle comes back in the corner of the contact panel to close the page. Plus the Classroom Chat owl, perched on the portrait ring and saying what it is. It appears once, in the hero, so it stays a signature.

## What changed for the visitor

- A slim sticky navigation bar (Projects, Skills, Contact, GitHub, LinkedIn). The link for the section in view gets the hand-drawn stroke.
- The hero says who Ben is within five seconds: role, name, "Making programming accessible", one sentence naming the projects, and **See projects** / **Email me**. The text sits on the same left edge as every section below; the portrait sits on the right, inside a dashed compass circle on graph paper.
- The top of the project cards, with their real screenshots, is on the first screen at 1440×900 and larger.
- The photo is shown at 160px (128px on phones), never stretched.
- The owl sits on the photo ring with a "Try Classroom Chat ↗" bubble. It is on the first screen on phone and desktop and covers nothing.
- Every card leads with a picture: the Classroom Chat login form (`assets/classroom-chat-banner.png`, the only real image of the app), Local Chat and Fractal Defense in the same window frame, a Chinese and an international chess board on two Mega Chess phones, and a "slide deck → question bank → worksheet/quiz/game" diagram for Auto-Prep.
- On the Mega Chess phones the screen is shifted up past the black band the app leaves above the board, so the boards fill the part of the phones that shows.
- **The picture opens the gallery.** A "Screenshots" chip in its corner says so, and turns teal on hover and focus. Every card then ends the same way: the live demo if there is one, then Code or Private code. The rows line up, today and after Auto-Prep gets screenshots.
- Tech is shown as text chips, so every technology has a readable name.
- Skills: one row per area. On desktop the tools sit in five columns that line up; below 1120px they wrap at their own width, so there are no orphans on tablets and the section is about half as tall on phones. The chips are flat (no shadow) so they read as labels, not buttons.
- A contact section with email (with a Copy button), LinkedIn and GitHub, plus a footer.
- The request access dialog has Email, LinkedIn and Close. Without JavaScript, "Private code" jumps to the contact section instead.
- Lightbox: the picture uses the whole screen; title, counter and arrows sit together under it, Close in the corner. On a phone a tablet screenshot now fills the width. Escape, arrow keys, swipe, spinner and error messages; focus goes back to the picture that opened it. Each image has its own alt text, from its file name ("Fractal Defense: active gameplay (2 of 3)").
- The Local Chat Screenshots button works now.

## Decisions

- **Type:** Manrope (Google Fonts, one family, weights 400–800). A clean geometric sans with some warmth, tight at display sizes. Fallback: system-ui stack. All sizes are tokens (`--fs-2xs` … `--fs-display`).
- **Colour:** Dark first (`#0b0d11`). The light theme has its own tokens: a cool off-white, white cards, and a darker teal `#0a7078` for text and buttons so they pass AA. Teal is the accent (role line, kickers, primary button, marks, focus ring). Blue appears only in the one gradient moment, the conic ring around the photo, and in one chat bubble. No gradient text. The lightbox has its own tokens and stays dark in both themes.
- **Uppercase** is kept for two things only: the role line and the card kickers. Section headings have no eyebrow; the Projects and Skills ledes sit on the heading's row on wide screens.
- **Layout:** 1136px container, 4px spacing scale (`--s-1` … `--s-9`), one step (64px) on each side of every section boundary. Three featured cards, then "More projects" as two wider cards with pictures of the same height. Below 1120px, Auto-Prep spans the row sideways. On phones everything is one column and card buttons fill the width (44px or taller).
- **Local Chat picture:** the screen is mostly white margin, so the card zooms in on the "Connect a device" header and the QR code, and dims it slightly in dark mode so it is not the brightest thing on the page. Where the picture is 16:10 (below 1120px) it zooms further (1.8×) so the frame always ends above the line that names the Wi-Fi network. The lightbox shows the untouched screenshots.
- **Hero measure** is in rem (42rem), not ch, so the line length does not depend on whether Manrope has loaded when layout first runs.
- **Motion:** the hero rises in over 0.5s, staggered by 40ms, only once JavaScript runs. The "accessible" stroke draws once; "touch" draws when the contact panel scrolls in; the skill ticks are marked top to bottom (0.3s each, 70ms apart). The owl hops twice and then sits still. Scroll reveals last 0.4s, apply only under `html.js`, have a 500ms safety net, and hand the element back when done: the reveal class and the stagger delay are removed, so card hover lifts are immediate. `pageshow` re-runs setup and force-reveals content after a bfcache restore. With `prefers-reduced-motion`, nothing moves.
- **Galleries:** `data-images` is read at click time. At load (and on every `pageshow`) a `data-gallery-dir` gallery whose list is empty is hidden. Today that is Auto-Prep, whose picture is then just the diagram. Once the deploy script fills the list, the chip appears and the first screenshot becomes the card picture in the same window frame as the other desktop projects, with width and height set and alt text from its file name (tested by filling the list with `--eval`; a second `pageshow` adds nothing).
- **Lightbox states:** the arrows show only when there is more than one picture. An empty or failed gallery shows an icon above the message; when GitHub was the source it also offers "View on GitHub".
- **Contact panel:** the heading shares a top edge with the Email row, and the intro column is narrower (4:7), so the rows get the width.

## Copy I wrote

- Meta description: "Ben Mega is a CS teacher and full-stack developer making programming accessible. He builds education tools (Classroom Chat, Auto-Prep), apps (Mega Chess, Local Chat) and a game (Fractal Defense)."
- OG description: "Making programming accessible. Education tools, apps and a game, with live demos, screenshots and source code."
- Hero: "I teach computer science and build education tools like Classroom Chat and Auto-Prep, apps like Mega Chess and Local Chat, and the game Fractal Defense."
- Owl bubble: "Try Classroom Chat"
- Buttons and chips: "See projects", "Email me", "Live demo", "Code", "Screenshots", "Private code", "Copy" / "Copied", "Email", "LinkedIn", "Close", "Back to top"
- Projects: "Things I have built" / "Live demos, screenshots and source code."; subheading "More projects"
- Card kickers: "Education tool", "Android app", "Desktop app", "Game"
- Auto-Prep diagram labels: "Slide deck", "Question bank", "Worksheet", "Quiz", "Game"
- Skills lede: "The tools I work with, by area."
- Contact: "Get in touch" / "Reach me by email, or find me on GitHub and LinkedIn."
- Contact labels: "Email", "LinkedIn", "GitHub"
- Lightbox messages: "This screenshot could not be loaded.", "The screenshots could not be loaded from GitHub. Please try again later.", "There are no screenshots here yet.", link "View on GitHub"; screen-reader status "Email address copied"
- Alt texts: "Mega Chess: a Chinese chess board at the start of a game", "Mega Chess: an international chess board at the start of a game", "Local Chat: the Connect a device screen, with a QR code for joining over Wi-Fi or LAN", "Fractal Defense: the main menu over a painted castle on a mountain at dusk", "Classroom Chat: the Login to Classroom Chat form, with username and password fields". Gallery images: "<Project>: <file name in words> (n of total)", for example "Mega Chess: phone screenshot 4 (4 of 10)". The Auto-Prep card picture, once there is one: "Auto-Prep: <file name in words>" ("Auto-Prep: screenshot 1" if the name has no words).
- Screen-reader names for the picture buttons: "Mega Chess Screenshots", "Auto-Prep Screenshots", "Local Chat Screenshots", "Fractal Defense Screenshots".
- I did **not** use "Used by 100 users."

## Notes for Ben

- **Decide first: the Fractal Defense repository returns 404.** `https://github.com/benmega/FractalDefense` and `https://api.github.com/repos/benmega/FractalDefense/contents/screenshots` returned 404 on 2026-09-30, so the repository is private, renamed or gone, and the card's **Code** link leads to a GitHub 404 page. The brief lists the code as public, so the link stays; the kicker says only "Game" and claims nothing about the repository. If it stays private, turn **Code** into a "Private code" link like the others (`data-open-dialog="access-dialog"`). The gallery still works today: the button carries a `data-fallback` list of the three screenshots in `assets/fractal-defense/`, used when GitHub gives nothing. `update-galleries.mjs` does not touch it (no `data-gallery-dir`).
- **The Local Chat screenshot shows your home network.** `promotional_graphic.jpg` contains the line "Have them join Wi-Fi 'Bensavinee_5GHz' … http://192.168.1.102:5000". The card picture is cropped above that line at every width, but the lightbox shows the full screenshot. Consider replacing the asset with one where that line is blurred.
- **External resources:** Google Fonts (Manrope), the devicon stylesheet, and the Gunicorn, OpenAI and Hugging Face icons the site already uses. Without the CDNs, every skill still shows its name.
- The gallery buttons (`.btn-gallery`) are now the card pictures, not buttons in the card footer. `update-galleries.mjs` finds them by class and attribute, not by tag or position, so it works unchanged (checked in its source).
- The email Copy button only appears where the Clipboard API is available (HTTPS or localhost).
- Classroom Chat has no app screenshots, so its card shows `assets/classroom-chat-banner.png` (578 × 410, the login form: "Login to Classroom Chat", username, password, Login button) in a window frame. It has no gallery, so the picture is not clickable. A screenshot of the chat itself would sell the project better.
- The skills table lists tools beyond the five projects (Firebase, PyTorch, OpenAI, Hugging Face, ComfyUI, Nginx, Gunicorn, GitHub Actions, Linux), which is why its lede only says "by area".
