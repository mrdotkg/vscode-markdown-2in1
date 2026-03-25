import {
  restoreCursorFromPoint,
  setupCursorTracking,
  autoSymbol,
  setupContextSystem,
  openLink,
  imageParser,
  scrollEditor,
  addScrollListener,
  preventBlurPropagation,
  setupFocusManagement,
} from "./util.js";

// ─── Bootstrap ───────────────────────────────────────────────────────────────
const vscode = typeof acquireVsCodeApi !== "undefined" && acquireVsCodeApi();
const events = {};
const state = JSON.parse(document.getElementById("app-config").getHTML());
const EDITOR = "editor";
const rules = state.contextRules || [];

document.getElementById(EDITOR).classList.add(state.platform);
document.body.classList.toggle(
  "scrollBeyondLastLine",
  state.scrollBeyondLastLine,
);

// ─── Messaging ───────────────────────────────────────────────────────────────
window.addEventListener(
  "message",
  ({ data: d }) => d && events[d.type]?.(d.content),
);

window.handler = {
  on: (e, fn) => ((events[e] = fn), window.handler),
  emit: (e, d) => vscode?.postMessage({ type: e, content: d }),
};

let lastNativeKey = null;
const toKeyString = ({ ctrlKey, altKey, shiftKey, key }) =>
  [ctrlKey && "ctrl", altKey && "alt", shiftKey && "shift", key?.toLowerCase()]
    .filter(Boolean)
    .join("+");

// ─── Handlers ────────────────────────────────────────────────────────────────
handler
  .on("updateScrollBeyondLastLine", (v) =>
    document.body.classList.toggle("scrollBeyondLastLine", v),
  )

  .on("updateActiveColorThemeKind", (v) =>
    vditor.setTheme(v === "light" ? "vs" : "vs2015"),
  )

  .on("pasteImageMarkdown", (markdown) => {
    window.vditor.focus();
    window.vditor.insertMD(markdown);
  })

  .on("vditorCommand", (keyEvent) => {
    const nativeHandled = lastNativeKey === toKeyString(keyEvent);
    lastNativeKey = null;

    if (!nativeHandled) {
      // Menu / palette triggered — vditor has no idea, dispatch synthetic keys
      window.vditor.focus();
      // On macOS, replace ctrlKey with metaKey for command key support
      if (state.platform === 'darwin' && keyEvent.ctrlKey) {
        keyEvent.metaKey = true;
        keyEvent.ctrlKey = false;
      }
      ["keydown", "keypress", "keyup"].forEach((t) =>
        (document.activeElement || window.vditor.ir.element).dispatchEvent(
          new KeyboardEvent(t, keyEvent),
        ),
      );
    }
  })

  .on("vditorCut", () => window.vditor.deleteValue())

  .on("vditorPaste", async () => {
    window.vditor.focus();
    const text = await navigator.clipboard.readText();
    if (text) window.vditor.updateValue(text);
  })

  .on("open", (md) => {
    const { config } = md;

    window.vditor = new Vditor(EDITOR, {
      value: md.content,
      height: document.documentElement.clientHeight,
      mode: "ir",
      lang: config.editorLanguage || "en_US",
      tab: "  ",
      toolbarConfig: { tipPosition: "south", hide: config.hideToolbar },
      cache: { enable: false },
      preview: {
        theme: { current: "none" },
        markdown: { toc: false, codeBlockPreview: true },
        hljs: {
          enable: true,
          style: document.body.classList.contains("vscode-dark")
            ? "vs2015"
            : "vs",
          lineNumber: config.previewCodeHighlight.showLineNumber,
        },
        extPath: md.rootPath,
        math: { engine: "KaTeX", inlineDigit: true },
        mode: "editor",
      },
      extPath: md.rootPath,
      input: (c) => handler.emit("save", c),
      upload: {
        url: "/image",
        accept: "image/*",
        handler(files) {
          const reader = new FileReader();
          reader.onloadend = () => handler.emit("img", reader.result);
          reader.readAsBinaryString(files[0]);
        },
      },

      after() {
        
        setupCursorTracking();
        if (md.cursor) {
          console.log("cursor",md.cursor)
          // Vditor render hone ke baad restore karo
          setTimeout(() =>restoreCursorFromPoint(md.cursor), 150);
        }
        autoSymbol(handler, EDITOR, config);

        // Track trusted keystrokes for hotkeys
        document.addEventListener(
          "keydown",
          (e) => {
            if (e.isTrusted) lastNativeKey = toKeyString(e);
          },
          true,
        );

        // Disable Ctrl+' (vditor fullscreen toggle — conflicts with VSCode)
        document.getElementById(EDITOR).addEventListener(
          "keydown",
          (e) => {
            if (e.ctrlKey && e.key === "'") {
              e.preventDefault();
              e.stopImmediatePropagation();
            }
          },
          true,
        );
        // Track current selection for find/replace
        document.addEventListener("selectionchange", () => {
          const text = window.vditor?.getSelection()?.toString() ?? "";
          handler.emit("selectionChange", text);
        });

        // Update editor content on external file update
        handler.on("update", (c) => window.vditor.setValue(c));

        // Open links on Ctrl + Click
        openLink();

        // Track html changes and set updated context to the elements.
        setupContextSystem(document.getElementById("editor"), rules);

        // Stop IR markers from disappearing on blur
        preventBlurPropagation();

        // Track and persist scroll position across file close/open
        addScrollListener();
        scrollEditor(md.scrollTop);

        // Bring back ghost cursor visibly blinking, when editor is focussed
        setupFocusManagement();

        // Show local images into the editor
        imageParser(true);
      },
    });
  })

  .emit("init");
