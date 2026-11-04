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
modules. The themed Inbox panel is a modified copy of the locally installed
Traveler Inbox. The themed Git Graph is a modified copy of the locally installed
https://github.com/rabeeh-ta/herdr-git-graph; it retains its upstream terms and
bundled Lucide icon notice. These copies change asset paths and the panel root
background only. Git Graph dialogs and shared settings continue to use the
existing git-graph module. The original installed modules remain separate.
