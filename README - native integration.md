Here’s your **Complete VS Code Native Integration Master Table** formatted cleanly in Markdown for easy reference:

# 📘 VS Code Native Integration


| Category       | Item / Feature     | Native Variable / Setting                     | Implementation Detail                                   |
| -------------- | ------------------ | --------------------------------------------- | ------------------------------------------------------- |
| **Typography** | Font Family        | `--vscode-editor-font-family`                 | Set on`#editor`. Usually Consolas or Monaco.            |
|                | Font Size          | `--vscode-editor-font-size`                   | Base text size (usually 12px–14px).                    |
|                | Font Weight        | `--vscode-editor-font-weight`                 | Matches user preference (e.g.,`normal` or `bold`).      |
|                | Line Height        | `--vscode-editor-line-height`                 | Crucial for vertical rhythm; use as line-height.        |
|                | Letter Spacing     | `editor.letterSpacing`                        | Set CSS`letter-spacing` to match the editor’s density. |
| **Canvas**     | Main Background    | `--vscode-editor-background`                  | The primary canvas color.                               |
|                | Main Foreground    | `--vscode-editor-foreground`                  | The primary text color.                                 |
|                | Selection          | `--vscode-editor-selectionBackground`         | Color for selected text ranges.                         |
|                | Inactive Selection | `--vscode-editor-selectionBackgroundInactive` | Selection color when the editor loses focus.            |
| **Cursor**     | Caret Color        | `--vscode-editorCursor-foreground`            | The color of the blinking line.                         |
|                | Cursor Style       | `editor.cursorStyle`                          | Switch between line, block, or underline.               |
|                | Blink Animation    | `editor.cursorBlinking`                       | CSS animation type: blink, smooth, phase, or solid.     |
| **Gutter**     | Line Numbers       | `--vscode-editorLineNumber-foreground`        | Color for numbers in the margin.                        |
|                | Active Line Num    | `--vscode-editorLineNumber-activeForeground`  | Color for the number where the cursor sits.             |
|                | Indent Guides      | `--vscode-editor-indentGuide-background`      | Vertical lines indicating indentation levels.           |
| **Scroll**     | Slider (Thumb)     | `--vscode-scrollbarSlider-background`         | Scrollbar thumb color.                                  |
|                | Slider Hover       | `--vscode-scrollbarSlider-hoverBackground`    | Thumb color when hovered.                               |
|                | Scroll Shadow      | `--vscode-scrollbar-shadow`                   | Subtle shadow at the top of the scroll area.            |
|                | Overscroll         | `editor.scrollBeyondLastLine`                 | If true, add`padding-bottom: 50vh`.                     |
| **Feedback**   | Ruler / Guide      | `--vscode-editorRuler-foreground`             | Vertical line for character limits (e.g., at 80 chars). |
|                | Search Match       | `--vscode-editor-findMatchBackground`         | Highlight for the currently selected search result.     |
|                | Hover Widget       | `--vscode-editorHoverWidget-background`       | Background for “peek” or documentation hovers.        |
| **Navigation** | Breadcrumbs        | `--vscode-breadcrumb-foreground`              | Text color for path/header navigation at the top.       |
|                | Active Breadcrumb  | `--vscode-breadcrumb-focusForeground`         | Color when hovering/focusing a path segment.            |
| **Logic**      | Word Wrap          | `editor.wordWrap`                             | Toggle CSS`overflow-wrap: break-word`.                  |
|                | Smooth Scroll      | `editor.smoothScrolling`                      | Toggle`scroll-behavior: smooth`.                        |
|                | Tab Size           | `editor.tabSize`                              | Set CSS`tab-size` to match (usually 2 or 4).            |

---

## 💡 Implementation "Pro-Tips" for Total Immersion

- **Active Line Highlight**: Use `--vscode-editor-lineHighlightBackground` as background for the line with the cursor.
- **Focus Border**: When user clicks inside `#editor`, show a border/outline using `--vscode-focusBorder`.
- **Whitespace Characters**: If `editor.renderWhitespace` is on, use a CSS pseudo-element (`::after`) on spaces to render a tiny dot with `--vscode-editorWhitespace-foreground`.

---

This table is now **Markdown-ready** for documentation, GitHub repos, or internal notes.
