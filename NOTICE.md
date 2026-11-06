# Sources and notices

The four `mods/husky-*` modules and the layout are modified from the locally
installed Traveler package, https://github.com/franky5440-afk/herdr-traveler.
Traveler code is distributed under Apache-2.0; see `LICENSE`.
Traveler chrome, spaces and tabs in turn derive from Herdr's built-in modules.
Each modified entry point records its modification at the top of the file.

Changes: light snowfield palette; two-husky character and state art; badge and
empty-state art; native working-state pulse; compact agent rail; independent
asset paths. Existing terminal, navigation, panel and Git query behavior is retained.

The locally installed Traveler version predates the current upstream sprite
implementation. No Traveler raster art is included in this package.

`artwork/` contains generated images of the two dogs and supporting art, supplied
by the theme owner. Those files and their derivatives under `mods/` are outside
the code license.

The themed Files and Changes panels are modified copies of Herdr's built-in
modules. The themed Git Graph is a modified copy of the locally installed
https://github.com/rabeeh-ta/herdr-git-graph; it retains its upstream terms and
bundled Lucide icon notice. These copies change asset paths and the panel root
background only. Git Graph dialogs and shared settings continue to use the
existing git-graph module. The original installed modules remain separate.

`mods/husky-music` is modified from the yt-music mod of
https://github.com/cybertron288/herdr-mods/tree/main/yt-music (MIT, Copyright (c) 2026
cybertron288; the licence text is kept in `mods/husky-music/LICENSE-yt-music.txt`).
Local change: the daemon controls the local Apple Music app through its AppleScript
dictionary instead of a YouTube Music tab in Chrome; theme colors and sidebar placement.
Its icons are Lucide (ISC), copied unchanged from yt-music.

`mods/husky-lyrics` ports the LRC parsing, current-line and two-step lrclib lookup
(`/api/get`, then `/api/search`) from the author's own MusicTUI project
(`tools/music/Sources/TUI/Lyrics.swift`, `Backends/LRCLibClient.swift`). The Lyrics
button icon is Lucide `music` (ISC).

`mods/file-icons` is a modified copy of the file-icons mod from
https://github.com/cybertron288/herdr-mods/tree/main/file-icons, which is itself
modified from Herdr's built-in `files` module (Apache-2.0,
https://github.com/herdrdev/herdr-app). Its `icons/` are taken from Material Icon
Theme 5.40.0 (MIT, Copyright (c) 2025 Material Extensions); the license text is kept
in `mods/file-icons/LICENSE-material-icon-theme.txt` and must ship with the icons.
Local change: the panel background is `chrome` plus an alpha (default `99`,
overridable with the layout's `props.alpha`) so the panel's background art shows through.
