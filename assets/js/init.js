import {
  annotateBlocks,
  openLink,
  imageParser,
  scrollEditor,
  addScrollListener,
  preventBlurPropagation,
  setupFocusManagement,
} from "./util.js";

const vscode = typeof acquireVsCodeApi !== "undefined" && acquireVsCodeApi();
const events = {};
const editorContainerId = "editor";

const state = JSON.parse(document.getElementById("app-config").getHTML());
// Context rules injected from TS side via ContextRegistry
const contextRules = state.contextRules || [];
document.getElementById(editorContainerId).classList.add(state.platform);
document.body.classList.toggle(
  "scrollBeyondLastLine",
  state.scrollBeyondLastLine,
);

window.addEventListener(
  "message",
  ({ data: d }) => d && events[d.type]?.(d.content),
);

window.handler = {
  on: (e, fn) => ((events[e] = fn), window.handler),
  emit: (e, d) => vscode?.postMessage({ type: e, content: d }),
};

handler
  .on("updateScrollBeyondLastLine", (v) =>
    document.body.classList.toggle("scrollBeyondLastLine", v),
  )
  .on("updateActiveColorThemeKind", (v) =>
    vditor.setTheme(v === "light" ? "vs" : "vs2015"),
  )
  .on("vditorCommand", (keyEvent) => {
    window.vditor.focus();
    ["keydown", "keypress", "keyup"].forEach((t) =>
      (
        document.activeElement ||
        window.vditor.ir.element ||
        window.vditor.wysiwyg.element
      ).dispatchEvent(new KeyboardEvent(t, keyEvent)),
    );
    annotateBlocks(document.getElementById(editorContainerId), contextRules);
  })
  .on("open", (md) => {
    const { config } = md;
    window.vditor = new Vditor(editorContainerId, {
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
        handler.on("update", (c) => window.vditor.setValue(c));
        openLink();
        annotateBlocks(document.querySelector(".vditor"), contextRules);
        setTimeout(preventBlurPropagation, 50);
        addScrollListener();
        scrollEditor(md.scrollTop);
        setupFocusManagement();
        imageParser(true);
      },
    });
    document.getElementById(editorContainerId).addEventListener(
      "keydown",
      (e) => {
        // Disable Ctrl+' (fullscreen toggle)
        if (e.ctrlKey && e.key === "'") {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      },
      true,
    );
  })
  .emit("init");
