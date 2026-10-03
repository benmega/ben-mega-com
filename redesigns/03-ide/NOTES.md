# The Editor — NOTES

## 1. Concept

benmega.com opened in a code editor. You get an explorer, tabs, numbered lines and a status bar, and each project is a file with a preview pane beside it, the way a Markdown preview sits next to its source. The editor is only the frame. Inside it are ordinary headings, sentences and buttons, so a recruiter who has never opened an editor still reads a normal page, while a developer notices the details. It suits a CS teacher: the page looks like the place where he works and teaches.

## 2. What changed for the visitor

- The first screen shows who Ben is (name, role, tagline, a one-line intro, a 152 px photo) and a **Live demos** row. That row links straight to Classroom Chat, with the owl, and to Auto-Prep. Two live projects are one click away on desktop and on phone. On phones the hero has one action (See the projects); GitHub, LinkedIn and Email live in the bottom bar, so nothing is shown twice.
- Contact is always in reach. On desktop the teal status bar holds GitHub, LinkedIn and Email. On phones they sit in a fixed bottom bar with visible labels, and the footer keeps the copyright line.
- Navigation: the explorer (desktop, 1181 px and up) and the tab bar (all sizes) follow your scroll. So do the title bar, the breadcrumb and the language shown in the status bar (Markdown or JSON).
- Every project shows a real preview on the page: the Classroom Chat sign-in screen (`classroom-chat-banner.png`, the only picture of the app), two Mega Chess phones (the game list with Chinese and international games in front, the start screen behind), the Local Chat start screen and the Fractal Defense menu. Auto-Prep has no screenshots yet, so its pane draws the slide-deck → question-bank → games flow and is labelled `auto-prep · how it works`. The owl appears once, in the Live demos card on the first screen.
- Every technology has a visible text label, and every chip icon is in one grey tone (brand-coloured logos are desaturated; SQLAlchemy, Nginx and Pygame, whose logos are unreadable wordmarks at 15 px or missing, get a neutral dot).
- Skills are shown as a readable `skills.json`. When its section is narrower than 840 px (tablets, phones, small laptops) each array is pretty-printed, one level deeper, so the brackets never break away from their tags.
- On phones each project has one solid button at its own width and its second action (Source on GitHub, Request code access) as a quiet underlined text button beside or under it, so the page is not a stack of full-width slabs.
- Galleries: the lightbox works with the keyboard (arrow keys, Escape, focus returns to the button). It also has swipe, a counter (read as "Screenshot 2 of 10"), the file name, an alt text built from the project and file name ("Mega Chess, phone screenshot 2"), and loading and error states. The Local Chat button works now. Auto-Prep's button stays hidden while `data-images` is empty and appears with a count once the deploy script fills it (tested).
- Request access is a native `<dialog>` with LinkedIn, Email and Close, designed for both themes. Without JavaScript the same links open an email; with it they get `role="button"` and `aria-haspopup="dialog"` and open with Enter or Space.

## 3. Decisions

- **Type.** IBM Plex Mono is the editor's type (chrome, tags, file names, labels). IBM Plex Sans is for the content (headings, prose, buttons). That is 2 families from Google Fonts with `display=swap` and system fallbacks. Body text is 17 px (16 px on phones, including the Live-demo card text and the comment line; URLs are 15 px; only tags and editor chrome go smaller). The type scale is 12/13/15/17/22/26/34/58.
- **Colour.** Syntax colours are the visual language: markdown heading marks in keyword purple, tech tags as strings (amber), JSON keys in blue, actions and links in function teal, the tagline and facts as comments. Dark was designed first. Light is its own warm "paper and ink" palette with a pale-yellow current-line highlight, not an inverted dark. Both use the same teal status bar, as editors do. Every colour is a token written once as `light-dark()`, with the same two palettes written out as plain hex in an `@supports not (color: light-dark(...))` block for older browsers.
- **Layout.** 4 px based spacing (4–96). Featured projects sit in two columns, source and preview, separated by space only; hairlines mark only the boundaries between files (README, projects, skills, contact). The two other projects are a pair of cards under "More projects". Below 1180 px the explorer goes and the tab bar remains. Below 880 px previews move under their text and take the full text width. The JSON layout follows the width of its own section (a container query), not the window, because the explorer comes and goes. On phones the title bar scrolls away, the four tabs fit the width, the photo sits beside the name, and every project reads text first, then its preview.
- **Accessibility.** Line numbers, `#`/`##`/`###`, quotes, brackets and commas are CSS generated content with empty alt text (`content: "#" / ""`). Where that isn't possible they are `aria-hidden`, so screen readers hear only the content. The window title bar is `aria-hidden`; the banner landmark is the tab bar with the Sections navigation. The page has landmarks, one h1, ordered headings, a skip link, visible focus and 44 px tap targets on phones.
- **Lightbox.** On desktop the image fills the stage. On phones the image and its arrows sit together in the middle of the screen, so a landscape screenshot is not stranded in a tall empty field.
- **Motion.** Motion is minimal: preview panes that start off screen fade in over 0.3 s, and the tagline cursor blinks five times, then rests. Nothing on the first screen is ever hidden. With `prefers-reduced-motion` all of it is off. Setup runs again on `pageshow` and is safe to repeat.

## 4. Copy I wrote

