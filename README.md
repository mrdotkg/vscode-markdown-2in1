Markdown editor with live preview. No separate tab.

# MarkPen for VSCode

## Pre market release **issues**

* CSS
  * Mardown font size, editor font size integration.
  * Initial pre HLJS code block white-space and max-heights are different to
* Expose Copy operation.
* When inside a code block editing, Select all code  block with `Ctrl+A` hotkey is not working.
* README + icon + .vscodeignore + package.json — publish
* Test Windows/Mac/Linux — publish se pehle zaroori

### Fixed

* Cut now copies the text as well.
* There is no scroll on focus now, no flickering on tab click
* Statusbar shopw, hide and update is consistent with UI.
* All hotkeys will run at webviewfocus, so theya re free for vscode once the focus is lost.
