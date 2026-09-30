# scripts

## update-galleries.mjs

Keeps every screenshot gallery on the site in sync with the image files on
disk. Plain Node, no packages to install.

    node scripts/update-galleries.mjs            # update, one line per gallery
    node scripts/update-galleries.mjs --check    # write nothing, exit 1 if stale
    node scripts/update-galleries.mjs --quiet    # silent unless something changed
    node scripts/update-galleries.mjs --strict   # for the deploy, see below

It reads every `*.html` file in the repository root, skipping the `live_*`
snapshots. For each `.btn-gallery` button that has a `data-gallery-dir`
attribute it rewrites that button's `data-images` attribute with the images in
the folder. Nothing else in the file changes: same line endings, same
attribute order, same bytes everywhere else. Running it twice changes nothing
the second time.

- Images are `png`, `jpg`, `jpeg`, `gif` and `webp` files directly in the
  folder. Subfolders are not searched.
- Order is natural and ignores case, so `shot_2.png` comes before
  `shot_10.png`. Name the files in the order they should appear.
- `logo.*`, `*.ico` and `*.svg` are left out by default.
- A missing or empty folder is not an error. The list becomes empty and a
  warning is printed. The stylesheet hides a gallery button whose list is
  empty, so the button appears by itself once the folder has images.
- Buttons without `data-gallery-dir` are never touched. That covers
  hand-written `data-images` lists and the galleries loaded from GitHub with
  `data-repo`.

The paths in the list are built from the names on disk, not from the text of
the attribute:

- Letter case follows the disk. `data-gallery-dir="Assets/Shots"` for a folder
  named `assets/shots` lists `assets/shots/...` and prints a warning, on
  Windows and on the Linux deploy runner alike. Correct the attribute when you
  see that warning.
- `assets//shots` and `assets/x/../shots` are written as `assets/shots`.
- `#`, `%` and `?` in folder and file names are encoded. Names with a comma
  cannot be listed, because the lightbox splits the list on commas. They are
  skipped with a warning.
- The folder must be inside the site. A link or junction that leads outside
  of it is refused.

## Add a gallery to a card

1. Put the screenshots in a folder under `assets/`.
2. Add the button to the card's `project-links`, one attribute per line:

   ```html
   <button
     class="btn btn-secondary btn-gallery"
     data-title="My Project Screenshots"
     data-gallery-dir="assets/my-project"
   >
     Screenshots
   </button>
   ```

3. Run `node scripts/update-galleries.mjs`. It adds the `data-images` line
   below `data-gallery-dir`.

To choose what is left out, add `data-gallery-exclude` with a comma separated
list of patterns. Only `*` is special, and the patterns are matched against
file names. The attribute replaces the default list, so repeat `logo.*` if the
folder has a logo:

    data-gallery-exclude="logo.*, *-draft.png"

## Run it on every commit

Enable the versioned hook once per clone:

    git config core.hooksPath .githooks

From then on `.githooks/pre-commit` runs the updater before each commit. When
the updater changed a root `*.html` file during that commit, the hook stages
the file, so `git add assets/my-project` followed by `git commit` records the
new screenshots and the new list together.

The hook stages a page only when that cannot put anything into the commit
that you did not choose. In these cases the page is updated on disk, a line
says why it was not staged, and you stage it yourself:

- The page has other unstaged changes, or is not tracked yet.
- The commit is a partial one: `git commit <paths>` or `git commit --only`.
  Such a commit holds the named paths and nothing else.
- The list names images that are not part of the commit, for example
  screenshots that are still untracked. Keep work in progress out of the
  gallery folders, or stage the images together with the page.

The hook only stages what the updater changed during the commit. A page that
was brought up to date before the commit, by the capture script or by running
the updater by hand, is already changed on disk, so the hook has nothing to
stage. Stage it with the images: `git add assets/my-project index.html`. If
you forget, the hook prints a reminder when the commit contains images of a
gallery folder while the page has unstaged changes.

- The hook never blocks a commit. Without Node it prints a warning and lets
  the commit through.
- Git on macOS and Linux runs a hook only when the file is executable. A
  Windows clone does not record that by itself, so the file is added once with
  `git add --chmod=+x .githooks/pre-commit`. If a clone still says the hook
  is not executable, run `chmod +x .githooks/pre-commit`.

## Deploy

The deploy workflow runs `node scripts/update-galleries.mjs --strict` before
the S3 sync, so the published pages are current even when the hook was
skipped.

- Warnings appear as annotations on the workflow run. The updater prints them
  in that form whenever `GITHUB_ACTIONS` is `true`.
- With `--strict` a gallery that lists images in the committed page must not
  end up empty. If its folder is missing from the checkout the page is left
  as it is, the updater exits with code 2, and nothing is published. A gallery
  whose list is empty already, like a new card that waits for its first
  screenshots, passes with a warning.

## Auto-Prep screenshots

The Auto-Prep card reads `assets/auto-prep`. Until the first screenshots
arrive the folder holds only `.gitkeep`, the list is empty, the updater prints
a warning for it, and the Screenshots button on the card stays hidden.

For now the folder is filled by hand:

1. Copy the screenshots into `assets/auto-prep`. Name them in the order they
   should appear, for example `01_dashboard.png`, `02_question_bank.png`.
2. Run `node scripts/update-galleries.mjs`.
3. Commit the images together with the page:
   `git add assets/auto-prep index.html`.

The auto-prep repository does not have a capture script yet. When it gets
one, this is all it has to do: write the screenshots into `assets/auto-prep`
of this repository, remove the ones that are out of date, and run
`node scripts/update-galleries.mjs` here. It never needs to edit `index.html`
itself.

## Tests

    node --test scripts/

The self-test works in temporary folders and never touches the site. The
tests of the git hook build throwaway repositories in the temporary folder
and are skipped when git is not installed. `scripts/package.json` exists only
so that this command finds the test file on Node 22 and later. It has no
dependencies.