Page text:
- "I teach computer science and build education tools, Android and desktop apps, and a tower defense game."
- "See the projects"
- "Live demos"
- "Gamified classroom platform for teachers, parents and students"
- "AI lesson prep: slide decks into quizzes and games"
- "Classroom tools, an Android app, a desktop app and a Pygame game."
- "More projects"
- "Tools I work with, by area."
- "For work, or for questions about Classroom Chat and Auto-Prep, email me or find me on LinkedIn."
- Button labels: "Live demo", "Source on GitHub", "Screenshots", "Request code access", "Email", "Close".
- Preview labels: "Slide deck", "Question bank", "Worksheets", "Quizzes", "Kahoot", "Blooket", "AWS · Claude on Bedrock", "classroom-chat · sign in", "auto-prep · how it works", "mega-chess · Android", "local-chat · Desktop", "fractal-defense · Pygame", "private repository".
- Lightbox messages: "Loading…", "This screenshot could not be loaded.", "The screenshots could not be loaded from GitHub. Please try again later.", "No screenshots yet."

Head and screen-reader text:
- Meta description: "Ben Mega is a CS teacher and full-stack developer making programming accessible. Education tools, apps and a game: Classroom Chat, Auto-Prep, Mega Chess, Local Chat and Fractal Defense."
- OG description: "Making programming accessible. Education tools, apps and a game, with live demos and screenshots."
- Alt texts:
  - "Portrait of Ben Mega"
  - "Classroom Chat sign-in screen: a Login to Classroom Chat heading, Username and Password fields and a Login button"
  - "Mega Chess game list on a phone: Chinese chess and international chess games against john, each marked active, above a Play button"
  - "Mega Chess start screen on a phone: pick an opponent, choose international or Chinese chess, then Play or Find a Friend"
  - Lightbox images: "<Project>, <file name in words>", e.g. "Mega Chess, phone screenshot 2"
  - "Local Chat's start screen: the app logo, a Nickname field and a Continue button"
  - "Fractal Defense main menu over a painted castle on a cliff: New Game, Endless Mode, Load Game, Settings, Shop and Achievements"
- Other names: "How Auto-Prep works", "Built with", "Skip to content", "Switch to light theme" / "Switch to dark theme" (visible label "Light theme" / "Dark theme": icon and label both name the theme a click switches to), "Close screenshots", "Previous screenshot", "Next screenshot", "Screenshot N of M", "<Project> Screenshots (N images)".

Fact from the README: "Used by 100 users", tightened to the comment line **"// 100 users"** under Classroom Chat. Delete that one line (`<p class="note">`) if you'd rather not show it.

## 5. Notes for Ben

- **Fractal Defense repo returns 404.** `github.com/benmega/FractalDefense` and `api.github.com/repos/benmega/FractalDefense/contents/screenshots` both answer 404 today. The repo is private or renamed (your public list has `benmega/tower-defense`). So the "Source on GitHub" link is dead, and the GitHub-fetched gallery fails. I kept the required attributes and added `data-fallback-images` with the three local screenshots. If GitHub fails, the lightbox shows those instead of an error. Fix the link or the repo name.
- **Local Chat preview.** The page shows `app_ui_mockup.jpg`. `promotional_graphic.jpg` stays in the gallery only, because it shows your Wi-Fi name ("Bensavinee_5GHz") and a LAN IP. Remove it from the folder if you'd rather not publish that at all.
- **Wording fixes.** "peer to peer" became "peer-to-peer", and "without relying on internet connection" became "without relying on an internet connection".
- **Fonts:** IBM Plex Mono and IBM Plex Sans from Google Fonts. The only other externals are the devicon stylesheet and the Gunicorn, OpenAI and Hugging Face icons. If the CDNs fail, the tags keep their text labels.
- **Browser support:** the JSON pretty-print uses a container query (Chrome 105+, Safari 16+, Firefox 110+); without it the arrays stay on one line with the tags wrapping inside the brackets. Colours use CSS `light-dark()` (Chrome/Edge 123+, Safari 17.5+, Firefox 120+). Older browsers get the same palettes from a plain-hex fallback block and follow the system theme and the toggle. They still need `color-mix()` (Safari 16.2+) for two small tints, and the `content: "…" / ""` alt-text syntax for the markdown/JSON marks (Safari 17.4+, Firefox 128+); where that syntax is missing, those marks are simply not drawn.
- **Preview images.** The page shows `phone_screenshot_1.png` (412 KB) and `_2.png` (271 KB) for Mega Chess, all lazy-loaded and below the first screen. The 1 MB Chinese chess board (`_4`, mostly black above and below the board) is only in the gallery now.
- **Classroom Chat preview** is the sign-in screen, 578 px wide. It is sharp on desktop and a little soft on high-density phones. A real screenshot of the chat itself would be the best upgrade to the page: drop it in and change one `src`.
- **Project logos not used.** The Mega Chess, Local Chat and Fractal Defense logos are 250–270 KB each, too heavy for small icons, and the screenshots identify the projects better.
- **Theme toggle** sits in the status bar and is saved in `localStorage`. Without a saved choice the page follows the system setting.
- **Without JavaScript** everything reads. The title bar and breadcrumb stay on "README.md", gallery buttons stay hidden, and the code-access buttons open an email.
- **QA:** the automatic report is clean for all four views, with no lines left to explain. The one console line in the interaction runs is the expected 404 from the GitHub API when the Fractal Defense gallery is opened (see above); the lightbox then shows the three local screenshots.
